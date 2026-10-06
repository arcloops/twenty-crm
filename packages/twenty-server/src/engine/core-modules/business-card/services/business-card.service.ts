import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Readable } from 'stream';

import { isNonEmptyString } from '@sniptt/guards';
import { msg } from '@lingui/core/macro';
import { FileFolder } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { ILike, type Repository } from 'typeorm';

import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { BusinessCardExtractionDTO } from 'src/engine/core-modules/business-card/dtos/business-card-extraction.dto';
import { BusinessCardOcrService } from 'src/engine/core-modules/business-card/services/business-card-ocr.service';
import { parseBusinessCardText } from 'src/engine/core-modules/business-card/utils/parse-business-card-text.util';
import { FileStorageService } from 'src/engine/core-modules/file-storage/services/file-storage.service';
import { FileEntity } from 'src/engine/core-modules/file/entities/file.entity';
import {
  FileException,
  FileExceptionCode,
} from 'src/engine/core-modules/file/file.exception';
import { FILE_STATUS } from 'src/engine/core-modules/file/types/file-status.types';
import { removeFileFolderFromFileEntityPath } from 'src/engine/core-modules/file/utils/remove-file-folder-from-file-entity-path.utils';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

@Injectable()
export class BusinessCardService {
  constructor(
    private readonly businessCardOcrService: BusinessCardOcrService,
    private readonly fileStorageService: FileStorageService,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    @InjectWorkspaceScopedRepository(FileEntity)
    private readonly fileRepository: WorkspaceScopedRepository<FileEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
  ) {}

  async extractPersonFromBusinessCard({
    fileIds,
    workspaceId,
  }: {
    fileIds: string[];
    workspaceId: string;
  }): Promise<BusinessCardExtractionDTO> {
    const uniqueFileIds = Array.from(
      new Set(fileIds.filter((fileId) => isNonEmptyString(fileId))),
    );

    if (uniqueFileIds.length === 0) {
      throw new FileException(
        'At least one business card image is required',
        FileExceptionCode.FILE_NOT_FOUND,
        {
          userFriendlyMessage: msg`At least one business card image is required`,
        },
      );
    }

    const sideTexts: string[] = [];

    for (const fileId of uniqueFileIds) {
      sideTexts.push(
        await this.recognizeUploadedImageText({
          fileId,
          workspaceId,
        }),
      );
    }

    const rawText = sideTexts.filter(isNonEmptyString).join('\n\n');
    const parsed = parseBusinessCardText(rawText);

    const companyId = await this.resolveCompanyId({
      companyName: parsed.companyName,
      website: parsed.website,
      workspaceId,
    });

    return {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      jobTitle: parsed.jobTitle,
      emails: parsed.emails,
      phones: parsed.phones,
      website: parsed.website,
      companyName: parsed.companyName,
      companyId,
      rawText,
      warnings: parsed.warnings,
      fileId: uniqueFileIds[0],
      fileIds: uniqueFileIds,
    };
  }

  private async recognizeUploadedImageText({
    fileId,
    workspaceId,
  }: {
    fileId: string;
    workspaceId: string;
  }): Promise<string> {
    const file = await this.fileRepository.findOne(workspaceId, {
      where: {
        id: fileId,
        status: FILE_STATUS.UPLOADED,
      },
    });

    if (!isDefined(file)) {
      throw new FileException(
        'Uploaded file not found',
        FileExceptionCode.FILE_NOT_FOUND,
        {
          userFriendlyMessage: msg`Uploaded file not found`,
        },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimeType.toLowerCase())) {
      throw new FileException(
        `Unsupported mime type: ${file.mimeType}`,
        FileExceptionCode.INVALID_FILE_FOLDER,
        {
          userFriendlyMessage: msg`Business card must be a PNG, JPEG, or WebP image`,
        },
      );
    }

    const [fileFolder] = file.path.split('/');
    const application = await this.applicationRepository.findOne({
      where: {
        id: file.applicationId,
        workspaceId,
      },
    });

    if (!isDefined(application)) {
      throw new FileException(
        'File application not found',
        FileExceptionCode.FILE_NOT_FOUND,
        {
          userFriendlyMessage: msg`Uploaded file not found`,
        },
      );
    }

    const stream = await this.fileStorageService.readFile({
      resourcePath: removeFileFolderFromFileEntityPath(file.path),
      fileFolder: fileFolder as FileFolder,
      applicationUniversalIdentifier: application.universalIdentifier,
      workspaceId,
    });

    const imageBuffer = await streamToBuffer(stream);

    return this.businessCardOcrService.recognizeText(imageBuffer);
  }

  private async resolveCompanyId({
    companyName,
    website,
    workspaceId,
  }: {
    companyName: string | null;
    website: string | null;
    workspaceId: string;
  }): Promise<string | null> {
    if (!isNonEmptyString(companyName)) {
      return null;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const companyRepository = this.workspaceOrmManager.getRepository(
        CompanyWorkspaceEntity,
        {
          shouldBypassPermissionChecks: true,
        },
      );

      const existing = await companyRepository.find({
        where: {
          name: ILike(companyName.trim()),
        },
        take: 1,
      });

      if (existing[0]?.id) {
        return existing[0].id;
      }

      const domainFromWebsite = website
        ?.replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0];

      const created = await companyRepository.save({
        name: companyName.trim(),
        domainName: isNonEmptyString(domainFromWebsite)
          ? {
              primaryLinkUrl: domainFromWebsite,
              primaryLinkLabel: '',
              secondaryLinks: [],
            }
          : undefined,
        position: 0,
      });

      return created.id;
    }, authContext);
  }
}

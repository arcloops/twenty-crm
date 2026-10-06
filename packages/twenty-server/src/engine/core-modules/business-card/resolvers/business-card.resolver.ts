import { UseGuards } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { BusinessCardExtractionDTO } from 'src/engine/core-modules/business-card/dtos/business-card-extraction.dto';
import { BusinessCardService } from 'src/engine/core-modules/business-card/services/business-card.service';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';

@MetadataResolver()
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: true,
      workspaceAgnostic: false,
    },
    apiKey: true,
    oauthClient: true,
    application: true,
  }),
  NoPermissionGuard,
)
export class BusinessCardResolver {
  constructor(private readonly businessCardService: BusinessCardService) {}

  @Mutation(() => BusinessCardExtractionDTO)
  async extractPersonFromBusinessCard(
    @Args('fileIds', { type: () => [UUIDScalarType] }) fileIds: string[],
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<BusinessCardExtractionDTO> {
    return this.businessCardService.extractPersonFromBusinessCard({
      fileIds,
      workspaceId: workspace.id,
    });
  }
}

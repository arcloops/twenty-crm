import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const PERSON_OWNER_FIELD_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECTS.person.fields.owner.universalIdentifier;

const WORKSPACE_MEMBER_OWNED_PEOPLE_FIELD_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECTS.workspaceMember.fields.ownedPeople.universalIdentifier;

const PERSON_OWNER_ID_INDEX_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECTS.person.indexes.ownerIdIndex.universalIdentifier;

const PERSON_OWNER_VIEW_FIELD_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.person.views.allPeople.viewFields.owner.universalIdentifier,
  STANDARD_OBJECTS.person.views.personRecordPageFields.viewFields.owner
    .universalIdentifier,
];

type WorkspaceDataSource = NonNullable<RunOnWorkspaceArgs['dataSource']>;

@RegisteredWorkspaceCommand('2.46.0', 1791283320638)
@Command({
  name: 'upgrade:2-46:add-person-owner-field',
  description:
    'Add Person.owner relation (and WorkspaceMember.ownedPeople reverse) so leads can be owned per member; backfill owner from createdBy when possible. Re-queued under 2.46 because existing workspaces had already passed the 2.39 cursor.',
})
export class AddPersonOwnerFieldV246Command extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
    dataSource,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;

    const { flatObjectMetadataMaps, flatFieldMetadataMaps, flatIndexMaps, flatViewFieldMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
        'flatIndexMaps',
        'flatViewFieldMaps',
      ]);

    const personObject =
      findFlatEntityByUniversalIdentifier<FlatObjectMetadata>({
        flatEntityMaps: flatObjectMetadataMaps,
        universalIdentifier: STANDARD_OBJECTS.person.universalIdentifier,
      });

    if (!isDefined(personObject)) {
      this.logger.log(
        `person object not found for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    const existingOwnerField =
      findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
        flatEntityMaps: flatFieldMetadataMaps,
        universalIdentifier: PERSON_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
      });

    const existingOwnedPeopleField =
      findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
        flatEntityMaps: flatFieldMetadataMaps,
        universalIdentifier:
          WORKSPACE_MEMBER_OWNED_PEOPLE_FIELD_UNIVERSAL_IDENTIFIER,
      });

    const existingOwnerIndex =
      findFlatEntityByUniversalIdentifier<FlatIndexMetadata>({
        flatEntityMaps: flatIndexMaps,
        universalIdentifier: PERSON_OWNER_ID_INDEX_UNIVERSAL_IDENTIFIER,
      });

    const fieldsAlreadyPresent =
      isDefined(existingOwnerField) && isDefined(existingOwnedPeopleField);

    const missingOwnerViewFields =
      PERSON_OWNER_VIEW_FIELD_UNIVERSAL_IDENTIFIERS.filter(
        (universalIdentifier) =>
          !isDefined(
            flatViewFieldMaps.byUniversalIdentifier[universalIdentifier],
          ),
      );

    if (!fieldsAlreadyPresent || missingOwnerViewFields.length > 0) {
      if (isDryRun) {
        this.logger.log(
          `[DRY RUN] Would create Person.owner / ownedPeople / owner view columns for workspace ${workspaceId}`,
        );
      } else {
        await this.createOwnerFields({
          workspaceId,
          flatFieldMetadataMaps,
          flatViewFieldMaps,
          existingOwnerIndex,
          fieldsAlreadyPresent,
          missingOwnerViewFields,
        });
      }
    }

    const workspaceDataSource = dataSource;

    if (isDefined(workspaceDataSource)) {
      await this.backfillOwnerFromCreatedBy({
        dataSource: workspaceDataSource,
        workspaceId,
        isDryRun,
      });
    }

    this.logger.log(
      fieldsAlreadyPresent
        ? `Person owner field already present for workspace ${workspaceId}`
        : `Added Person.owner for workspace ${workspaceId}`,
    );
  }

  private async createOwnerFields({
    workspaceId,
    flatFieldMetadataMaps,
    flatViewFieldMaps,
    existingOwnerIndex,
    fieldsAlreadyPresent,
    missingOwnerViewFields,
  }: {
    workspaceId: string;
    flatFieldMetadataMaps: {
      byUniversalIdentifier: Partial<
        Record<string, FlatFieldMetadata | undefined>
      >;
    };
    flatViewFieldMaps: {
      byUniversalIdentifier: Partial<
        Record<string, FlatViewField | undefined>
      >;
    };
    existingOwnerIndex: FlatIndexMetadata | undefined;
    fieldsAlreadyPresent: boolean;
    missingOwnerViewFields: string[];
  }): Promise<void> {
    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const { allFlatEntityMaps: standardAllFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now: new Date().toISOString(),
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });

    const flatEntityToCreate: FlatFieldMetadata[] = [];

    if (!fieldsAlreadyPresent) {
      for (const universalIdentifier of [
        PERSON_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
        WORKSPACE_MEMBER_OWNED_PEOPLE_FIELD_UNIVERSAL_IDENTIFIER,
      ]) {
        if (
          isDefined(
            flatFieldMetadataMaps.byUniversalIdentifier[universalIdentifier],
          )
        ) {
          continue;
        }

        const standardField =
          standardAllFlatEntityMaps.flatFieldMetadataMaps.byUniversalIdentifier[
            universalIdentifier
          ];

        if (!isDefined(standardField)) {
          throw new Error(
            `Standard field ${universalIdentifier} missing from twenty-standard maps`,
          );
        }

        flatEntityToCreate.push({
          ...standardField,
          viewFieldIds: [],
          viewFieldUniversalIdentifiers: [],
        });
      }
    }

    const flatIndexToCreate: FlatIndexMetadata[] = [];

    if (!isDefined(existingOwnerIndex)) {
      const standardIndex =
        standardAllFlatEntityMaps.flatIndexMaps.byUniversalIdentifier[
          PERSON_OWNER_ID_INDEX_UNIVERSAL_IDENTIFIER
        ];

      if (isDefined(standardIndex)) {
        flatIndexToCreate.push(standardIndex);
      }
    }

    const flatViewFieldToCreate: FlatViewField[] = [];

    for (const universalIdentifier of missingOwnerViewFields) {
      if (
        isDefined(flatViewFieldMaps.byUniversalIdentifier[universalIdentifier])
      ) {
        continue;
      }

      const standardViewField =
        standardAllFlatEntityMaps.flatViewFieldMaps.byUniversalIdentifier[
          universalIdentifier
        ];

      if (!isDefined(standardViewField)) {
        continue;
      }

      flatViewFieldToCreate.push(standardViewField);
    }

    if (
      flatEntityToCreate.length === 0 &&
      flatIndexToCreate.length === 0 &&
      flatViewFieldToCreate.length === 0
    ) {
      return;
    }

    const validateAndBuildResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          allFlatEntityOperationByMetadataName: {
            fieldMetadata: {
              flatEntityToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
            index: {
              flatEntityToCreate: flatIndexToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
            viewField: {
              flatEntityToCreate: flatViewFieldToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
          },
          workspaceId,
          isSystemBuild: true,
          applicationUniversalIdentifier:
            twentyStandardFlatApplication.universalIdentifier,
        },
      );

    if (validateAndBuildResult.status === 'fail') {
      this.logger.error(
        `Failed to add Person.owner for workspace ${workspaceId}:\n${JSON.stringify(
          validateAndBuildResult,
          null,
          2,
        )}`,
      );

      throw new Error(
        `Failed to add Person.owner for workspace ${workspaceId}`,
      );
    }
  }

  private async backfillOwnerFromCreatedBy({
    dataSource,
    workspaceId,
    isDryRun,
  }: {
    dataSource: WorkspaceDataSource;
    workspaceId: string;
    isDryRun: boolean;
  }): Promise<void> {
    const schemaName = getWorkspaceSchemaName(workspaceId);
    const hasPersonTable = await dataSource.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = $1
            AND table_name = 'person'
        ) AS "exists"
      `,
      [schemaName],
    );

    if (hasPersonTable[0]?.exists !== true) {
      return;
    }

    const hasOwnerColumn = await dataSource.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = $1
            AND table_name = 'person'
            AND column_name = 'ownerId'
        ) AS "exists"
      `,
      [schemaName],
    );

    if (hasOwnerColumn[0]?.exists !== true) {
      return;
    }

    // Actor fields are stored as split columns, not a JSON `createdBy` object
    const hasCreatedByWorkspaceMemberIdColumn = await dataSource.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = $1
            AND table_name = 'person'
            AND column_name = 'createdByWorkspaceMemberId'
        ) AS "exists"
      `,
      [schemaName],
    );

    if (hasCreatedByWorkspaceMemberIdColumn[0]?.exists !== true) {
      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would backfill person.ownerId from createdByWorkspaceMemberId for workspace ${workspaceId}`,
      );

      return;
    }

    const result = await dataSource.query(
      `
        UPDATE "${schemaName}"."person" AS person
        SET "ownerId" = person."createdByWorkspaceMemberId"
        WHERE person."ownerId" IS NULL
          AND person."createdByWorkspaceMemberId" IS NOT NULL
          AND person."deletedAt" IS NULL
      `,
    );

    const updatedCount = Array.isArray(result) ? result.length : result;

    this.logger.log(
      `Backfilled ownerId on people for workspace ${workspaceId} (result=${String(updatedCount)})`,
    );
  }
}

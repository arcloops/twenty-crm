import { Injectable } from '@nestjs/common';
import { msg } from '@lingui/core/macro';

import { isDefined } from 'twenty-shared/utils';

import { STANDARD_ERROR_MESSAGE } from 'src/engine/api/common/common-query-runners/errors/standard-error-message.constant';
import {
  GraphqlQueryRunnerException,
  GraphqlQueryRunnerExceptionCode,
} from 'src/engine/api/graphql/graphql-query-runner/errors/graphql-query-runner.exception';
import { isApiKeyAuthContext } from 'src/engine/core-modules/auth/guards/is-api-key-auth-context.guard';
import { isApplicationAuthContext } from 'src/engine/core-modules/auth/guards/is-application-auth-context.guard';
import { isSystemAuthContext } from 'src/engine/core-modules/auth/guards/is-system-auth-context.guard';
import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { UserRoleService } from 'src/engine/metadata-modules/user-role/user-role.service';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { STANDARD_ROLE } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-role.constant';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

export type PersonOwnerScopedFilter = {
  and?: Array<Record<string, unknown>>;
  ownerId?: { eq: string };
  [key: string]: unknown;
};

@Injectable()
export class PersonOwnershipService {
  constructor(
    private readonly userRoleService: UserRoleService,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
  ) {}

  async isWorkspaceAdmin(
    authContext: WorkspaceAuthContext,
  ): Promise<boolean> {
    if (!isUserAuthContext(authContext)) {
      return true;
    }

    const rolesByUserWorkspace =
      await this.userRoleService.getRolesByUserWorkspaces({
        userWorkspaceIds: [authContext.userWorkspaceId],
        workspaceId: authContext.workspace.id,
      });

    const roles = rolesByUserWorkspace.get(authContext.userWorkspaceId) ?? [];

    return roles.some(
      (role) =>
        role.universalIdentifier === STANDARD_ROLE.admin.universalIdentifier ||
        role.canUpdateAllSettings === true,
    );
  }

  async shouldRestrictToOwnedPeople(
    authContext: WorkspaceAuthContext,
  ): Promise<boolean> {
    if (
      isSystemAuthContext(authContext) ||
      isApiKeyAuthContext(authContext) ||
      isApplicationAuthContext(authContext)
    ) {
      return false;
    }

    if (!isUserAuthContext(authContext)) {
      return false;
    }

    return !(await this.isWorkspaceAdmin(authContext));
  }

  getCurrentWorkspaceMemberId(
    authContext: WorkspaceAuthContext,
  ): string | null {
    if (!isUserAuthContext(authContext)) {
      return null;
    }

    return authContext.workspaceMemberId;
  }

  applyOwnerIdOnCreateData<
    T extends { ownerId?: string | null; owner?: unknown },
  >(data: T, workspaceMemberId: string): T {
    if (isDefined(data.ownerId) && data.ownerId.length > 0) {
      return data;
    }

    if (isDefined(data.owner)) {
      return data;
    }

    return {
      ...data,
      ownerId: workspaceMemberId,
    };
  }

  mergeOwnerFilter(
    filter: PersonOwnerScopedFilter | undefined,
    workspaceMemberId: string,
  ): PersonOwnerScopedFilter {
    const ownershipFilter = { ownerId: { eq: workspaceMemberId } };

    if (!isDefined(filter) || Object.keys(filter).length === 0) {
      return ownershipFilter;
    }

    return {
      and: [filter, ownershipFilter],
    };
  }

  stripOwnerReassignmentForMember<
    T extends { ownerId?: string | null; owner?: unknown },
  >(data: T): T {
    const next = { ...data };

    if ('ownerId' in next) {
      delete next.ownerId;
    }

    if ('owner' in next) {
      delete next.owner;
    }

    return next;
  }

  async assertMemberOwnsPersonOrThrow({
    authContext,
    personId,
  }: {
    authContext: WorkspaceAuthContext;
    personId: string;
  }): Promise<void> {
    const shouldRestrict =
      await this.shouldRestrictToOwnedPeople(authContext);

    if (!shouldRestrict) {
      return;
    }

    const workspaceMemberId = this.getCurrentWorkspaceMemberId(authContext);

    if (!workspaceMemberId) {
      throw new GraphqlQueryRunnerException(
        'Workspace member required',
        GraphqlQueryRunnerExceptionCode.INVALID_QUERY_INPUT,
        { userFriendlyMessage: STANDARD_ERROR_MESSAGE },
      );
    }

    const person = await this.workspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const personRepository =
          this.workspaceOrmManager.getRepository<PersonWorkspaceEntity>(
            'person',
            { shouldBypassPermissionChecks: true },
          );

        return personRepository.findOne({
          where: { id: personId },
        });
      },
      authContext,
    );

    if (!isDefined(person) || person.ownerId !== workspaceMemberId) {
      throw new GraphqlQueryRunnerException(
        'Person not found or not owned by current member',
        GraphqlQueryRunnerExceptionCode.RECORD_NOT_FOUND,
        {
          userFriendlyMessage: msg`This person is not available`,
        },
      );
    }
  }
}

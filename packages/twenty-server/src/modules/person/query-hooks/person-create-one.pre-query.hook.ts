import { Injectable } from '@nestjs/common';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PersonOwnershipService } from 'src/modules/person/query-hooks/person-ownership.service';

@Injectable()
@WorkspaceQueryHook(`person.createOne`)
export class PersonCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly personOwnershipService: PersonOwnershipService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<{ ownerId?: string | null }>,
  ): Promise<CreateOneResolverArgs<{ ownerId?: string | null }>> {
    const workspaceMemberId =
      this.personOwnershipService.getCurrentWorkspaceMemberId(authContext);

    if (!workspaceMemberId) {
      return payload;
    }

    const shouldRestrict =
      await this.personOwnershipService.shouldRestrictToOwnedPeople(authContext);

    let data = this.personOwnershipService.applyOwnerIdOnCreateData(
      payload.data,
      workspaceMemberId,
    );

    if (shouldRestrict) {
      const { owner: _owner, ...withoutOwnerRelation } = data as {
        owner?: unknown;
        ownerId?: string | null;
      };

      data = {
        ...withoutOwnerRelation,
        ownerId: workspaceMemberId,
      } as typeof data;
    }

    return {
      ...payload,
      data,
    };
  }
}

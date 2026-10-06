import { Injectable } from '@nestjs/common';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PersonOwnershipService } from 'src/modules/person/query-hooks/person-ownership.service';

@Injectable()
@WorkspaceQueryHook(`person.createMany`)
export class PersonCreateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly personOwnershipService: PersonOwnershipService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateManyResolverArgs<{ ownerId?: string | null }>,
  ): Promise<CreateManyResolverArgs<{ ownerId?: string | null }>> {
    const workspaceMemberId =
      this.personOwnershipService.getCurrentWorkspaceMemberId(authContext);

    if (!workspaceMemberId) {
      return payload;
    }

    const shouldRestrict =
      await this.personOwnershipService.shouldRestrictToOwnedPeople(authContext);

    return {
      ...payload,
      data: payload.data.map((record) => {
        let next = this.personOwnershipService.applyOwnerIdOnCreateData(
          record,
          workspaceMemberId,
        );

        if (shouldRestrict) {
          const { owner: _owner, ...withoutOwnerRelation } = next as {
            owner?: unknown;
            ownerId?: string | null;
          };

          next = {
            ...withoutOwnerRelation,
            ownerId: workspaceMemberId,
          } as typeof next;
        }

        return next;
      }),
    };
  }
}

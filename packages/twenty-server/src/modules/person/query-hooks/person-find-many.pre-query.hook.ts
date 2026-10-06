import { Injectable } from '@nestjs/common';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type FindManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import {
  PersonOwnershipService,
  type PersonOwnerScopedFilter,
} from 'src/modules/person/query-hooks/person-ownership.service';

@Injectable()
@WorkspaceQueryHook(`person.findMany`)
export class PersonFindManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly personOwnershipService: PersonOwnershipService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: FindManyResolverArgs<PersonOwnerScopedFilter>,
  ): Promise<FindManyResolverArgs<PersonOwnerScopedFilter>> {
    const shouldRestrict =
      await this.personOwnershipService.shouldRestrictToOwnedPeople(authContext);

    if (!shouldRestrict) {
      return payload;
    }

    const workspaceMemberId =
      this.personOwnershipService.getCurrentWorkspaceMemberId(authContext);

    if (!workspaceMemberId) {
      return payload;
    }

    return {
      ...payload,
      filter: this.personOwnershipService.mergeOwnerFilter(
        payload.filter,
        workspaceMemberId,
      ),
    };
  }
}

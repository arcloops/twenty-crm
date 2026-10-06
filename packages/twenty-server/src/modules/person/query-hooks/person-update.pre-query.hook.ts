import { Injectable } from '@nestjs/common';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import {
  type UpdateManyResolverArgs,
  type UpdateOneResolverArgs,
} from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import {
  PersonOwnershipService,
  type PersonOwnerScopedFilter,
} from 'src/modules/person/query-hooks/person-ownership.service';

@Injectable()
@WorkspaceQueryHook(`person.updateOne`)
export class PersonUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly personOwnershipService: PersonOwnershipService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<{ ownerId?: string | null }>,
  ): Promise<UpdateOneResolverArgs<{ ownerId?: string | null }>> {
    await this.personOwnershipService.assertMemberOwnsPersonOrThrow({
      authContext,
      personId: payload.id,
    });

    const shouldRestrict =
      await this.personOwnershipService.shouldRestrictToOwnedPeople(authContext);

    if (!shouldRestrict) {
      return payload;
    }

    return {
      ...payload,
      data: this.personOwnershipService.stripOwnerReassignmentForMember(
        payload.data,
      ),
    };
  }
}

@Injectable()
@WorkspaceQueryHook(`person.updateMany`)
export class PersonUpdateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly personOwnershipService: PersonOwnershipService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateManyResolverArgs<
      { ownerId?: string | null },
      PersonOwnerScopedFilter
    >,
  ): Promise<
    UpdateManyResolverArgs<{ ownerId?: string | null }, PersonOwnerScopedFilter>
  > {
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
      data: this.personOwnershipService.stripOwnerReassignmentForMember(
        payload.data,
      ),
      filter: this.personOwnershipService.mergeOwnerFilter(
        payload.filter,
        workspaceMemberId,
      ),
    };
  }
}

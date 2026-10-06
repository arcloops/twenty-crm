import { Injectable } from '@nestjs/common';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import {
  type DeleteManyResolverArgs,
  type DeleteOneResolverArgs,
  type DestroyManyResolverArgs,
  type DestroyOneResolverArgs,
  type RestoreManyResolverArgs,
  type RestoreOneResolverArgs,
} from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import {
  PersonOwnershipService,
  type PersonOwnerScopedFilter,
} from 'src/modules/person/query-hooks/person-ownership.service';

@Injectable()
@WorkspaceQueryHook(`person.deleteOne`)
export class PersonDeleteOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly personOwnershipService: PersonOwnershipService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: DeleteOneResolverArgs,
  ): Promise<DeleteOneResolverArgs> {
    await this.personOwnershipService.assertMemberOwnsPersonOrThrow({
      authContext,
      personId: payload.id,
    });

    return payload;
  }
}

@Injectable()
@WorkspaceQueryHook(`person.destroyOne`)
export class PersonDestroyOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly personOwnershipService: PersonOwnershipService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: DestroyOneResolverArgs,
  ): Promise<DestroyOneResolverArgs> {
    await this.personOwnershipService.assertMemberOwnsPersonOrThrow({
      authContext,
      personId: payload.id,
    });

    return payload;
  }
}

@Injectable()
@WorkspaceQueryHook(`person.restoreOne`)
export class PersonRestoreOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly personOwnershipService: PersonOwnershipService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: RestoreOneResolverArgs,
  ): Promise<RestoreOneResolverArgs> {
    await this.personOwnershipService.assertMemberOwnsPersonOrThrow({
      authContext,
      personId: payload.id,
    });

    return payload;
  }
}

@Injectable()
@WorkspaceQueryHook(`person.deleteMany`)
export class PersonDeleteManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly personOwnershipService: PersonOwnershipService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: DeleteManyResolverArgs<PersonOwnerScopedFilter>,
  ): Promise<DeleteManyResolverArgs<PersonOwnerScopedFilter>> {
    return this.applyOwnerFilter(authContext, payload);
  }

  private async applyOwnerFilter(
    authContext: WorkspaceAuthContext,
    payload: { filter?: PersonOwnerScopedFilter },
  ) {
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

@Injectable()
@WorkspaceQueryHook(`person.destroyMany`)
export class PersonDestroyManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly personOwnershipService: PersonOwnershipService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: DestroyManyResolverArgs<PersonOwnerScopedFilter>,
  ): Promise<DestroyManyResolverArgs<PersonOwnerScopedFilter>> {
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

@Injectable()
@WorkspaceQueryHook(`person.restoreMany`)
export class PersonRestoreManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly personOwnershipService: PersonOwnershipService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: RestoreManyResolverArgs<PersonOwnerScopedFilter>,
  ): Promise<RestoreManyResolverArgs<PersonOwnerScopedFilter>> {
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

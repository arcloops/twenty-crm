import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PersonOwnershipService } from 'src/modules/person/query-hooks/person-ownership.service';

type FindDuplicatesResultItem = {
  records?: Array<{ ownerId?: string | null }>;
  totalCount?: number;
};

@Injectable()
@WorkspaceQueryHook({
  key: `person.findDuplicates`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class PersonFindDuplicatesPostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly personOwnershipService: PersonOwnershipService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: FindDuplicatesResultItem[] | FindDuplicatesResultItem,
  ): Promise<void> {
    const shouldRestrict =
      await this.personOwnershipService.shouldRestrictToOwnedPeople(authContext);

    if (!shouldRestrict) {
      return;
    }

    const workspaceMemberId =
      this.personOwnershipService.getCurrentWorkspaceMemberId(authContext);

    if (!workspaceMemberId) {
      return;
    }

    const items = Array.isArray(payload) ? payload : [payload];

    for (const item of items) {
      if (!isDefined(item.records) || !Array.isArray(item.records)) {
        continue;
      }

      item.records = item.records.filter(
        (record) => record.ownerId === workspaceMemberId,
      );
      item.totalCount = item.records.length;
    }
  }
}

import { Module } from '@nestjs/common';

import { UserRoleModule } from 'src/engine/metadata-modules/user-role/user-role.module';
import { PersonCreateManyPreQueryHook } from 'src/modules/person/query-hooks/person-create-many.pre-query.hook';
import { PersonCreateOnePreQueryHook } from 'src/modules/person/query-hooks/person-create-one.pre-query.hook';
import {
  PersonDeleteManyPreQueryHook,
  PersonDeleteOnePreQueryHook,
  PersonDestroyManyPreQueryHook,
  PersonDestroyOnePreQueryHook,
  PersonRestoreManyPreQueryHook,
  PersonRestoreOnePreQueryHook,
} from 'src/modules/person/query-hooks/person-delete.pre-query.hook';
import { PersonFindDuplicatesPostQueryHook } from 'src/modules/person/query-hooks/person-find-duplicates.post-query.hook';
import { PersonFindManyPreQueryHook } from 'src/modules/person/query-hooks/person-find-many.pre-query.hook';
import { PersonFindOnePreQueryHook } from 'src/modules/person/query-hooks/person-find-one.pre-query.hook';
import { PersonGroupByPreQueryHook } from 'src/modules/person/query-hooks/person-group-by.pre-query.hook';
import { PersonOwnershipService } from 'src/modules/person/query-hooks/person-ownership.service';
import {
  PersonUpdateManyPreQueryHook,
  PersonUpdateOnePreQueryHook,
} from 'src/modules/person/query-hooks/person-update.pre-query.hook';

@Module({
  imports: [UserRoleModule],
  providers: [
    PersonOwnershipService,
    PersonCreateOnePreQueryHook,
    PersonCreateManyPreQueryHook,
    PersonFindManyPreQueryHook,
    PersonFindOnePreQueryHook,
    PersonFindDuplicatesPostQueryHook,
    PersonGroupByPreQueryHook,
    PersonUpdateOnePreQueryHook,
    PersonUpdateManyPreQueryHook,
    PersonDeleteOnePreQueryHook,
    PersonDeleteManyPreQueryHook,
    PersonDestroyOnePreQueryHook,
    PersonDestroyManyPreQueryHook,
    PersonRestoreOnePreQueryHook,
    PersonRestoreManyPreQueryHook,
  ],
})
export class PersonQueryHookModule {}

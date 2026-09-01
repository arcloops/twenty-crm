import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER } from 'src/objects/training-delivery';

export const CLIENT_COMPANY_ON_TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER =
  'fd2d756a-14f7-4e68-81f3-0347cf6a2c14';

export const TRAINING_DELIVERIES_ON_COMPANY_UNIVERSAL_IDENTIFIER =
  'f3ff09f1-e240-4915-9c36-07f8a35a31b8';

export default defineField({
  universalIdentifier:
    CLIENT_COMPANY_ON_TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'clientCompany',
  label: 'Client',
  description: 'Client company for this training delivery',
  icon: 'IconBuildingSkyscraper',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    TRAINING_DELIVERIES_ON_COMPANY_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'clientCompanyId',
  },
});

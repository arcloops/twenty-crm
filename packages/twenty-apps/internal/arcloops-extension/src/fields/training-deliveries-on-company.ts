import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CLIENT_COMPANY_ON_TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER,
  TRAINING_DELIVERIES_ON_COMPANY_UNIVERSAL_IDENTIFIER,
} from 'src/fields/client-company-on-training-delivery';
import { TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER } from 'src/objects/training-delivery';

export default defineField({
  universalIdentifier: TRAINING_DELIVERIES_ON_COMPANY_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'trainingDeliveries',
  label: 'Training Deliveries',
  description: 'Training deliveries for this company',
  icon: 'IconSchool',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CLIENT_COMPANY_ON_TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});

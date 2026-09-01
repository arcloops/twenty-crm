import { defineView, ViewType } from 'twenty-sdk/define';

import { CLIENT_COMPANY_ON_TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER } from 'src/fields/client-company-on-training-delivery';
import {
  COHORT_ID_FIELD_UNIVERSAL_IDENTIFIER,
  DELIVERY_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  FACILITATOR_FIELD_UNIVERSAL_IDENTIFIER,
  PARTICIPANT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  TITLE_FIELD_UNIVERSAL_IDENTIFIER,
  TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER,
} from 'src/objects/training-delivery';

export const TRAINING_DELIVERY_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER =
  '4a7f2c18-9e3b-4d61-a8c2-1f5e90b3d746';

export default defineView({
  universalIdentifier:
    TRAINING_DELIVERY_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Training Delivery record fields',
  objectUniversalIdentifier: TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER,
  type: ViewType.FIELDS_WIDGET,
  fields: [
    {
      universalIdentifier: '11a2b3c4-d5e6-4f70-8a91-b2c3d4e5f607',
      fieldMetadataUniversalIdentifier: TITLE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
    },
    {
      universalIdentifier: '22b3c4d5-e6f7-4081-9b02-c3d4e5f60718',
      fieldMetadataUniversalIdentifier:
        CLIENT_COMPANY_ON_TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
    },
    {
      universalIdentifier: '33c4d5e6-f708-4192-8c13-d4e5f6071829',
      fieldMetadataUniversalIdentifier:
        DELIVERY_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
    },
    {
      universalIdentifier: '44d5e6f7-0819-42a3-9d24-e5f60718293a',
      fieldMetadataUniversalIdentifier: STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
    },
    {
      universalIdentifier: '55e6f708-192a-43b4-8e35-f60718293a4b',
      fieldMetadataUniversalIdentifier: FACILITATOR_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
    },
    {
      universalIdentifier: '66f70819-2a3b-44c5-9f46-0718293a4b5c',
      fieldMetadataUniversalIdentifier: COHORT_ID_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
    },
    {
      universalIdentifier: '7708192a-3b4c-45d6-8057-18293a4b5c6d',
      fieldMetadataUniversalIdentifier:
        PARTICIPANT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 6,
      isVisible: true,
    },
  ],
});

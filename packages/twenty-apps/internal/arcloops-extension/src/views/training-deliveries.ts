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

export const TRAINING_DELIVERIES_VIEW_UNIVERSAL_IDENTIFIER =
  '3b9f2f9d-4b27-405b-9e44-f24691180d45';

export default defineView({
  universalIdentifier: TRAINING_DELIVERIES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'All training deliveries',
  objectUniversalIdentifier: TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconSchool',
  position: 0,
  fields: [
    {
      universalIdentifier: '1a73a351-0406-4f36-bbf8-560c6180d53c',
      fieldMetadataUniversalIdentifier: TITLE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'a4cb2565-eb30-48af-838a-f7a27f25e121',
      fieldMetadataUniversalIdentifier:
        DELIVERY_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'bbb92401-8123-4bc5-b17d-25ef26eaec1e',
      fieldMetadataUniversalIdentifier: STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '4452cf0f-dbcb-4dd7-8f82-39ed56aed84a',
      fieldMetadataUniversalIdentifier: FACILITATOR_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'f0e0c07e-852a-4acf-b7b0-9c43ba1f292d',
      fieldMetadataUniversalIdentifier: COHORT_ID_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'cb75a935-9ade-499c-8fa4-f2c99ea7c8d5',
      fieldMetadataUniversalIdentifier:
        PARTICIPANT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: '9180e8b6-f14c-4a03-94e9-7357345db456',
      fieldMetadataUniversalIdentifier:
        CLIENT_COMPANY_ON_TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER,
      position: 6,
      isVisible: true,
      size: 180,
    },
  ],
});

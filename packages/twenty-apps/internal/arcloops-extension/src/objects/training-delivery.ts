import { defineObject, FieldType } from 'twenty-sdk/define';

export const TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER =
  '973dd581-cdc0-45cd-bf97-e09741a5ee6f';

export const TITLE_FIELD_UNIVERSAL_IDENTIFIER =
  '17961041-ed8a-4c98-91e0-9b7716c45722';

export const DELIVERY_DATE_FIELD_UNIVERSAL_IDENTIFIER =
  '858a21cd-0ff8-45bb-9c38-220b877e2059';

export const PARTICIPANT_COUNT_FIELD_UNIVERSAL_IDENTIFIER =
  'ce7c99a4-6c3c-4771-9f90-ce9b6ec6f68c';

export const COHORT_ID_FIELD_UNIVERSAL_IDENTIFIER =
  '8ae5c5f9-c099-4851-ade6-19e85423b208';

export const FACILITATOR_FIELD_UNIVERSAL_IDENTIFIER =
  '85cde58c-bd08-4f36-b93c-90d513692adc';

export const STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  'dc20680c-c92b-40e1-8317-0c7234b3d2b8';

export const TRAINING_DELIVERY_STATUS = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CERTIFIED: 'CERTIFIED',
} as const;

export type TrainingDeliveryStatus =
  (typeof TRAINING_DELIVERY_STATUS)[keyof typeof TRAINING_DELIVERY_STATUS];

export default defineObject({
  universalIdentifier: TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER,
  nameSingular: 'trainingDelivery',
  namePlural: 'trainingDeliveries',
  labelSingular: 'Training Delivery',
  labelPlural: 'Training Deliveries',
  description: 'A delivered or planned training programme for a client',
  icon: 'IconSchool',
  labelIdentifierFieldMetadataUniversalIdentifier:
    TITLE_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: TITLE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'title',
      label: 'Programme',
      description: 'Programme title',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: DELIVERY_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'deliveryDate',
      label: 'Date',
      description: 'When the training is delivered',
      icon: 'IconCalendar',
      isNullable: true,
    },
    {
      universalIdentifier: PARTICIPANT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'participantCount',
      label: 'Participants',
      description: 'Number of participants',
      icon: 'IconUsers',
      isNullable: true,
    },
    {
      universalIdentifier: COHORT_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'cohortId',
      label: 'Cohort ID',
      description: 'Certificate portal cohort identifier',
      icon: 'IconHash',
    },
    {
      universalIdentifier: FACILITATOR_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'facilitator',
      label: 'Facilitator',
      description: 'Person delivering the training',
      icon: 'IconUser',
    },
    {
      universalIdentifier: STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      description: 'Delivery lifecycle status',
      icon: 'IconProgress',
      defaultValue: `'${TRAINING_DELIVERY_STATUS.PLANNED}'`,
      options: [
        {
          id: '2456fdbf-60f9-45db-a859-cbd6bab86245',
          value: TRAINING_DELIVERY_STATUS.PLANNED,
          label: 'Planned',
          position: 0,
          color: 'blue',
        },
        {
          id: '74417c88-b2de-46d0-8017-09544843d38d',
          value: TRAINING_DELIVERY_STATUS.IN_PROGRESS,
          label: 'In Progress',
          position: 1,
          color: 'orange',
        },
        {
          id: '651a80e4-c458-457e-9423-20098fc1eeed',
          value: TRAINING_DELIVERY_STATUS.COMPLETED,
          label: 'Completed',
          position: 2,
          color: 'green',
        },
        {
          id: 'fba96328-b705-486a-beb4-a0cc86d91e58',
          value: TRAINING_DELIVERY_STATUS.CERTIFIED,
          label: 'Certified',
          position: 3,
          color: 'purple',
        },
      ],
    },
  ],
});

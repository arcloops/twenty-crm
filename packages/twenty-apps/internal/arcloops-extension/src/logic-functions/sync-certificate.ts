import { defineLogicFunction } from 'twenty-sdk/define';

import { TRAINING_DELIVERY_STATUS } from 'src/objects/training-delivery';

const CERTIFICATE_PORTAL_COHORTS_PATH = '/cohorts';

export type TrainingDeliveryRecord = {
  title?: string | null;
  cohortId?: string | null;
  deliveryDate?: string | Date | null;
  participantCount?: number | null;
  status?: string | null;
  clientCompany?: { name?: string | null } | null;
  clientName?: string | null;
};

export type SyncCertificatePayload = {
  properties?: {
    after?: TrainingDeliveryRecord;
    before?: TrainingDeliveryRecord;
  };
} & TrainingDeliveryRecord;

export type SyncCertificateResult = {
  success: boolean;
  skipped?: boolean;
  error?: string;
  status?: number;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const resolveRecord = (
  payload: SyncCertificatePayload,
): TrainingDeliveryRecord => payload.properties?.after ?? payload;

const handler = async (
  payload: SyncCertificatePayload,
): Promise<SyncCertificateResult> => {
  const record = resolveRecord(payload);
  const previousStatus = payload.properties?.before?.status ?? null;

  if (record.status !== TRAINING_DELIVERY_STATUS.CERTIFIED) {
    return {
      success: true,
      skipped: true,
    };
  }

  if (previousStatus === TRAINING_DELIVERY_STATUS.CERTIFIED) {
    return {
      success: true,
      skipped: true,
    };
  }

  const apiUrl = process.env.CERTIFICATE_PORTAL_API_URL?.trim();
  const apiKey = process.env.CERTIFICATE_PORTAL_API_KEY?.trim();

  if (!isNonEmptyString(apiUrl) || !isNonEmptyString(apiKey)) {
    return {
      success: false,
      error:
        'CERTIFICATE_PORTAL_API_URL and CERTIFICATE_PORTAL_API_KEY must be set on the app (Settings → Applications) or the process environment.',
    };
  }

  const cohortsUrl = `${apiUrl.replace(/\/$/, '')}${CERTIFICATE_PORTAL_COHORTS_PATH}`;

  try {
    const response = await fetch(cohortsUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cohortId: record.cohortId,
        programmeTitle: record.title,
        deliveryDate: record.deliveryDate,
        participantCount: record.participantCount,
        clientName: record.clientCompany?.name ?? record.clientName,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: `Certificate portal returned HTTP ${response.status}`,
      };
    }

    return { success: true, status: response.status };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown certificate portal error';

    return {
      success: false,
      error: message,
    };
  }
};

export default defineLogicFunction({
  universalIdentifier: '1798ccf0-0ed8-4357-8766-4604b4002a89',
  name: 'syncCertificate',
  description:
    'POSTs a Certified training delivery to the certificate portal. Also callable over HTTP for n8n or yarn twenty dev:function:exec.',
  timeoutSeconds: 30,
  handler,
  databaseEventTriggerSettings: {
    eventName: 'trainingDelivery.updated',
    updatedFields: ['status'],
  },
  httpRouteTriggerSettings: {
    path: '/sync-certificate',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});

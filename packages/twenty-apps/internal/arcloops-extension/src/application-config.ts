import { defineApplication } from 'twenty-sdk/define';

import { DEFAULT_ROLE_UNIVERSAL_IDENTIFIER } from 'src/roles/default-role';

export const APPLICATION_UNIVERSAL_IDENTIFIER =
  'd6dd4b11-bfb3-4729-8c55-55f9b1a5647b';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'Arcloops',
  description:
    'Arcloops CRM objects and jobs: Training Delivery, certificate portal sync, and stale deal alerts to Teams.',
  defaultRoleUniversalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  serverVariables: {
    CERTIFICATE_PORTAL_API_URL: {
      description:
        'Base URL for the certificate portal API (e.g. https://certs.arcloops.io/api)',
      isSecret: false,
      isRequired: false,
    },
    CERTIFICATE_PORTAL_API_KEY: {
      description: 'Bearer token for the certificate portal API',
      isSecret: true,
      isRequired: false,
    },
    TEAMS_BD_WEBHOOK_URL: {
      description:
        'Microsoft Teams Incoming Webhook URL for the #bd-pipeline channel',
      isSecret: true,
      isRequired: false,
    },
  },
});

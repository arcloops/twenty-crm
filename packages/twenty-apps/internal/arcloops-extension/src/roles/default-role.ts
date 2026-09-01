import { defineRole } from 'twenty-sdk/define';

export const DEFAULT_ROLE_UNIVERSAL_IDENTIFIER =
  '776c0015-0a36-4a14-b343-4b31824f030b';

export default defineRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Arcloops default function role',
  description: 'Arcloops default function role',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: true,
  canSoftDeleteAllObjectRecords: true,
  canDestroyAllObjectRecords: false,
});

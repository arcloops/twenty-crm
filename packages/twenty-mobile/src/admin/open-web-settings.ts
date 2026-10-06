import * as Linking from 'expo-linking';

import { AUTH_ORIGIN } from '@/config/env';

export const WEB_SETTINGS_PATH = {
  apiKeys: 'settings/mcp-apis',
  roles: 'settings/members/roles',
  billing: 'settings/billing',
} as const;

export const openWebSettings = async (
  path: (typeof WEB_SETTINGS_PATH)[keyof typeof WEB_SETTINGS_PATH],
) => {
  const url = `${AUTH_ORIGIN.replace(/\/$/, '')}/${path}`;
  await Linking.openURL(url);
};

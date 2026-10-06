import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as
  | { twentyApiUrl?: string; twentyOrigin?: string }
  | undefined;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_TWENTY_API_URL ??
  extra?.twentyApiUrl ??
  'https://crm-api.arcloops.io';

export const AUTH_ORIGIN =
  process.env.EXPO_PUBLIC_TWENTY_ORIGIN ??
  extra?.twentyOrigin ??
  'https://crm.arcloops.io';

export const METADATA_URL = `${API_BASE_URL}/metadata`;
export const GRAPHQL_URL = `${API_BASE_URL}/graphql`;

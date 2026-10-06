import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'twenty.accessToken';
const REFRESH_TOKEN_KEY = 'twenty.refreshToken';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const webStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof localStorage === 'undefined') {
        return null;
      }
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // ignore quota / private mode
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  },
};

const getItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return webStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
};

const setItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    webStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

const deleteItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    webStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

export const tokenStorage = {
  async getTokens(): Promise<AuthTokens | null> {
    const [accessToken, refreshToken] = await Promise.all([
      getItem(ACCESS_TOKEN_KEY),
      getItem(REFRESH_TOKEN_KEY),
    ]);

    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken };
  },

  async setTokens(tokens: AuthTokens): Promise<void> {
    await Promise.all([
      setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
      setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  },

  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        deleteItem(ACCESS_TOKEN_KEY),
        deleteItem(REFRESH_TOKEN_KEY),
      ]);
    } catch {
      // never throw on logout / bootstrap cleanup
    }
  },
};

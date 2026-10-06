import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

const CACHE_DIRECTORY = `${documentDirectory ?? ''}twenty-offline-cache`;

const cachePathForKey = (key: string) =>
  `${CACHE_DIRECTORY}/${encodeURIComponent(key)}.json`;

const ensureCacheDirectory = async () => {
  if (!documentDirectory) {
    return;
  }
  const info = await getInfoAsync(CACHE_DIRECTORY);
  if (!info.exists) {
    await makeDirectoryAsync(CACHE_DIRECTORY, {
      intermediates: true,
    });
  }
};

export const offlineCache = {
  async setJson(key: string, value: unknown): Promise<void> {
    try {
      if (!documentDirectory) {
        return;
      }
      await ensureCacheDirectory();
      await writeAsStringAsync(
        cachePathForKey(key),
        JSON.stringify({
          savedAt: new Date().toISOString(),
          value,
        }),
      );
    } catch {
      // Best-effort read cache; ignore write failures on restricted FS
    }
  },

  async getJson<TData>(key: string): Promise<TData | null> {
    try {
      if (!documentDirectory) {
        return null;
      }
      const path = cachePathForKey(key);
      const info = await getInfoAsync(path);
      if (!info.exists) {
        return null;
      }
      const raw = await readAsStringAsync(path);
      const parsed = JSON.parse(raw) as { value?: TData };
      return parsed.value ?? null;
    } catch {
      return null;
    }
  },

  recordListKey(objectNamePlural: string): string {
    return `records:${objectNamePlural}:recent`;
  },
};

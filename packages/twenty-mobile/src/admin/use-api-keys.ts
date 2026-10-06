import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/auth/auth-context';
import {
  GET_API_KEYS,
  type ApiKeySummary,
} from '@/admin/queries';

export const useApiKeys = (enabled = true) => {
  const { apolloClients } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!apolloClients || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apolloClients.metadataClient.query<{
        apiKeys: ApiKeySummary[];
      }>({
        query: GET_API_KEYS,
        fetchPolicy: 'network-only',
      });
      setApiKeys(result.data.apiKeys ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load API keys',
      );
    } finally {
      setIsLoading(false);
    }
  }, [apolloClients, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { apiKeys, isLoading, error, reload };
};

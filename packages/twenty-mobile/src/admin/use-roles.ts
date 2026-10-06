import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/auth/auth-context';
import { GET_ROLES, type RoleSummary } from '@/admin/queries';

export const useRoles = (enabled = true) => {
  const { apolloClients } = useAuth();
  const [roles, setRoles] = useState<RoleSummary[]>([]);
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
        getRoles: RoleSummary[];
      }>({
        query: GET_ROLES,
        fetchPolicy: 'network-only',
      });
      setRoles(result.data.getRoles ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load roles',
      );
    } finally {
      setIsLoading(false);
    }
  }, [apolloClients, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { roles, isLoading, error, reload };
};

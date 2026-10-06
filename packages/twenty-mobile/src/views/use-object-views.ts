import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/auth/auth-context';
import { FIND_MANY_VIEWS } from '@/views/queries';
import type { WorkspaceView } from '@/views/types';

export const useObjectViews = (objectMetadataId: string | undefined) => {
  const { apolloClients, isAuthenticated } = useAuth();
  const [views, setViews] = useState<WorkspaceView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!apolloClients || !isAuthenticated || !objectMetadataId) {
      setViews([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apolloClients.metadataClient.query<{
        getViews: WorkspaceView[];
      }>({
        query: FIND_MANY_VIEWS,
        variables: { objectMetadataId },
        fetchPolicy: 'network-only',
      });

      const nextViews = (result.data.getViews ?? [])
        .filter((view) => view.isActive !== false)
        .filter(
          (view) =>
            view.type === 'TABLE' ||
            view.type === 'LIST' ||
            view.type === 'KANBAN',
        )
        .sort((left, right) => (left.position ?? 0) - (right.position ?? 0));

      setViews(nextViews);
      setSelectedViewId((current) => {
        if (current && nextViews.some((view) => view.id === current)) {
          return current;
        }
        const indexView = nextViews.find((view) => view.key === 'INDEX');
        return indexView?.id ?? nextViews[0]?.id ?? null;
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load views',
      );
    } finally {
      setIsLoading(false);
    }
  }, [apolloClients, isAuthenticated, objectMetadataId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selectedView = useMemo(
    () => views.find((view) => view.id === selectedViewId) ?? null,
    [views, selectedViewId],
  );

  return {
    views,
    selectedView,
    selectedViewId,
    setSelectedViewId,
    isLoading,
    error,
    reload,
  };
};

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/auth/auth-context';
import { OBJECT_METADATA_ITEMS } from '@/metadata/queries';
import type { ObjectMetadata } from '@/metadata/types';
import { offlineCache } from '@/offline/offline-cache';

type ObjectsQueryResult = {
  objects: {
    edges: Array<{ node: ObjectMetadata }>;
  };
};

const OBJECTS_CACHE_KEY = 'metadata:objects';

export const useObjectsMetadata = () => {
  const { apolloClients, isAuthenticated } = useAuth();
  const [objects, setObjects] = useState<ObjectMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const reload = useCallback(async () => {
    if (!apolloClients || !isAuthenticated) {
      setObjects([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result =
        await apolloClients.metadataClient.query<ObjectsQueryResult>({
          query: OBJECT_METADATA_ITEMS,
          fetchPolicy: 'network-only',
        });

      const next = result.data.objects.edges.map((edge) => edge.node);
      setObjects(next);
      setIsFromCache(false);
      void offlineCache.setJson(OBJECTS_CACHE_KEY, next);
    } catch (loadError) {
      const cached =
        await offlineCache.getJson<ObjectMetadata[]>(OBJECTS_CACHE_KEY);
      if (cached && cached.length > 0) {
        setObjects(cached);
        setIsFromCache(true);
        setError(null);
      } else {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load objects',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [apolloClients, isAuthenticated]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const activeObjects = useMemo(
    () =>
      objects
        .filter((object) => object.isActive && !object.isSystem)
        .sort((left, right) =>
          left.labelPlural.localeCompare(right.labelPlural),
        ),
    [objects],
  );

  const getByPlural = useCallback(
    (namePlural: string) =>
      objects.find((object) => object.namePlural === namePlural),
    [objects],
  );

  const getBySingular = useCallback(
    (nameSingular: string) =>
      objects.find((object) => object.nameSingular === nameSingular),
    [objects],
  );

  return {
    objects,
    activeObjects,
    isLoading,
    error,
    isFromCache,
    reload,
    getByPlural,
    getBySingular,
  };
};

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/auth/auth-context';
import { useObjects } from '@/metadata/objects-provider';
import { buildSearchFilter, type ObjectMetadata } from '@/metadata/types';
import { offlineCache } from '@/offline/offline-cache';
import {
  generateCreateMutation,
  generateDeleteMutation,
  generateFindManyQuery,
  generateFindOneQuery,
  generateUpdateMutation,
  getRecordSubtitle,
  getRecordTitle,
} from '@/records/generate-queries';

type PageInfo = {
  hasNextPage: boolean;
  endCursor?: string | null;
};

export const useRecordList = (
  objectMetadata: ObjectMetadata | undefined,
  options?: {
    filter?: Record<string, unknown>;
    orderBy?: Array<Record<string, unknown>>;
    limit?: number;
  },
) => {
  const { apolloClients } = useAuth();
  const { objects } = useObjects();
  const [records, setRecords] = useState<Array<Record<string, unknown>>>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ hasNextPage: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const filter = options?.filter;
  const orderBy = options?.orderBy;
  const limit = options?.limit ?? 30;

  const query = useMemo(
    () =>
      objectMetadata ? generateFindManyQuery(objectMetadata, objects) : null,
    [objectMetadata, objects],
  );

  const filterKey = JSON.stringify(filter ?? null);
  const orderByKey = JSON.stringify(orderBy ?? null);

  const fetchPage = useCallback(
    async (cursor?: string | null, append = false) => {
      if (!apolloClients || !objectMetadata || !query) {
        return;
      }

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const result = await apolloClients.coreClient.query({
          query,
          variables: {
            limit,
            lastCursor: cursor ?? undefined,
            filter: filter ?? undefined,
            orderBy: orderBy ?? undefined,
          },
          fetchPolicy: 'network-only',
        });

        const connection = result.data?.[objectMetadata.namePlural] as
          | {
              edges: Array<{ node: Record<string, unknown> }>;
              pageInfo: PageInfo;
              totalCount?: number;
            }
          | undefined;

        if (!connection) {
          throw new Error('No connection data');
        }

        const nodes = connection.edges.map((edge) => edge.node);
        setRecords((current) => (append ? [...current, ...nodes] : nodes));
        setPageInfo(connection.pageInfo);
        setTotalCount(connection.totalCount ?? null);
        setIsFromCache(false);

        if (!append && !filter) {
          void offlineCache.setJson(
            offlineCache.recordListKey(objectMetadata.namePlural),
            {
              records: nodes,
              pageInfo: connection.pageInfo,
              totalCount: connection.totalCount ?? null,
            },
          );
        }
      } catch (loadError) {
        if (!append && !filter) {
          const cached = await offlineCache.getJson<{
            records: Array<Record<string, unknown>>;
            pageInfo: PageInfo;
            totalCount: number | null;
          }>(offlineCache.recordListKey(objectMetadata.namePlural));

          if (cached?.records) {
            setRecords(cached.records);
            setPageInfo(cached.pageInfo ?? { hasNextPage: false });
            setTotalCount(cached.totalCount ?? null);
            setIsFromCache(true);
            setError(null);
            return;
          }
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load records',
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [apolloClients, objectMetadata, query, filter, orderBy, limit],
  );

  useEffect(() => {
    void fetchPage(null, false);
  }, [fetchPage, filterKey, orderByKey]);

  return {
    records,
    isLoading,
    isLoadingMore,
    error,
    totalCount,
    isFromCache,
    hasNextPage: pageInfo.hasNextPage,
    reload: () => fetchPage(null, false),
    loadMore: () =>
      pageInfo.hasNextPage
        ? fetchPage(pageInfo.endCursor, true)
        : Promise.resolve(),
    getTitle: (record: Record<string, unknown>) =>
      objectMetadata ? getRecordTitle(objectMetadata, record) : 'Untitled',
    getSubtitle: (record: Record<string, unknown>) =>
      objectMetadata
        ? getRecordSubtitle(objectMetadata, record, objects)
        : undefined,
  };
};

export const useRecordDetail = (
  objectMetadata: ObjectMetadata | undefined,
  recordId: string | undefined,
) => {
  const { apolloClients } = useAuth();
  const { objects } = useObjects();
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(
    () =>
      objectMetadata ? generateFindOneQuery(objectMetadata, objects) : null,
    [objectMetadata, objects],
  );

  const reload = useCallback(async () => {
    if (!apolloClients || !objectMetadata || !query || !recordId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apolloClients.coreClient.query({
        query,
        variables: {
          objectRecordId: recordId,
        },
        fetchPolicy: 'network-only',
      });

      setRecord(
        (result.data?.[objectMetadata.nameSingular] as Record<
          string,
          unknown
        >) ?? null,
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load record',
      );
    } finally {
      setIsLoading(false);
    }
  }, [apolloClients, objectMetadata, query, recordId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateRecord = useCallback(
    async (input: Record<string, unknown>) => {
      if (!apolloClients || !objectMetadata || !recordId) {
        return;
      }

      const mutation = generateUpdateMutation(objectMetadata);
      await apolloClients.coreClient.mutate({
        mutation,
        variables: {
          idToUpdate: recordId,
          input,
        },
      });
      await reload();
    },
    [apolloClients, objectMetadata, recordId, reload],
  );

  const deleteRecord = useCallback(async () => {
    if (!apolloClients || !objectMetadata || !recordId) {
      return;
    }

    const mutation = generateDeleteMutation(objectMetadata);
    await apolloClients.coreClient.mutate({
      mutation,
      variables: { idToDelete: recordId },
    });
  }, [apolloClients, objectMetadata, recordId]);

  return {
    record,
    isLoading,
    error,
    reload,
    updateRecord,
    deleteRecord,
  };
};

export const useCreateRecord = (objectMetadata: ObjectMetadata | undefined) => {
  const { apolloClients } = useAuth();

  const createRecord = useCallback(
    async (data: Record<string, unknown>) => {
      if (!apolloClients || !objectMetadata) {
        throw new Error('Not ready');
      }

      const mutation = generateCreateMutation(objectMetadata);
      const result = await apolloClients.coreClient.mutate({
        mutation,
        variables: { input: data },
      });

      const created = result.data?.[
        `create${objectMetadata.nameSingular.charAt(0).toUpperCase()}${objectMetadata.nameSingular.slice(1)}`
      ] as Record<string, unknown> | undefined;

      return created;
    },
    [apolloClients, objectMetadata],
  );

  return { createRecord };
};

export const useSearchRecords = (
  objectMetadata: ObjectMetadata | undefined,
  searchTerm: string,
) => {
  const { apolloClients } = useAuth();
  const { objects } = useObjects();
  const [records, setRecords] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!apolloClients || !objectMetadata || searchTerm.trim().length < 2) {
        setRecords([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      const query = generateFindManyQuery(objectMetadata, objects);
      const serverFilter = buildSearchFilter(objectMetadata, searchTerm);
      const lowered = searchTerm.trim().toLowerCase();

      const filterClientSide = (nodes: Array<Record<string, unknown>>) =>
        nodes.filter((node) =>
          getRecordTitle(objectMetadata, node).toLowerCase().includes(lowered),
        );

      try {
        if (serverFilter) {
          const result = await apolloClients.coreClient.query({
            query,
            variables: {
              limit: 25,
              filter: serverFilter,
            },
            fetchPolicy: 'network-only',
          });

          const connection = result.data?.[objectMetadata.namePlural] as
            | {
                edges: Array<{ node: Record<string, unknown> }>;
              }
            | undefined;

          setRecords(connection?.edges.map((edge) => edge.node) ?? []);
          return;
        }

        const result = await apolloClients.coreClient.query({
          query,
          variables: { limit: 50 },
          fetchPolicy: 'network-only',
        });
        const connection = result.data?.[objectMetadata.namePlural] as
          | {
              edges: Array<{ node: Record<string, unknown> }>;
            }
          | undefined;
        setRecords(
          filterClientSide(connection?.edges.map((edge) => edge.node) ?? []),
        );
      } catch (searchError) {
        try {
          const result = await apolloClients.coreClient.query({
            query,
            variables: { limit: 50 },
            fetchPolicy: 'network-only',
          });
          const connection = result.data?.[objectMetadata.namePlural] as
            | {
                edges: Array<{ node: Record<string, unknown> }>;
              }
            | undefined;
          setRecords(
            filterClientSide(connection?.edges.map((edge) => edge.node) ?? []),
          );
          setError(null);
        } catch {
          setError(
            searchError instanceof Error
              ? searchError.message
              : 'Search failed',
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(() => {
      void run();
    }, 300);

    return () => clearTimeout(timeout);
  }, [apolloClients, objectMetadata, objects, searchTerm]);

  return { records, isLoading, error };
};

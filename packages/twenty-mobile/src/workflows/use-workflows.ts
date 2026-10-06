import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/auth/auth-context';
import {
  GET_CORE_WORKFLOWS,
  RUN_WORKFLOW_VERSION,
  type CoreWorkflow,
} from '@/workflows/queries';
import { useObjects } from '@/metadata/objects-provider';
import {
  generateFindManyQuery,
  generateFindOneQuery,
} from '@/records/generate-queries';

export const useWorkflows = (enabled = true) => {
  const { apolloClients } = useAuth();
  const [workflows, setWorkflows] = useState<CoreWorkflow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!apolloClients || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apolloClients.coreClient.query<{
        coreWorkflows: {
          edges: Array<{ node: CoreWorkflow }>;
        };
      }>({
        query: GET_CORE_WORKFLOWS,
        variables: { first: 50 },
        fetchPolicy: 'network-only',
      });
      setWorkflows(
        result.data.coreWorkflows.edges.map((edge) => edge.node),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load workflows',
      );
    } finally {
      setIsLoading(false);
    }
  }, [apolloClients, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { workflows, isLoading, error, reload };
};

export const useWorkflowDetail = (workspaceWorkflowId: string | undefined) => {
  const { apolloClients } = useAuth();
  const { objects } = useObjects();
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [runs, setRuns] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workflowObject = objects.find(
    (object) => object.nameSingular === 'workflow',
  );
  const workflowRunObject = objects.find(
    (object) => object.nameSingular === 'workflowRun',
  );

  const reload = useCallback(async () => {
    if (!apolloClients || !workspaceWorkflowId || !workflowObject) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const findOne = generateFindOneQuery(workflowObject, objects);
      const workflowResult = await apolloClients.coreClient.query({
        query: findOne,
        variables: { objectRecordId: workspaceWorkflowId },
        fetchPolicy: 'network-only',
      });
      const workflowRecord = workflowResult.data?.[
        workflowObject.nameSingular
      ] as Record<string, unknown> | undefined;
      setRecord(workflowRecord ?? null);

      if (workflowRunObject) {
        const findRuns = generateFindManyQuery(workflowRunObject, objects);
        const runsResult = await apolloClients.coreClient.query({
          query: findRuns,
          variables: {
            limit: 20,
            filter: {
              workflowId: { eq: workspaceWorkflowId },
            },
            orderBy: [{ createdAt: 'DescNullsLast' }],
          },
          fetchPolicy: 'network-only',
        });
        const connection = runsResult.data?.[workflowRunObject.namePlural] as
          | {
              edges: Array<{ node: Record<string, unknown> }>;
            }
          | undefined;
        setRuns(connection?.edges.map((edge) => edge.node) ?? []);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load workflow',
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    apolloClients,
    objects,
    workflowObject,
    workflowRunObject,
    workspaceWorkflowId,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const runManually = useCallback(async () => {
    if (!apolloClients || !record) {
      throw new Error('Workflow not loaded');
    }

    const versionId = record.lastPublishedVersionId;
    if (typeof versionId !== 'string' || versionId.length === 0) {
      throw new Error('No published version to run');
    }

    setIsRunning(true);
    setError(null);

    try {
      await apolloClients.coreClient.mutate({
        mutation: RUN_WORKFLOW_VERSION,
        variables: {
          input: {
            workflowVersionId: versionId,
          },
        },
      });
      await reload();
    } catch (runError) {
      const message =
        runError instanceof Error ? runError.message : 'Failed to run workflow';
      setError(message);
      throw runError;
    } finally {
      setIsRunning(false);
    }
  }, [apolloClients, record, reload]);

  return {
    record,
    runs,
    isLoading,
    isRunning,
    error,
    reload,
    runManually,
  };
};

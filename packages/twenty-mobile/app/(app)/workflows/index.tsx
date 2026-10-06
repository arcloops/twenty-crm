import React, { useLayoutEffect } from 'react';
import { RefreshControl, Text } from 'react-native';
import { router, useNavigation } from 'expo-router';

import { hasWorkflowsPermission, useAuth } from '@/auth/auth-context';
import { EmptyState, ListRow, Screen, Spinner, useTheme } from '@/ui';
import { spacing } from '@/ui/theme';
import { useWorkflows } from '@/workflows/use-workflows';

export default function WorkflowsIndexScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const canUseWorkflows = hasWorkflowsPermission(user);
  const { workflows, isLoading, error, reload } = useWorkflows(canUseWorkflows);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Workflows' });
  }, [navigation]);

  if (!canUseWorkflows) {
    return (
      <Screen edges={['left', 'right']}>
        <EmptyState
          title="No access"
          description="Your role needs the WORKFLOWS permission flag."
        />
      </Screen>
    );
  }

  return (
    <Screen
      edges={['left', 'right']}
      scroll
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={() => void reload()} />
      }
    >
      <Text style={{ color: theme.text.secondary, marginBottom: spacing(1) }}>
        Inspect runs and trigger published versions. Builders stay on web.
      </Text>

      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}
      {isLoading && workflows.length === 0 ? <Spinner /> : null}

      {workflows.length === 0 && !isLoading ? (
        <EmptyState
          title="No workflows"
          description="Create and publish a workflow on web first."
        />
      ) : (
        workflows.map((workflow) => (
          <ListRow
            key={workflow.id}
            title={workflow.name || 'Untitled workflow'}
            subtitle={
              workflow.statuses?.join(', ') ||
              workflow.updatedAt?.slice(0, 16)?.replace('T', ' ') ||
              undefined
            }
            onPress={() =>
              router.push({
                pathname: '/(app)/workflows/[id]',
                params: {
                  id: workflow.workspaceWorkflowId || workflow.id,
                  name: workflow.name || 'Workflow',
                },
              })
            }
          />
        ))
      )}
    </Screen>
  );
}

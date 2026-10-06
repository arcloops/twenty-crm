import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';

import {
  Button,
  EmptyState,
  ListRow,
  Screen,
  Spinner,
  useTheme,
} from '@/ui';
import { radius, spacing } from '@/ui/theme';
import { useWorkflowDetail } from '@/workflows/use-workflows';

const statusColor = (
  status: string | undefined,
  theme: ReturnType<typeof useTheme>,
): string => {
  const normalized = (status ?? '').toUpperCase();
  if (
    normalized === 'COMPLETED' ||
    normalized === 'SUCCESS' ||
    normalized === 'SUCCEEDED'
  ) {
    return '#30a46c';
  }
  if (
    normalized === 'FAILED' ||
    normalized === 'ERROR' ||
    normalized === 'STOPPED'
  ) {
    return theme.danger;
  }
  if (
    normalized === 'RUNNING' ||
    normalized === 'PENDING' ||
    normalized === 'ENQUEUED'
  ) {
    return theme.accent.primary;
  }
  return theme.text.secondary;
};

export default function WorkflowDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const workflowId = typeof params.id === 'string' ? params.id : undefined;
  const {
    record,
    runs,
    isLoading,
    isRunning,
    error,
    reload,
    runManually,
  } = useWorkflowDetail(workflowId);
  const [selectedRun, setSelectedRun] = useState<Record<
    string,
    unknown
  > | null>(null);

  const title =
    (typeof record?.name === 'string' && record.name) ||
    params.name ||
    'Workflow';
  const versionId =
    typeof record?.lastPublishedVersionId === 'string'
      ? record.lastPublishedVersionId
      : null;
  const statuses = Array.isArray(record?.statuses)
    ? (record.statuses as string[]).join(', ')
    : null;

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  const handleRun = () => {
    void runManually()
      .then(() => {
        Alert.alert('Started', 'Workflow run enqueued.');
      })
      .catch((runError: unknown) => {
        Alert.alert(
          'Run failed',
          runError instanceof Error ? runError.message : 'Unknown error',
        );
      });
  };

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => void reload()}
        />
      }
    >
      <Text style={[styles.title, { color: theme.text.primary }]}>{title}</Text>
      {statuses ? (
        <Text style={{ color: theme.text.secondary, marginBottom: spacing(2) }}>
          {statuses}
        </Text>
      ) : null}

      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}
      {isLoading && !record ? <Spinner /> : null}

      <View style={styles.actions}>
        <Button
          label="Run published version"
          loading={isRunning}
          disabled={!versionId}
          onPress={handleRun}
        />
        {!versionId ? (
          <Text style={{ color: theme.text.tertiary, fontSize: 12 }}>
            Publish a version on web before running from mobile.
          </Text>
        ) : null}
      </View>

      <Text
        style={[
          styles.sectionTitle,
          { color: theme.text.primary, marginTop: spacing(4) },
        ]}
      >
        Recent runs
      </Text>

      {runs.length === 0 && !isLoading ? (
        <EmptyState
          title="No runs yet"
          description="Trigger a manual run or wait for automated triggers."
        />
      ) : (
        runs.map((run) => {
          const status =
            typeof run.status === 'string' ? run.status : undefined;
          return (
            <View key={String(run.id)}>
              <ListRow
                title={
                  typeof run.name === 'string' && run.name.length > 0
                    ? run.name
                    : status ?? 'Run'
                }
                subtitle={
                  [
                    status,
                    typeof run.startedAt === 'string'
                      ? run.startedAt.slice(0, 16).replace('T', ' ')
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || undefined
                }
                rightLabel={status}
                onPress={() => setSelectedRun(run)}
              />
              <View
                style={[
                  styles.statusBar,
                  { backgroundColor: statusColor(status, theme) },
                ]}
              />
            </View>
          );
        })
      )}

      <Modal
        visible={selectedRun != null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedRun(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.background.primary,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
              Run detail
            </Text>
            {selectedRun ? (
              <View style={styles.modalBody}>
                <Text style={{ color: theme.text.secondary }}>
                  Status:{' '}
                  <Text style={{ color: statusColor(String(selectedRun.status ?? ''), theme) }}>
                    {String(selectedRun.status ?? '—')}
                  </Text>
                </Text>
                <Text style={{ color: theme.text.secondary }}>
                  Started:{' '}
                  {typeof selectedRun.startedAt === 'string'
                    ? selectedRun.startedAt.replace('T', ' ').slice(0, 19)
                    : '—'}
                </Text>
                <Text style={{ color: theme.text.secondary }}>
                  Ended:{' '}
                  {typeof selectedRun.endedAt === 'string'
                    ? selectedRun.endedAt.replace('T', ' ').slice(0, 19)
                    : '—'}
                </Text>
                {typeof selectedRun.error === 'string' &&
                selectedRun.error.length > 0 ? (
                  <Text style={{ color: theme.danger }}>
                    Error: {selectedRun.error}
                  </Text>
                ) : null}
                {typeof selectedRun.message === 'string' &&
                selectedRun.message.length > 0 ? (
                  <Text style={{ color: theme.text.secondary }}>
                    {selectedRun.message}
                  </Text>
                ) : null}
              </View>
            ) : null}
            <Button
              label="Close"
              variant="secondary"
              onPress={() => setSelectedRun(null)}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  actions: {
    gap: spacing(1.5),
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: spacing(2),
  },
  statusBar: {
    borderRadius: radius.sm,
    height: 3,
    marginBottom: spacing(2),
    marginTop: -spacing(1),
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    gap: spacing(2),
    padding: spacing(4),
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    gap: spacing(1.5),
  },
});

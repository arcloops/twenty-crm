import React, { useLayoutEffect } from 'react';
import { RefreshControl, Text } from 'react-native';
import { router, useNavigation } from 'expo-router';

import { useObjects } from '@/metadata/objects-provider';
import { useRecordList } from '@/records/use-records';
import { EmptyState, ListRow, Screen, Spinner, useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

export default function DashboardsIndexScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { objects } = useObjects();
  const dashboardObject = objects.find(
    (object) => object.nameSingular === 'dashboard',
  );
  const { records, isLoading, error, reload, getTitle } =
    useRecordList(dashboardObject);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Dashboards' });
  }, [navigation]);

  return (
    <Screen
      edges={['left', 'right']}
      scroll
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={() => void reload()} />
      }
    >
      <Text style={{ color: theme.text.secondary, marginBottom: spacing(1) }}>
        Aggregate KPIs from your workspace dashboards.
      </Text>

      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}
      {isLoading && records.length === 0 ? <Spinner /> : null}

      {records.length === 0 && !isLoading ? (
        <EmptyState
          title="No dashboards"
          description="Create a dashboard on web to see KPIs here."
        />
      ) : (
        records.map((record) => {
          const pageLayoutId =
            typeof record.pageLayoutId === 'string'
              ? record.pageLayoutId
              : null;

          return (
            <ListRow
              key={String(record.id)}
              title={getTitle(record)}
              subtitle={pageLayoutId ? 'Open KPIs' : 'Missing layout'}
              onPress={
                pageLayoutId
                  ? () =>
                      router.push({
                        pathname: '/(app)/dashboards/[id]',
                        params: {
                          id: pageLayoutId,
                          title: getTitle(record),
                        },
                      })
                  : undefined
              }
            />
          );
        })
      )}
    </Screen>
  );
}

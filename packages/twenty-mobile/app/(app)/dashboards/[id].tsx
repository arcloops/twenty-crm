import React, { useLayoutEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';

import {
  useAggregateWidgets,
  usePageLayout,
} from '@/dashboards/use-dashboards';
import { EmptyState, Screen, Spinner, useTheme } from '@/ui';
import { radius, spacing } from '@/ui/theme';

export default function DashboardDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string; title?: string }>();
  const pageLayoutId = typeof params.id === 'string' ? params.id : undefined;
  const { pageLayout, isLoading, error, reload } = usePageLayout(pageLayoutId);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const {
    kpis,
    isLoading: kpisLoading,
    aggregateCount,
    nonAggregateCount,
    tabs,
    activeTabId,
    reload: reloadKpis,
  } = useAggregateWidgets(pageLayout, selectedTabId ?? undefined);

  const effectiveTabId = selectedTabId ?? activeTabId;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: params.title || pageLayout?.name || 'Dashboard',
    });
  }, [navigation, pageLayout?.name, params.title]);

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={isLoading || kpisLoading}
          onRefresh={() => {
            void reload();
            void reloadKpis();
          }}
        />
      }
    >
      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}
      {isLoading && !pageLayout ? <Spinner /> : null}

      {tabs.length > 1 ? (
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const selected = tab.id === effectiveTabId;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setSelectedTabId(tab.id)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: selected
                      ? theme.accent.soft
                      : theme.background.secondary,
                    borderColor: selected
                      ? theme.accent.primary
                      : theme.border.primary,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected
                      ? theme.accent.primary
                      : theme.text.primary,
                    fontWeight: selected ? '700' : '500',
                  }}
                >
                  {tab.title || 'Tab'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {!isLoading && aggregateCount === 0 ? (
        <EmptyState
          title="No aggregate widgets"
          description="This layout has no AGGREGATE KPIs. Open it on web for charts."
        />
      ) : null}

      {nonAggregateCount > 0 ? (
        <Text
          style={{
            color: theme.text.tertiary,
            marginBottom: spacing(2),
            fontSize: 13,
          }}
        >
          {nonAggregateCount} chart widget
          {nonAggregateCount === 1 ? '' : 's'} — open on web for charts
        </Text>
      ) : null}

      <View style={styles.grid}>
        {kpis.map((kpi) => (
          <View
            key={kpi.widgetId}
            style={[
              styles.card,
              {
                backgroundColor: theme.background.secondary,
                borderColor: theme.border.primary,
              },
            ]}
          >
            <Text style={{ color: theme.text.secondary, fontSize: 13 }}>
              {kpi.title}
            </Text>
            <Text style={[styles.value, { color: theme.text.primary }]}>
              {kpi.prefix ?? ''}
              {kpi.value}
              {kpi.suffix ?? ''}
            </Text>
            {kpi.label ? (
              <Text style={{ color: theme.text.tertiary, fontSize: 12 }}>
                {kpi.label}
              </Text>
            ) : null}
            {kpi.error ? (
              <Text style={{ color: theme.danger, fontSize: 11 }}>
                {kpi.error}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(1.5),
    marginBottom: spacing(3),
  },
  tabChip: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.5),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing(1),
    minWidth: '46%',
    padding: spacing(3),
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
});

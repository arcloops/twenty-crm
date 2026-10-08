import React, { useLayoutEffect, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';

import { useObjects } from '@/metadata/objects-provider';
import { OfflineBanner } from '@/offline/offline-banner';
import { useRecordList } from '@/records/use-records';
import {
  EmptyState,
  ListRow,
  Screen,
  Spinner,
  useTheme,
} from '@/ui';
import { KanbanBoard } from '@/views/kanban-board';
import { mapViewToGqlVariables } from '@/views/map-view-to-gql';
import { useObjectViews } from '@/views/use-object-views';
import { ViewChips } from '@/views/view-chips';
import { spacing } from '@/ui/theme';

type ObjectRecordsPanelProps = {
  namePlural: string;
  showHeaderActions?: boolean;
};

export const ObjectRecordsPanel = ({
  namePlural,
  showHeaderActions = true,
}: ObjectRecordsPanelProps) => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { getByPlural } = useObjects();
  const objectMetadata = getByPlural(namePlural);

  const {
    views,
    selectedView,
    selectedViewId,
    setSelectedViewId,
    isLoading: viewsLoading,
    error: viewsError,
  } = useObjectViews(objectMetadata?.id);

  const gqlVariables = useMemo(() => {
    if (!objectMetadata || !selectedView) {
      return {};
    }
    return mapViewToGqlVariables(selectedView, objectMetadata);
  }, [objectMetadata, selectedView]);

  const isKanban = selectedView?.type === 'KANBAN';

  const {
    records,
    isLoading,
    isLoadingMore,
    error,
    totalCount,
    isFromCache,
    hasNextPage,
    reload,
    loadMore,
    getTitle,
    getSubtitle,
  } = useRecordList(objectMetadata, isKanban ? undefined : gqlVariables);

  useLayoutEffect(() => {
    const title =
      namePlural === 'opportunities'
        ? 'Pipeline'
        : (objectMetadata?.labelPlural ?? namePlural);

    navigation.setOptions({
      title,
      ...(showHeaderActions
        ? {
            headerRight: () => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Search"
                hitSlop={10}
                style={styles.headerAction}
                onPress={() => router.push('/(app)/search')}
              >
                <Ionicons
                  name="search-outline"
                  size={22}
                  color={theme.accent.primary}
                />
              </Pressable>
            ),
          }
        : {}),
    });
  }, [
    namePlural,
    navigation,
    objectMetadata,
    showHeaderActions,
    theme.accent.primary,
  ]);

  if (!objectMetadata) {
    return (
      <Screen edges={['left', 'right']}>
        <EmptyState
          title="Object not found"
          description={`${namePlural} is not available in this workspace.`}
        />
      </Screen>
    );
  }

  return (
    <Screen
      edges={['left', 'right']}
      style={styles.screen}
      contentStyle={styles.content}
    >
      <OfflineBanner isFromCache={isFromCache} />
      <ViewChips
        views={views}
        selectedViewId={selectedViewId}
        onSelect={setSelectedViewId}
      />

      <View style={styles.meta}>
        <Text style={{ color: theme.text.secondary, fontSize: 13 }}>
          {selectedView?.name ?? 'Records'}
          {totalCount !== null && !isKanban ? ` · ${totalCount}` : ''}
        </Text>
      </View>

      {gqlVariables.skippedOperands &&
      gqlVariables.skippedOperands.length > 0 ? (
        <Text style={{ color: theme.danger, fontSize: 13 }}>
          Some saved filters were skipped (
          {gqlVariables.skippedOperands.join(', ')}). Edit the view on web for
          full coverage.
        </Text>
      ) : null}

      {viewsError ? (
        <Text style={{ color: theme.danger }}>{viewsError}</Text>
      ) : null}
      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}
      {(isLoading || viewsLoading) && records.length === 0 && !isKanban ? (
        <Spinner />
      ) : null}

      {isKanban && selectedView ? (
        <KanbanBoard objectMetadata={objectMetadata} view={selectedView} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          style={styles.listFlex}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                void reload();
              }}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isLoadingMore) {
              void loadMore();
            }
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                title={`No ${objectMetadata.labelPlural.toLowerCase()}`}
                description={`Add your first ${objectMetadata.labelSingular.toLowerCase()} to get started.`}
                actionLabel={`Add ${objectMetadata.labelSingular.toLowerCase()}`}
                onAction={() =>
                  router.push({
                    pathname: '/(app)/object/[singular]/new',
                    params: { singular: objectMetadata.nameSingular },
                  })
                }
              />
            ) : null
          }
          ListFooterComponent={isLoadingMore ? <Spinner /> : null}
          renderItem={({ item }) => (
            <ListRow
              title={getTitle(item)}
              subtitle={getSubtitle(item)}
              onPress={() =>
                router.push({
                  pathname: '/(app)/object/[singular]/[id]',
                  params: {
                    singular: objectMetadata.nameSingular,
                    id: String(item.id),
                  },
                })
              }
            />
          )}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  content: { flex: 1, paddingBottom: 0, gap: spacing(2) },
  meta: { marginBottom: 0 },
  listFlex: { flex: 1 },
  list: { gap: spacing(2), paddingBottom: spacing(20) },
  headerAction: {
    marginRight: spacing(3),
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(1),
  },
});

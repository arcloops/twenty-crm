import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import type { ObjectMetadata } from '@/metadata/types';
import { useRecordList } from '@/records/use-records';
import {
  buildKanbanColumnFilter,
  getGroupByField,
  mapViewToGqlVariables,
} from '@/views/map-view-to-gql';
import type { WorkspaceView } from '@/views/types';
import { EmptyState, ListRow, Spinner, useTheme, spacing, radius } from '@/ui';

type KanbanColumnProps = {
  objectMetadata: ObjectMetadata;
  title: string;
  filter: Record<string, unknown>;
  orderBy?: Array<Record<string, unknown>>;
};

const KanbanColumn = ({
  objectMetadata,
  title,
  filter,
  orderBy,
}: KanbanColumnProps) => {
  const theme = useTheme();
  const { records, isLoading, getTitle, getSubtitle } = useRecordList(
    objectMetadata,
    {
      filter,
      orderBy,
      limit: 12,
    },
  );

  return (
    <View
      style={[
        styles.column,
        {
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.primary,
        },
      ]}
    >
      <Text style={[styles.columnTitle, { color: theme.text.primary }]}>
        {title}
      </Text>
      {isLoading && records.length === 0 ? <Spinner /> : null}
      <View style={styles.cards}>
        {records.map((item) => (
          <ListRow
            key={String(item.id)}
            title={getTitle(item)}
            subtitle={getSubtitle(item)}
            showChevron={false}
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
        ))}
        {!isLoading && records.length === 0 ? (
          <Text style={{ color: theme.text.tertiary, fontSize: 13 }}>
            No records
          </Text>
        ) : null}
      </View>
    </View>
  );
};

type KanbanBoardProps = {
  objectMetadata: ObjectMetadata;
  view: WorkspaceView;
};

export const KanbanBoard = ({ objectMetadata, view }: KanbanBoardProps) => {
  const theme = useTheme();
  const groupByField = getGroupByField(view, objectMetadata);
  const baseVariables = useMemo(
    () => mapViewToGqlVariables(view, objectMetadata),
    [view, objectMetadata],
  );

  const columns = useMemo(() => {
    if (!groupByField) {
      return [];
    }

    const fromGroups = [...view.viewGroups]
      .filter((group) => group.isVisible)
      .sort((left, right) => left.position - right.position)
      .map((group) => {
        const option = groupByField.options?.find(
          (item) => item.value === group.fieldValue,
        );
        return {
          id: group.id,
          title: option?.label ?? (group.fieldValue || 'No value'),
          fieldValue: group.fieldValue,
        };
      });

    if (fromGroups.length > 0) {
      return fromGroups;
    }

    return (groupByField.options ?? [])
      .slice()
      .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
      .map((option) => ({
        id: option.value,
        title: option.label,
        fieldValue: option.value,
      }));
  }, [groupByField, view.viewGroups]);

  if (!groupByField) {
    return (
      <EmptyState
        title="Kanban unavailable"
        description="This view has no group-by field configured."
      />
    );
  }

  return (
    <ScrollView
      horizontal
      style={styles.board}
      contentContainerStyle={styles.boardContent}
      showsHorizontalScrollIndicator={false}
    >
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          objectMetadata={objectMetadata}
          title={column.title}
          orderBy={baseVariables.orderBy}
          filter={buildKanbanColumnFilter(
            groupByField,
            column.fieldValue,
            baseVariables.filter,
          )}
        />
      ))}
      {columns.length === 0 ? (
        <Text style={{ color: theme.text.secondary }}>
          No board columns configured.
        </Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  board: { flex: 1 },
  boardContent: {
    gap: spacing(3),
    paddingBottom: spacing(6),
    paddingRight: spacing(2),
  },
  column: {
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing(2),
    padding: spacing(2),
    width: 280,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cards: {
    gap: spacing(2),
  },
});

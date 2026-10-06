import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { WorkspaceView } from '@/views/types';
import { useTheme, radius, spacing } from '@/ui';

type ViewChipsProps = {
  views: WorkspaceView[];
  selectedViewId: string | null;
  onSelect: (viewId: string) => void;
};

export const ViewChips = ({
  views,
  selectedViewId,
  onSelect,
}: ViewChipsProps) => {
  const theme = useTheme();

  if (views.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {views.map((item) => {
        const isSelected = item.id === selectedViewId;

        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected
                  ? theme.accent.soft
                  : theme.background.secondary,
                borderColor: isSelected
                  ? theme.accent.primary
                  : theme.border.primary,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={{
                color: isSelected ? theme.accent.primary : theme.text.primary,
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              {item.name}
              {item.type === 'KANBAN' ? ' · Board' : ''}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    alignItems: 'center',
    gap: spacing(2),
    paddingVertical: spacing(1),
  },
  chip: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/ui/theme-provider';
import { spacing } from '@/ui/theme';

type ListRowProps = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightLabel?: string;
  showChevron?: boolean;
  testID?: string;
};

export const ListRow = ({
  title,
  subtitle,
  onPress,
  rightLabel,
  showChevron = true,
  testID,
}: ListRowProps) => {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed
            ? theme.background.tertiary
            : theme.background.secondary,
          borderColor: theme.border.primary,
        },
      ]}
    >
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: theme.text.primary }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={2}
            style={[styles.subtitle, { color: theme.text.secondary }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightLabel ? (
        <Text style={{ color: theme.text.tertiary }}>{rightLabel}</Text>
      ) : null}
      {showChevron && onPress ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.text.tertiary}
        />
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing(2),
    minHeight: 56,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 13,
  },
});

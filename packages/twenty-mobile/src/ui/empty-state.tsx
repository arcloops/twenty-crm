import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/ui/button';
import { useTheme } from '@/ui/theme-provider';
import { spacing } from '@/ui/theme';

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text.primary }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: theme.text.secondary }]}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing(2),
    paddingVertical: spacing(10),
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing(2),
    minWidth: 180,
  },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/ui';
import { radius, spacing } from '@/ui/theme';

type BannerStripProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
};

export const BannerStrip = ({
  message,
  actionLabel,
  onAction,
  onDismiss,
}: BannerStripProps) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.accent.soft,
          borderColor: theme.accent.primary,
        },
      ]}
    >
      <Text style={[styles.message, { color: theme.text.primary }]}>
        {message}
      </Text>
      <View style={styles.actions}>
        {actionLabel && onAction ? (
          <Pressable hitSlop={8} onPress={onAction}>
            <Text style={{ color: theme.accent.primary, fontWeight: '600' }}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
        {onDismiss ? (
          <Pressable hitSlop={8} onPress={onDismiss}>
            <Text style={{ color: theme.text.secondary }}>Dismiss</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing(1.5),
    marginBottom: spacing(2),
    padding: spacing(2.5),
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing(3),
  },
});

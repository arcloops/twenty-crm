import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/ui/theme-provider';

type SpinnerProps = {
  fullScreen?: boolean;
};

export const Spinner = ({ fullScreen = false }: SpinnerProps) => {
  const theme = useTheme();

  return (
    <View style={[styles.base, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={theme.accent.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullScreen: {
    flex: 1,
  },
});

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  SafeAreaView,
  type Edge,
} from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme-provider';
import { spacing } from '@/ui/theme';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  // Screens under a nav header should omit 'top' to avoid double inset
  edges?: Edge[];
};

export const Screen = ({
  children,
  scroll = false,
  style,
  contentStyle,
  refreshControl,
  edges = ['top', 'left', 'right'],
}: ScreenProps) => {
  const theme = useTheme();

  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.flex,
        { backgroundColor: theme.background.primary },
        style,
      ]}
    >
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing(4),
    gap: spacing(3),
  },
});

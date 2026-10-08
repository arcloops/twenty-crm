import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';

import { useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

type DrawerCapableNavigation = {
  openDrawer?: () => void;
  getParent?: () => DrawerCapableNavigation | undefined;
};

export const HeaderMenuButton = () => {
  const theme = useTheme();
  const navigation = useNavigation() as DrawerCapableNavigation;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      hitSlop={10}
      style={styles.headerButton}
      onPress={() => {
        const parent = navigation.getParent?.();
        if (parent?.openDrawer) {
          parent.openDrawer();
          return;
        }
        navigation.openDrawer?.();
      }}
    >
      <Ionicons name="menu-outline" size={24} color={theme.text.primary} />
    </Pressable>
  );
};

export const HeaderSearchButton = () => {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Search"
      hitSlop={10}
      style={styles.headerButton}
      onPress={() => router.push('/(app)/search')}
    >
      <Ionicons name="search-outline" size={22} color={theme.accent.primary} />
    </Pressable>
  );
};

export const HeaderActions = () => (
  <View style={styles.headerActions}>
    <HeaderSearchButton />
  </View>
);

const styles = StyleSheet.create({
  headerButton: {
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(1),
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: spacing(1),
  },
});

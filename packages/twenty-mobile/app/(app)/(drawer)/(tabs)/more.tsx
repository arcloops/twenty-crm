import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';

import { MORE_ITEMS, openNavItem } from '@/navigation/app-nav-config';
import { QuickActionFab } from '@/navigation/quick-action-fab';
import { ListRow, Screen, useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

export default function MoreTabScreen() {
  const theme = useTheme();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Browse' });
  }, [navigation]);

  return (
    <View style={styles.root}>
      <Screen scroll>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text.primary }]}>
            Browse
          </Text>
          <Text style={{ color: theme.text.secondary }}>
            Companies, notes, insights, and settings
          </Text>
        </View>

        {MORE_ITEMS.map((item) => (
          <ListRow
            key={item.key}
            title={item.label}
            subtitle={item.subtitle}
            onPress={() => openNavItem(item)}
            showChevron
          />
        ))}
      </Screen>
      <QuickActionFab mode="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    gap: spacing(1),
    marginBottom: spacing(2),
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
});

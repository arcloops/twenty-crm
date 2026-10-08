import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/ui';
import { radius, spacing } from '@/ui/theme';

export type QuickActionFabProps =
  | { mode: 'people' }
  | { mode: 'object'; singular: string; labelSingular: string }
  | { mode: 'home' };

type MenuItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
};

export const QuickActionFab = (props: QuickActionFabProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const goNew = (singular: string) => {
    setMenuOpen(false);
    router.push({
      pathname: '/(app)/object/[singular]/new',
      params: { singular },
    });
  };

  const goScan = () => {
    setMenuOpen(false);
    router.push('/(app)/people/scan-card');
  };

  const items: MenuItem[] =
    props.mode === 'people'
      ? [
          {
            key: 'new-person',
            label: 'New person',
            icon: 'person-add-outline',
            onPress: () => goNew('person'),
          },
          {
            key: 'scan',
            label: 'Scan business card',
            icon: 'camera-outline',
            onPress: goScan,
          },
        ]
      : props.mode === 'object'
        ? [
            {
              key: 'new',
              label: `New ${props.labelSingular.toLowerCase()}`,
              icon: 'add-outline',
              onPress: () => goNew(props.singular),
            },
          ]
        : [
            {
              key: 'new-person',
              label: 'New person',
              icon: 'person-add-outline',
              onPress: () => goNew('person'),
            },
            {
              key: 'new-task',
              label: 'New task',
              icon: 'checkbox-outline',
              onPress: () => goNew('task'),
            },
            {
              key: 'scan',
              label: 'Scan business card',
              icon: 'camera-outline',
              onPress: goScan,
            },
          ];

  const singleAction = items.length === 1 ? items[0] : null;
  const fabBottom = Math.max(insets.bottom, spacing(2)) + spacing(7);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          singleAction ? singleAction.label : 'Quick actions'
        }
        onPress={() => {
          if (singleAction) {
            singleAction.onPress();
            return;
          }
          setMenuOpen(true);
        }}
        style={[
          styles.fab,
          {
            backgroundColor: theme.accent.primary,
            bottom: fabBottom,
          },
        ]}
      >
        <Ionicons name="add" size={28} color={theme.text.inverted} />
      </Pressable>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            style={StyleSheet.absoluteFill}
            onPress={() => setMenuOpen(false)}
          />
          <View
            style={[
              styles.menu,
              {
                backgroundColor: theme.background.primary,
                borderColor: theme.border.primary,
                bottom: fabBottom + spacing(16),
              },
            ]}
          >
            {items.map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.menuRow,
                  {
                    backgroundColor: pressed
                      ? theme.background.tertiary
                      : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={theme.accent.primary}
                />
                <Text
                  style={[styles.menuLabel, { color: theme.text.primary }]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    borderRadius: 28,
    elevation: 4,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    width: 56,
    zIndex: 20,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
  },
  menu: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing(0.5),
    minWidth: 220,
    padding: spacing(2),
    position: 'absolute',
    right: spacing(4),
    zIndex: 2,
  },
  menuRow: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing(3),
    minHeight: 48,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});

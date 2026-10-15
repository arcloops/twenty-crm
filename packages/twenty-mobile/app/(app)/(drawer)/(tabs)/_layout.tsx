import { Ionicons } from '@expo/vector-icons';
import { Tabs, router, useNavigation } from 'expo-router';
import { Pressable } from 'react-native';

import { useTheme } from '@/ui';

type DrawerParentNavigation = {
  openDrawer?: () => void;
};

const MenuButton = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      hitSlop={10}
      style={{ marginLeft: 8, padding: 4 }}
      onPress={() => {
        let current:
          | (DrawerParentNavigation & {
              getParent?: () => DrawerParentNavigation | undefined;
            })
          | undefined = navigation as DrawerParentNavigation & {
          getParent?: () => DrawerParentNavigation | undefined;
        };

        while (current) {
          if (typeof current.openDrawer === 'function') {
            current.openDrawer();
            return;
          }
          current = current.getParent?.();
        }
      }}
    >
      <Ionicons name="menu-outline" size={24} color={theme.text.primary} />
    </Pressable>
  );
};

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: theme.accent.primary,
        tabBarInactiveTintColor: theme.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.background.primary,
          borderTopColor: theme.border.primary,
        },
        headerStyle: {
          backgroundColor: theme.background.primary,
        },
        headerTintColor: theme.text.primary,
        headerLeft: () => <MenuButton />,
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={10}
            style={{ marginRight: 12 }}
            onPress={() => router.push('/(app)/settings')}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={theme.accent.primary}
            />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: 'People',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="companies"
        options={{
          title: 'Companies',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="opportunities"
        options={{
          title: 'Pipeline',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

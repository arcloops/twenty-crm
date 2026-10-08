import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  HeaderActions,
  HeaderMenuButton,
} from '@/navigation/app-chrome';
import { useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

type TabIconProps = {
  focused: boolean;
  color: ColorValue;
  size: number;
  outline: keyof typeof Ionicons.glyphMap;
  filled: keyof typeof Ionicons.glyphMap;
};

const TabIcon = ({
  focused,
  color,
  size,
  outline,
  filled,
}: TabIconProps) => (
  <Ionicons
    name={focused ? filled : outline}
    color={typeof color === 'string' ? color : undefined}
    size={size}
  />
);

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + Math.max(insets.bottom, spacing(1));

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: theme.background.primary,
          borderBottomColor: theme.border.primary,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        headerTitleStyle: {
          color: theme.text.primary,
          fontSize: 17,
          fontWeight: '700',
        },
        headerTintColor: theme.text.primary,
        headerLeft: () => <HeaderMenuButton />,
        headerLeftContainerStyle: {
          paddingLeft: spacing(1),
        },
        headerRight: () => <HeaderActions />,
        tabBarActiveTintColor: theme.accent.primary,
        tabBarInactiveTintColor: theme.text.tertiary,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarItemStyle: {
          paddingTop: spacing(1),
        },
        tabBarStyle: {
          backgroundColor: theme.background.primary,
          borderTopColor: theme.border.primary,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 8,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, spacing(1)),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: theme.name === 'dark' ? 0.25 : 0.06,
          shadowRadius: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              outline="home-outline"
              filled="home"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: 'People',
          tabBarLabel: 'People',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              outline="people-outline"
              filled="people"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="opportunities"
        options={{
          title: 'Pipeline',
          tabBarLabel: 'Pipeline',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              outline="trending-up-outline"
              filled="trending-up"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              outline="checkbox-outline"
              filled="checkbox"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          href: null,
          title: 'Browse',
        }}
      />
    </Tabs>
  );
}

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from 'expo-router/drawer';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import {
  DRAWER_CRM_ITEMS,
  DRAWER_DAILY_ITEMS,
  DRAWER_INSIGHT_ITEMS,
  DRAWER_WORKSPACE_ITEMS,
  type AppNavItem,
  openNavItem,
} from '@/navigation/app-nav-config';
import { useTheme } from '@/ui';
import { radius, spacing } from '@/ui/theme';

type AppDrawerContentProps = {
  navigation: {
    closeDrawer: () => void;
  };
};

const navigateFromDrawer = (
  item: AppNavItem,
  closeDrawer: () => void,
) => {
  closeDrawer();
  openNavItem(item);
};

type DrawerLinkProps = {
  item: AppNavItem;
  isActive: boolean;
  onPress: () => void;
};

const DrawerLink = ({ item, isActive, onPress }: DrawerLinkProps) => {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.link,
        {
          backgroundColor: isActive
            ? theme.accent.soft
            : pressed
              ? theme.background.tertiary
              : 'transparent',
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: isActive
              ? theme.accent.primary
              : theme.background.tertiary,
          },
        ]}
      >
        <Ionicons
          name={item.icon}
          size={18}
          color={isActive ? theme.text.inverted : theme.accent.primary}
        />
      </View>
      <View style={styles.linkText}>
        <Text
          style={[
            styles.linkTitle,
            {
              color: isActive ? theme.accent.primary : theme.text.primary,
              fontWeight: isActive ? '700' : '500',
            },
          ]}
        >
          {item.label}
        </Text>
        {item.subtitle ? (
          <Text style={{ color: theme.text.tertiary, fontSize: 12 }}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

type SectionProps = {
  title: string;
  items: AppNavItem[];
  pathname: string;
  onSelect: (item: AppNavItem) => void;
};

const Section = ({ title, items, pathname, onSelect }: SectionProps) => {
  const theme = useTheme();

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text.tertiary }]}>
        {title}
      </Text>
      {items.map((item) => {
        const href = String(item.href);
        const isActive =
          pathname === href ||
          pathname.endsWith(`/${item.key}`) ||
          (item.params?.plural
            ? pathname.includes(`/objects/${item.params.plural}`) ||
              pathname.includes(`objects/${item.params.plural}`)
            : false) ||
          (item.href === '/(app)/settings' && pathname.includes('/settings')) ||
          (item.href === '/(app)/companies' && pathname.includes('/companies')) ||
          (item.href === '/(app)/dashboards' &&
            pathname.includes('/dashboards')) ||
          (item.href === '/(app)/workflows' && pathname.includes('/workflows'));

        return (
          <DrawerLink
            key={item.key}
            item={item}
            isActive={isActive}
            onPress={() => onSelect(item)}
          />
        );
      })}
    </View>
  );
};

export const AppDrawerContent = ({ navigation }: AppDrawerContentProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const displayName =
    [
      user?.workspaceMember?.name?.firstName,
      user?.workspaceMember?.name?.lastName,
    ]
      .filter(Boolean)
      .join(' ') ||
    user?.firstName ||
    user?.email ||
    'User';

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const closeDrawer = () => {
    navigation.closeDrawer();
  };

  return (
    <DrawerContentScrollView
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: theme.background.primary,
          paddingBottom: insets.bottom + spacing(4),
          paddingTop: insets.top + spacing(2),
        },
      ]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.background.secondary,
            borderColor: theme.border.primary,
          },
        ]}
      >
        <View
          style={[styles.avatar, { backgroundColor: theme.accent.primary }]}
        >
          <Text style={[styles.avatarText, { color: theme.text.inverted }]}>
            {initials || 'A'}
          </Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.brand, { color: theme.text.primary }]}>
            Arcloops CRM
          </Text>
          <Text style={{ color: theme.text.secondary }} numberOfLines={1}>
            {displayName}
          </Text>
          {user?.currentWorkspace?.displayName ? (
            <Text
              style={{ color: theme.text.tertiary, fontSize: 13 }}
              numberOfLines={1}
            >
              {user.currentWorkspace.displayName}
            </Text>
          ) : null}
        </View>
      </View>

      <Section
        title="Daily"
        items={DRAWER_DAILY_ITEMS}
        pathname={pathname}
        onSelect={(item) => navigateFromDrawer(item, closeDrawer)}
      />
      <Section
        title="CRM"
        items={DRAWER_CRM_ITEMS}
        pathname={pathname}
        onSelect={(item) => navigateFromDrawer(item, closeDrawer)}
      />
      <Section
        title="Insights"
        items={DRAWER_INSIGHT_ITEMS}
        pathname={pathname}
        onSelect={(item) => navigateFromDrawer(item, closeDrawer)}
      />
      <Section
        title="Workspace"
        items={DRAWER_WORKSPACE_ITEMS}
        pathname={pathname}
        onSelect={(item) => navigateFromDrawer(item, closeDrawer)}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          closeDrawer();
          void signOut().then(() => router.replace('/(auth)/login'));
        }}
        style={({ pressed }) => [
          styles.signOut,
          {
            borderColor: theme.border.primary,
            backgroundColor: pressed
              ? theme.background.tertiary
              : theme.background.secondary,
          },
        ]}
      >
        <Ionicons name="log-out-outline" size={18} color={theme.text.danger} />
        <Text style={{ color: theme.text.danger, fontWeight: '600' }}>
          Sign out
        </Text>
      </Pressable>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: spacing(2),
    paddingHorizontal: spacing(3),
  },
  header: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing(3),
    marginBottom: spacing(2),
    padding: spacing(3),
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  brand: {
    fontSize: 17,
    fontWeight: '700',
  },
  section: {
    gap: spacing(0.5),
    marginTop: spacing(1),
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: spacing(1),
    textTransform: 'uppercase',
  },
  link: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing(2),
    minHeight: 48,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  linkText: {
    flex: 1,
    gap: 1,
  },
  linkTitle: {
    fontSize: 15,
  },
  signOut: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing(2),
    marginTop: spacing(3),
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
  },
});

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import {
  DRAWER_CRM_ITEMS,
  DRAWER_DAILY_ITEMS,
  DRAWER_INSIGHT_ITEMS,
  DRAWER_WORKSPACE_ITEMS,
  type AppNavItem,
} from '@/navigation/app-nav-config';
import { useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

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

  if (item.href === '/(app)/objects/[plural]') {
    router.push({
      pathname: '/(app)/objects/[plural]',
      params: { plural: item.params?.plural ?? 'people' },
    });
    return;
  }

  router.push(item.href);
};

type DrawerLinkProps = {
  item: AppNavItem;
  onPress: () => void;
};

const DrawerLink = ({ item, onPress }: DrawerLinkProps) => {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.link,
        {
          backgroundColor: pressed
            ? theme.background.tertiary
            : 'transparent',
        },
      ]}
    >
      <View
        style={[styles.iconWrap, { backgroundColor: theme.accent.soft }]}
      >
        <Ionicons
          name={item.icon}
          size={18}
          color={theme.accent.primary}
        />
      </View>
      <View style={styles.linkText}>
        <Text style={[styles.linkTitle, { color: theme.text.primary }]}>
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
  onSelect: (item: AppNavItem) => void;
};

const Section = ({ title, items, onSelect }: SectionProps) => {
  const theme = useTheme();

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text.tertiary }]}>
        {title}
      </Text>
      {items.map((item) => (
        <DrawerLink
          key={item.key}
          item={item}
          onPress={() => onSelect(item)}
        />
      ))}
    </View>
  );
};

export const AppDrawerContent = ({ navigation }: AppDrawerContentProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const displayName =
    user?.workspaceMember?.name?.firstName ||
    user?.firstName ||
    user?.email ||
    'User';

  const closeDrawer = () => {
    navigation.closeDrawer();
  };
  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: theme.background.primary,
          paddingBottom: insets.bottom + spacing(4),
          paddingTop: insets.top + spacing(2),
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.brand, { color: theme.text.primary }]}>
          Arcloops CRM
        </Text>
        <Text style={{ color: theme.text.secondary }}>{displayName}</Text>
        {user?.currentWorkspace?.displayName ? (
          <Text style={{ color: theme.text.tertiary, fontSize: 13 }}>
            {user.currentWorkspace.displayName}
          </Text>
        ) : null}
      </View>

      <Section
        title="Daily"
        items={DRAWER_DAILY_ITEMS}
        onSelect={(item) => navigateFromDrawer(item, closeDrawer)}
      />
      <Section
        title="More CRM"
        items={DRAWER_CRM_ITEMS}
        onSelect={(item) => navigateFromDrawer(item, closeDrawer)}
      />
      <Section
        title="Insights"
        items={DRAWER_INSIGHT_ITEMS}
        onSelect={(item) => navigateFromDrawer(item, closeDrawer)}
      />
      <Section
        title="Workspace"
        items={DRAWER_WORKSPACE_ITEMS}
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
        <Ionicons
          name="log-out-outline"
          size={18}
          color={theme.text.danger}
        />
        <Text style={{ color: theme.text.danger, fontWeight: '600' }}>
          Sign out
        </Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  header: {
    gap: 2,
    marginBottom: spacing(4),
    paddingHorizontal: spacing(4),
  },
  brand: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing(1),
  },
  section: {
    marginBottom: spacing(3),
    paddingHorizontal: spacing(2),
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: spacing(1),
    marginLeft: spacing(2),
    textTransform: 'uppercase',
  },
  link: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: spacing(3),
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(2),
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 8,
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
    fontWeight: '600',
  },
  signOut: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing(2),
    marginHorizontal: spacing(4),
    marginTop: spacing(2),
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
  },
});

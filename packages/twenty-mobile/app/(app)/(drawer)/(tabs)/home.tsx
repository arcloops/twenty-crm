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

import { useAuth } from '@/auth/auth-context';
import { BannerStrip } from '@/banners/banner-strip';
import { useReconnectAccountBanner } from '@/banners/use-reconnect-account-banner';
import { useMobileT } from '@/i18n/use-mobile-t';
import {
  HOME_QUICK_ACTIONS,
  type AppNavItem,
} from '@/navigation/app-nav-config';
import { Screen, useTheme } from '@/ui';
import { radius, spacing } from '@/ui/theme';

const openNavItem = (item: AppNavItem) => {
  if (item.href === '/(app)/objects/[plural]') {
    router.push({
      pathname: '/(app)/objects/[plural]',
      params: { plural: item.params?.plural ?? 'people' },
    });
    return;
  }

  router.push(item.href);
};

export default function HomeScreen() {
  const theme = useTheme();
  const t = useMobileT();
  const { user } = useAuth();
  const reconnectBanner = useReconnectAccountBanner();

  const displayName =
    user?.workspaceMember?.name?.firstName ||
    user?.firstName ||
    user?.email ||
    'User';

  const quickActions = [
    ...HOME_QUICK_ACTIONS,
    {
      key: 'workflows',
      label: 'Workflows',
      subtitle: 'Runs',
      icon: 'git-network-outline' as const,
      href: '/(app)/workflows' as const,
    },
  ];

  return (
    <Screen
      edges={['left', 'right']}
      style={styles.screen}
      contentStyle={styles.content}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={[styles.greeting, { color: theme.text.secondary }]}>
            Welcome back
          </Text>
          <Text style={[styles.name, { color: theme.text.primary }]}>
            {displayName}
          </Text>
          {user?.currentWorkspace?.displayName ? (
            <Text style={{ color: theme.text.tertiary }}>
              {user.currentWorkspace.displayName}
            </Text>
          ) : null}
          <Text style={[styles.hint, { color: theme.text.tertiary }]}>
            Bottom bar: Home, People, Companies, Pipeline, Search. Menu: Tasks,
            Notes, Dashboards, Workflows, and Settings.
          </Text>
        </View>

        {reconnectBanner.shouldShow ? (
          <BannerStrip
            message={t('Reconnect account')}
            actionLabel={t('Accounts')}
            onAction={() => router.push('/(app)/settings/accounts')}
            onDismiss={reconnectBanner.dismiss}
          />
        ) : null}

        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Quick access
        </Text>
        <View style={styles.grid}>
          {quickActions.map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              onPress={() => openNavItem(item)}
              style={({ pressed }) => [
                styles.tile,
                {
                  backgroundColor: pressed
                    ? theme.background.tertiary
                    : theme.background.secondary,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <View
                style={[styles.tileIcon, { backgroundColor: theme.accent.soft }]}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={theme.accent.primary}
                />
              </View>
              <Text style={[styles.tileTitle, { color: theme.text.primary }]}>
                {item.label}
              </Text>
              {item.subtitle ? (
                <Text style={{ color: theme.text.tertiary, fontSize: 12 }}>
                  {item.subtitle}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 0,
  },
  content: {
    flex: 1,
    paddingBottom: 0,
  },
  scroll: {
    gap: spacing(3),
    paddingBottom: spacing(8),
  },
  hero: {
    gap: 4,
  },
  greeting: {
    fontSize: 13,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing(2),
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
  },
  tile: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing(1),
    padding: spacing(3),
    width: '48%',
  },
  tileIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 32,
    justifyContent: 'center',
    marginBottom: spacing(1),
    width: 32,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
});

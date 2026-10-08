import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export type AppNavIconName = ComponentProps<typeof Ionicons>['name'];

export type AppNavHref =
  | '/(app)/(drawer)/(tabs)/home'
  | '/(app)/(drawer)/(tabs)/people'
  | '/(app)/(drawer)/(tabs)/opportunities'
  | '/(app)/(drawer)/(tabs)/tasks'
  | '/(app)/(drawer)/(tabs)/more'
  | '/(app)/companies'
  | '/(app)/objects/[plural]'
  | '/(app)/dashboards'
  | '/(app)/workflows'
  | '/(app)/settings'
  | '/(app)/search';

export type AppNavItem = {
  key: string;
  label: string;
  subtitle?: string;
  icon: AppNavIconName;
  activeIcon?: AppNavIconName;
  href: AppNavHref;
  params?: Record<string, string>;
};

export const TAB_HOME = '/(app)/(drawer)/(tabs)/home' as const;
export const TAB_PEOPLE = '/(app)/(drawer)/(tabs)/people' as const;
export const TAB_PIPELINE = '/(app)/(drawer)/(tabs)/opportunities' as const;
export const TAB_TASKS = '/(app)/(drawer)/(tabs)/tasks' as const;
export const TAB_MORE = '/(app)/(drawer)/(tabs)/more' as const;

export const BOTTOM_TAB_ITEMS = [
  {
    key: 'home',
    label: 'Home',
    icon: 'home-outline' as const,
    activeIcon: 'home' as const,
    href: TAB_HOME,
  },
  {
    key: 'people',
    label: 'People',
    icon: 'people-outline' as const,
    activeIcon: 'people' as const,
    href: TAB_PEOPLE,
  },
  {
    key: 'opportunities',
    label: 'Pipeline',
    icon: 'trending-up-outline' as const,
    activeIcon: 'trending-up' as const,
    href: TAB_PIPELINE,
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: 'checkbox-outline' as const,
    activeIcon: 'checkbox' as const,
    href: TAB_TASKS,
  },
] as const;

export const DRAWER_DAILY_ITEMS: AppNavItem[] = [
  {
    key: 'home',
    label: 'Home',
    subtitle: 'Today and follow-ups',
    icon: 'home-outline',
    href: TAB_HOME,
  },
  {
    key: 'people',
    label: 'People',
    subtitle: 'Contacts',
    icon: 'people-outline',
    href: TAB_PEOPLE,
  },
  {
    key: 'opportunities',
    label: 'Pipeline',
    subtitle: 'Opportunities',
    icon: 'trending-up-outline',
    href: TAB_PIPELINE,
  },
  {
    key: 'tasks',
    label: 'Tasks',
    subtitle: 'Follow-ups',
    icon: 'checkbox-outline',
    href: TAB_TASKS,
  },
];

export const DRAWER_CRM_ITEMS: AppNavItem[] = [
  {
    key: 'companies',
    label: 'Companies',
    subtitle: 'Accounts',
    icon: 'business-outline',
    href: '/(app)/companies',
  },
  {
    key: 'notes',
    label: 'Notes',
    subtitle: 'Meeting notes and memos',
    icon: 'document-text-outline',
    href: '/(app)/objects/[plural]',
    params: { plural: 'notes' },
  },
  {
    key: 'more',
    label: 'Browse all',
    subtitle: 'Everything in one list',
    icon: 'grid-outline',
    href: TAB_MORE,
  },
];

export const DRAWER_INSIGHT_ITEMS: AppNavItem[] = [
  {
    key: 'dashboards',
    label: 'Dashboards',
    subtitle: 'KPIs and charts',
    icon: 'bar-chart-outline',
    href: '/(app)/dashboards',
  },
  {
    key: 'workflows',
    label: 'Workflows',
    subtitle: 'Automations and runs',
    icon: 'git-network-outline',
    href: '/(app)/workflows',
  },
];

export const DRAWER_WORKSPACE_ITEMS: AppNavItem[] = [
  {
    key: 'settings',
    label: 'Settings',
    subtitle: 'Profile, members, billing',
    icon: 'settings-outline',
    href: '/(app)/settings',
  },
];

export const MORE_ITEMS: AppNavItem[] = [
  ...DRAWER_CRM_ITEMS.filter((item) => item.key !== 'more'),
  ...DRAWER_INSIGHT_ITEMS,
  ...DRAWER_WORKSPACE_ITEMS,
];

export const openNavItem = (item: AppNavItem) => {
  if (item.href === '/(app)/objects/[plural]') {
    router.push({
      pathname: '/(app)/objects/[plural]',
      params: { plural: item.params?.plural ?? 'people' },
    });
    return;
  }

  router.push(item.href);
};

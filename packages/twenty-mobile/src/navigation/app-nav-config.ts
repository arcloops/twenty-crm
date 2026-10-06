import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type AppNavIconName = ComponentProps<typeof Ionicons>['name'];

export type AppNavItem = {
  key: string;
  label: string;
  subtitle?: string;
  icon: AppNavIconName;
  href:
    | '/(app)/(drawer)/(tabs)/home'
    | '/(app)/(drawer)/(tabs)/people'
    | '/(app)/(drawer)/(tabs)/companies'
    | '/(app)/(drawer)/(tabs)/opportunities'
    | '/(app)/(drawer)/(tabs)/search'
    | '/(app)/objects/[plural]'
    | '/(app)/dashboards'
    | '/(app)/workflows'
    | '/(app)/settings'
    | '/(app)/settings/accounts';
  params?: Record<string, string>;
  // Hide from drawer when already in bottom tabs
  bottomTab?: boolean;
};

export const BOTTOM_TAB_ITEMS = [
  {
    key: 'home',
    label: 'Home',
    icon: 'home-outline' as const,
    href: '/(app)/(drawer)/(tabs)/home' as const,
  },
  {
    key: 'people',
    label: 'People',
    icon: 'people-outline' as const,
    href: '/(app)/(drawer)/(tabs)/people' as const,
  },
  {
    key: 'companies',
    label: 'Companies',
    icon: 'business-outline' as const,
    href: '/(app)/(drawer)/(tabs)/companies' as const,
  },
  {
    key: 'opportunities',
    label: 'Pipeline',
    icon: 'trending-up-outline' as const,
    href: '/(app)/(drawer)/(tabs)/opportunities' as const,
  },
  {
    key: 'search',
    label: 'Search',
    icon: 'search-outline' as const,
    href: '/(app)/(drawer)/(tabs)/search' as const,
  },
] as const;

export const DRAWER_DAILY_ITEMS: AppNavItem[] = [
  {
    key: 'home',
    label: 'Home',
    subtitle: 'Overview and shortcuts',
    icon: 'home-outline',
    href: '/(app)/(drawer)/(tabs)/home',
    bottomTab: true,
  },
  {
    key: 'people',
    label: 'People',
    subtitle: 'Contacts',
    icon: 'people-outline',
    href: '/(app)/(drawer)/(tabs)/people',
    bottomTab: true,
  },
  {
    key: 'companies',
    label: 'Companies',
    subtitle: 'Accounts',
    icon: 'business-outline',
    href: '/(app)/(drawer)/(tabs)/companies',
    bottomTab: true,
  },
  {
    key: 'opportunities',
    label: 'Pipeline',
    subtitle: 'Deals and stages',
    icon: 'trending-up-outline',
    href: '/(app)/(drawer)/(tabs)/opportunities',
    bottomTab: true,
  },
  {
    key: 'search',
    label: 'Search',
    subtitle: 'Find any record',
    icon: 'search-outline',
    href: '/(app)/(drawer)/(tabs)/search',
    bottomTab: true,
  },
];

export const DRAWER_CRM_ITEMS: AppNavItem[] = [
  {
    key: 'tasks',
    label: 'Tasks',
    subtitle: 'To-dos and follow-ups',
    icon: 'checkbox-outline',
    href: '/(app)/objects/[plural]',
    params: { plural: 'tasks' },
  },
  {
    key: 'notes',
    label: 'Notes',
    subtitle: 'Meeting notes and memos',
    icon: 'document-text-outline',
    href: '/(app)/objects/[plural]',
    params: { plural: 'notes' },
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
  {
    key: 'accounts',
    label: 'Accounts',
    subtitle: 'Email and calendar',
    icon: 'mail-outline',
    href: '/(app)/settings/accounts',
  },
];

export const HOME_QUICK_ACTIONS: AppNavItem[] = [
  {
    key: 'people',
    label: 'People',
    subtitle: 'Contacts',
    icon: 'people-outline',
    href: '/(app)/(drawer)/(tabs)/people',
  },
  {
    key: 'companies',
    label: 'Companies',
    subtitle: 'Accounts',
    icon: 'business-outline',
    href: '/(app)/(drawer)/(tabs)/companies',
  },
  {
    key: 'opportunities',
    label: 'Pipeline',
    subtitle: 'Deals',
    icon: 'trending-up-outline',
    href: '/(app)/(drawer)/(tabs)/opportunities',
  },
  {
    key: 'tasks',
    label: 'Tasks',
    subtitle: 'To-dos',
    icon: 'checkbox-outline',
    href: '/(app)/objects/[plural]',
    params: { plural: 'tasks' },
  },
  {
    key: 'notes',
    label: 'Notes',
    subtitle: 'Memos',
    icon: 'document-text-outline',
    href: '/(app)/objects/[plural]',
    params: { plural: 'notes' },
  },
  {
    key: 'dashboards',
    label: 'Dashboards',
    subtitle: 'KPIs',
    icon: 'bar-chart-outline',
    href: '/(app)/dashboards',
  },
];

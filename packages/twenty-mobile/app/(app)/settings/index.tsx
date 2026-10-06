import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useNavigation } from 'expo-router';

import {
  hasApiKeysPermission,
  hasRolesPermission,
  hasWorkflowsPermission,
  hasWorkspaceMembersPermission,
  hasWorkspacePermission,
  useAuth,
} from '@/auth/auth-context';
import { useAuthProvidersConfig } from '@/auth/use-auth-providers-config';
import { useMobileT } from '@/i18n/use-mobile-t';
import { Button, ListRow, Screen, useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

export default function SettingsIndexScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const { isBillingEnabled } = useAuthProvidersConfig();
  const t = useMobileT();
  const canViewApiKeys = hasApiKeysPermission(user);
  const canViewRoles = hasRolesPermission(user);
  const canViewMembers = hasWorkspaceMembersPermission(user);
  const canViewWorkflows = hasWorkflowsPermission(user);
  const canViewBilling = isBillingEnabled && hasWorkspacePermission(user);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('Settings') });
  }, [navigation, t]);

  const memberName = [
    user?.workspaceMember?.name?.firstName,
    user?.workspaceMember?.name?.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>
          {memberName || user?.email || 'Account'}
        </Text>
        <Text style={{ color: theme.text.secondary }}>
          {user?.currentWorkspace?.displayName ?? 'Workspace'}
        </Text>
      </View>

      <ListRow
        title={t('Profile')}
        subtitle={t('Name and email')}
        onPress={() => router.push('/(app)/settings/profile')}
      />
      <ListRow
        title={t('Experience')}
        subtitle={t('Theme and language')}
        onPress={() => router.push('/(app)/settings/experience')}
      />
      <ListRow
        title={t('Accounts')}
        subtitle={t('Email and calendar providers')}
        onPress={() => router.push('/(app)/settings/accounts')}
      />
      {canViewMembers ? (
        <ListRow
          title={t('Members')}
          subtitle={
            user?.currentWorkspace?.workspaceMembersCount
              ? `${user.currentWorkspace.workspaceMembersCount} members`
              : t('Workspace members')
          }
          onPress={() => router.push('/(app)/settings/members')}
        />
      ) : null}
      {canViewRoles ? (
        <ListRow
          title={t('Roles')}
          subtitle={t('Permission overview')}
          onPress={() => router.push('/(app)/settings/roles')}
        />
      ) : null}
      {canViewApiKeys ? (
        <ListRow
          title={t('API keys')}
          subtitle={t('View keys · manage on web')}
          onPress={() => router.push('/(app)/settings/api-keys')}
        />
      ) : null}
      {canViewBilling ? (
        <ListRow
          title={t('Billing')}
          subtitle={
            user?.currentWorkspace?.currentBillingSubscription?.status ??
            t('Status on web')
          }
          onPress={() => router.push('/(app)/settings/billing')}
        />
      ) : null}
      <ListRow
        title={t('Dashboards')}
        subtitle={t('Read KPIs')}
        onPress={() => router.push('/(app)/dashboards')}
      />
      {canViewWorkflows ? (
        <ListRow
          title={t('Workflows')}
          subtitle={t('Runs and manual trigger')}
          onPress={() => router.push('/(app)/workflows')}
        />
      ) : null}

      <View style={styles.signOut}>
        <Button
          label={t('Sign out')}
          variant="danger"
          onPress={() => {
            void signOut().then(() => router.replace('/(auth)/login'));
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing(0.5),
    marginBottom: spacing(3),
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  signOut: {
    marginTop: spacing(6),
  },
});

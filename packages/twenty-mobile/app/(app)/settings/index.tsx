import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useNavigation } from 'expo-router';

import {
  hasApiKeysPermission,
  hasRolesPermission,
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

      <SectionLabel label={t('You')} />
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

      {(canViewMembers || canViewRoles || canViewBilling) && (
        <SectionLabel label={t('Workspace')} />
      )}
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

      {canViewApiKeys ? (
        <>
          <SectionLabel label={t('Advanced')} />
          <ListRow
            title={t('API keys')}
            subtitle={t('View keys · manage on web')}
            onPress={() => router.push('/(app)/settings/api-keys')}
          />
        </>
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

const SectionLabel = ({ label }: { label: string }) => {
  const theme = useTheme();

  return (
    <Text style={[styles.sectionLabel, { color: theme.text.tertiary }]}>
      {label}
    </Text>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: spacing(0.5),
    marginBottom: spacing(3),
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: spacing(1),
    marginTop: spacing(4),
    textTransform: 'uppercase',
  },
  signOut: {
    marginTop: spacing(6),
  },
});

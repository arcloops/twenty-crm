import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from 'expo-router';

import {
  hasWorkspaceMembersPermission,
  useAuth,
} from '@/auth/auth-context';
import { AUTH_ORIGIN } from '@/config/env';
import { Button, EmptyState, ListRow, Screen, useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

export default function MembersSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const canManageMembers = hasWorkspaceMembersPermission(user);
  const members = user?.workspaceMembers ?? [];
  const inviteHash = user?.currentWorkspace?.inviteHash;
  const inviteEnabled =
    user?.currentWorkspace?.isPublicInviteLinkEnabled !== false &&
    Boolean(inviteHash);

  const inviteUrl = useMemo(
    () => (inviteHash ? `${AUTH_ORIGIN}/invite/${inviteHash}` : null),
    [inviteHash],
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Members' });
  }, [navigation]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      await refreshUser();
    } catch (error) {
      setRefreshError(
        error instanceof Error ? error.message : 'Failed to refresh members',
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShareInvite = async () => {
    if (!inviteUrl) {
      Alert.alert('Unavailable', 'Invite link is not enabled for this workspace.');
      return;
    }

    try {
      await Share.share({
        message: inviteUrl,
        url: inviteUrl,
      });
    } catch {
      Alert.alert('Could not share invite link');
    }
  };

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            void handleRefresh();
          }}
        />
      }
    >
      <Text style={[styles.title, { color: theme.text.primary }]}>
        Workspace members
      </Text>
      <Text style={{ color: theme.text.secondary, marginBottom: spacing(3) }}>
        {user?.currentWorkspace?.displayName ?? 'Workspace'}
        {user?.currentWorkspace?.workspaceMembersCount
          ? ` · ${user.currentWorkspace.workspaceMembersCount}`
          : ''}
      </Text>

      {refreshError ? (
        <Text style={{ color: theme.danger, marginBottom: spacing(2) }}>
          {refreshError}
        </Text>
      ) : null}

      {inviteEnabled ? (
        <View style={styles.invite}>
          <Text style={{ color: theme.text.secondary, marginBottom: spacing(1) }}>
            Invite link
          </Text>
          <Text
            selectable
            style={{ color: theme.text.primary, marginBottom: spacing(2) }}
          >
            {inviteUrl}
          </Text>
          <Button
            label="Share invite link"
            variant="secondary"
            onPress={() => {
              void handleShareInvite();
            }}
          />
          {!canManageMembers ? (
            <Text
              style={{
                color: theme.text.tertiary,
                marginTop: spacing(1),
                fontSize: 12,
              }}
            >
              Viewing only — manage roles on web.
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={{ color: theme.text.tertiary, marginBottom: spacing(3) }}>
          Public invite link is disabled. Ask an admin on web.
        </Text>
      )}

      {members.length === 0 ? (
        <EmptyState
          title="No members in this workspace"
          description={
            refreshError
              ? 'Pull to refresh after the connection recovers.'
              : 'Invite teammates with the link above, or manage members on web.'
          }
        />
      ) : (
        members.map((member: {
          id: string;
          name?: { firstName?: string | null; lastName?: string | null } | null;
          userEmail?: string | null;
        }) => {
          const name = [
            member.name?.firstName,
            member.name?.lastName,
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <ListRow
              key={member.id}
              title={name || member.userEmail || 'Member'}
              subtitle={member.userEmail ?? undefined}
              showChevron={false}
            />
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  invite: {
    marginBottom: spacing(4),
  },
});

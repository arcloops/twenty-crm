import React, { useLayoutEffect } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';

import {
  openWebSettings,
  WEB_SETTINGS_PATH,
} from '@/admin/open-web-settings';
import { useApiKeys } from '@/admin/use-api-keys';
import {
  hasApiKeysPermission,
  useAuth,
} from '@/auth/auth-context';
import { Button, EmptyState, ListRow, Screen, Spinner, useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

const formatExpiry = (expiresAt?: string | null) => {
  if (!expiresAt) {
    return 'No expiry';
  }

  return `Expires ${expiresAt.slice(0, 10)}`;
};

export default function ApiKeysSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const canView = hasApiKeysPermission(user);
  const { apiKeys, isLoading, error, reload } = useApiKeys(canView);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'API keys' });
  }, [navigation]);

  if (!canView) {
    return (
      <Screen>
        <EmptyState
          title="No access"
          description="Your role needs the API_KEYS_AND_WEBHOOKS permission."
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => {
            void reload();
          }}
        />
      }
    >
      <Text style={[styles.title, { color: theme.text.primary }]}>
        API keys
      </Text>
      <Text style={{ color: theme.text.secondary, marginBottom: spacing(2) }}>
        View keys and roles. Create or revoke on web.
      </Text>

      <View style={styles.actions}>
        <Button
          label="Manage on web"
          variant="secondary"
          onPress={() => {
            void openWebSettings(WEB_SETTINGS_PATH.apiKeys);
          }}
        />
      </View>

      {error ? (
        <Text style={{ color: theme.danger, marginBottom: spacing(2) }}>
          {error}
        </Text>
      ) : null}
      {isLoading && apiKeys.length === 0 ? <Spinner /> : null}

      {apiKeys.length === 0 && !isLoading ? (
        <EmptyState
          title="No API keys"
          description="Create a key on web under Settings → APIs & Webhooks."
        />
      ) : (
        // Server apiKeys returns active keys only (revokedAt IS NULL)
        apiKeys.map((apiKey) => (
          <ListRow
            key={apiKey.id}
            title={apiKey.name || 'Untitled key'}
            subtitle={[
              apiKey.role?.label,
              formatExpiry(apiKey.expiresAt),
            ]
              .filter(Boolean)
              .join(' · ')}
            rightLabel="Active"
            showChevron={false}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  actions: {
    marginBottom: spacing(3),
  },
});

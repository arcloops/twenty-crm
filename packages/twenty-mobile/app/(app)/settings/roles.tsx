import React, { useLayoutEffect } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';

import {
  openWebSettings,
  WEB_SETTINGS_PATH,
} from '@/admin/open-web-settings';
import { useRoles } from '@/admin/use-roles';
import { hasRolesPermission, useAuth } from '@/auth/auth-context';
import { Button, EmptyState, ListRow, Screen, Spinner, useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

export default function RolesSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const canView = hasRolesPermission(user);
  const { roles, isLoading, error, reload } = useRoles(canView);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Roles' });
  }, [navigation]);

  if (!canView) {
    return (
      <Screen>
        <EmptyState
          title="No access"
          description="Your role needs the ROLES permission flag."
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
        Roles
      </Text>
      <Text style={{ color: theme.text.secondary, marginBottom: spacing(2) }}>
        Permission overview. Edit assignments on web.
      </Text>

      <View style={styles.actions}>
        <Button
          label="Manage on web"
          variant="secondary"
          onPress={() => {
            void openWebSettings(WEB_SETTINGS_PATH.roles);
          }}
        />
      </View>

      {error ? (
        <Text style={{ color: theme.danger, marginBottom: spacing(2) }}>
          {error}
        </Text>
      ) : null}
      {isLoading && roles.length === 0 ? <Spinner /> : null}

      {roles.length === 0 && !isLoading ? (
        <EmptyState
          title="No roles"
          description="Roles are managed on web under Settings → Members → Roles."
        />
      ) : (
        roles.map((role) => {
          const flagCount = role.permissionFlags?.length ?? 0;
          const flagsPreview =
            role.permissionFlags
              ?.slice(0, 3)
              .map((permissionFlag) => permissionFlag.flag)
              .join(', ') ?? '';

          return (
            <ListRow
              key={role.id}
              title={role.label}
              subtitle={
                [
                  role.description,
                  flagCount > 0
                    ? `${flagCount} flags${flagsPreview ? `: ${flagsPreview}` : ''}${flagCount > 3 ? '…' : ''}`
                    : 'No permission flags',
                  role.isEditable === false ? 'System' : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || undefined
              }
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
  actions: {
    marginBottom: spacing(3),
  },
});

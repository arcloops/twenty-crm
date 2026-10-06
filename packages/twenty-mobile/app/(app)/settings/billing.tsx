import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';

import {
  openWebSettings,
  WEB_SETTINGS_PATH,
} from '@/admin/open-web-settings';
import {
  hasWorkspacePermission,
  useAuth,
} from '@/auth/auth-context';
import { useAuthProvidersConfig } from '@/auth/use-auth-providers-config';
import { Button, EmptyState, ListRow, Screen, useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

export default function BillingSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isBillingEnabled } = useAuthProvidersConfig();
  const canView = isBillingEnabled && hasWorkspacePermission(user);
  const subscription = user?.currentWorkspace?.currentBillingSubscription;

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Billing' });
  }, [navigation]);

  if (!canView) {
    return (
      <Screen>
        <EmptyState
          title="No access"
          description={
            isBillingEnabled
              ? 'Your role needs the WORKSPACE permission to view billing.'
              : 'Billing is not enabled on this instance. Manage plans on web if available.'
          }
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: theme.text.primary }]}>
        Billing
      </Text>
      <Text style={{ color: theme.text.secondary, marginBottom: spacing(2) }}>
        Subscription status for this workspace. Plans and invoices stay on
        web.
      </Text>

      <View style={styles.actions}>
        <Button
          label="Manage billing on web"
          variant="secondary"
          onPress={() => {
            void openWebSettings(WEB_SETTINGS_PATH.billing);
          }}
        />
      </View>

      {!subscription ? (
        <EmptyState
          title="No subscription data"
          description="This workspace has no active billing subscription yet. Manage plans on web."
        />
      ) : (
        <>
          <ListRow
            title="Status"
            subtitle={subscription.status ?? 'Unknown'}
            showChevron={false}
          />
          <ListRow
            title="Interval"
            subtitle={subscription.interval ?? '—'}
            showChevron={false}
          />
          {subscription.currentPeriodEnd ? (
            <ListRow
              title="Current period ends"
              subtitle={subscription.currentPeriodEnd.slice(0, 10)}
              showChevron={false}
            />
          ) : null}
        </>
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

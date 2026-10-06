import React, { useLayoutEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';

import { useConnectedAccounts } from '@/accounts/use-connected-accounts';
import { BannerStrip } from '@/banners/banner-strip';
import { useReconnectAccountBanner } from '@/banners/use-reconnect-account-banner';
import {
  Button,
  EmptyState,
  ListRow,
  Screen,
  Spinner,
  useTheme,
} from '@/ui';
import { spacing } from '@/ui/theme';

export default function AccountsSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const {
    accounts,
    isLoading,
    isConnecting,
    error,
    reload,
    connectProvider,
    disconnectAccount,
  } = useConnectedAccounts();
  const reconnectBanner = useReconnectAccountBanner({
    accounts,
    isLoading,
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Accounts' });
  }, [navigation]);

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: theme.text.primary }]}>
        Email & calendar
      </Text>
      <Text style={{ color: theme.text.secondary, marginBottom: spacing(2) }}>
        Connect Microsoft or Google so record Emails and Calendar sections can
        sync.
      </Text>

      {reconnectBanner.shouldShow ? (
        <BannerStrip
          message="One or more accounts failed authentication. Reconnect Microsoft or Google below."
          onDismiss={reconnectBanner.dismiss}
        />
      ) : null}

      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button
          label="Connect Microsoft"
          loading={isConnecting}
          onPress={() => {
            void connectProvider('microsoft');
          }}
        />
        <Button
          label="Connect Google"
          variant="secondary"
          disabled={isConnecting}
          onPress={() => {
            void connectProvider('google');
          }}
        />
        <Button
          label="Refresh"
          variant="ghost"
          onPress={() => {
            void reload();
          }}
        />
      </View>

      {isLoading && accounts.length === 0 ? <Spinner /> : null}

      {accounts.map((account) => (
        <ListRow
          key={account.id}
          title={account.handle || account.name || 'Account'}
          subtitle={`${account.provider}${account.authFailedAt ? ' · reconnect needed' : ''}`}
          rightLabel="Remove"
          onPress={() => {
            Alert.alert(
              'Disconnect account?',
              account.handle || account.provider,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Disconnect',
                  style: 'destructive',
                  onPress: () => {
                    void disconnectAccount(account.id);
                  },
                },
              ],
            );
          }}
        />
      ))}

      {!isLoading && accounts.length === 0 ? (
        <EmptyState
          title="No accounts connected"
          description="Connect a provider to sync mail and calendar."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700' },
  actions: { gap: spacing(2), marginBottom: spacing(3) },
});

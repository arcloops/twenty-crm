import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { AuthProvider } from '@/auth/auth-context';
import { OAuthBrowserHost } from '@/auth/oauth-browser-host';
import { MobileI18nProvider } from '@/i18n/mobile-i18n-provider';
import { initSentry } from '@/monitoring/sentry';
import { useDeepLinks } from '@/navigation/use-deep-links';
import { ThemeProvider, useTheme } from '@/ui';

initSentry();

const DeepLinkListener = () => {
  useDeepLinks();
  return null;
};

const RootNavigator = () => {
  const theme = useTheme();

  return (
    <>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <AuthProvider>
        <MobileI18nProvider>
          <ThemeProvider>
            <OAuthBrowserHost>
              <DeepLinkListener />
              <RootNavigator />
            </OAuthBrowserHost>
          </ThemeProvider>
        </MobileI18nProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

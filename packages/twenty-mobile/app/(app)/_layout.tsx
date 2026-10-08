import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/auth/auth-context';
import { ObjectsMetadataProvider } from '@/metadata/objects-provider';
import { Spinner, useTheme } from '@/ui';

const AuthenticatedApp = () => {
  const theme = useTheme();

  return (
    <ObjectsMetadataProvider>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: theme.background.primary,
          },
          headerTitleStyle: {
            color: theme.text.primary,
            fontSize: 17,
            fontWeight: '700',
          },
          headerTintColor: theme.accent.primary,
          contentStyle: {
            backgroundColor: theme.background.primary,
          },
        }}
      >
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen
          name="search"
          options={{ title: 'Search', headerBackTitle: 'Back', presentation: 'modal' }}
        />
        <Stack.Screen
          name="companies"
          options={{ title: 'Companies', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="objects/[plural]"
          options={{ title: 'Records', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="object/[singular]/[id]"
          options={{ title: 'Record', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="object/[singular]/new"
          options={{ title: 'New record', presentation: 'modal' }}
        />
        <Stack.Screen
          name="people/scan-card"
          options={{ title: 'Scan business card', presentation: 'modal' }}
        />
        <Stack.Screen
          name="settings/index"
          options={{ title: 'Settings', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="settings/profile"
          options={{ title: 'Profile', headerBackTitle: 'Settings' }}
        />
        <Stack.Screen
          name="settings/experience"
          options={{ title: 'Experience', headerBackTitle: 'Settings' }}
        />
        <Stack.Screen
          name="settings/accounts"
          options={{ title: 'Accounts', headerBackTitle: 'Settings' }}
        />
        <Stack.Screen
          name="settings/members"
          options={{ title: 'Members', headerBackTitle: 'Settings' }}
        />
        <Stack.Screen
          name="settings/api-keys"
          options={{ title: 'API keys', headerBackTitle: 'Settings' }}
        />
        <Stack.Screen
          name="settings/roles"
          options={{ title: 'Roles', headerBackTitle: 'Settings' }}
        />
        <Stack.Screen
          name="settings/billing"
          options={{ title: 'Billing', headerBackTitle: 'Settings' }}
        />
        <Stack.Screen
          name="dashboards/index"
          options={{ title: 'Dashboards', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="dashboards/[id]"
          options={{ title: 'Dashboard', headerBackTitle: 'Dashboards' }}
        />
        <Stack.Screen
          name="workflows/index"
          options={{ title: 'Workflows', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="workflows/[id]"
          options={{ title: 'Workflow', headerBackTitle: 'Workflows' }}
        />
      </Stack>
    </ObjectsMetadataProvider>
  );
};

export default function AppLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <Spinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <AuthenticatedApp />;
}

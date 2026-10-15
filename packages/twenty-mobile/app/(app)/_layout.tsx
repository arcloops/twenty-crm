import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/auth/auth-context';
import { ObjectsMetadataProvider } from '@/metadata/objects-provider';
import { Spinner } from '@/ui';

const AuthenticatedApp = () => {
  return (
    <ObjectsMetadataProvider>
      <Stack>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
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
          options={{ title: 'Settings', headerBackTitle: 'Home' }}
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
          options={{ title: 'Dashboards', headerBackTitle: 'Settings' }}
        />
        <Stack.Screen
          name="dashboards/[id]"
          options={{ title: 'Dashboard', headerBackTitle: 'Dashboards' }}
        />
        <Stack.Screen
          name="workflows/index"
          options={{ title: 'Workflows', headerBackTitle: 'Settings' }}
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

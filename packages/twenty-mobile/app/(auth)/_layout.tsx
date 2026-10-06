import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/auth/auth-context';
import { Spinner } from '@/ui';

export default function AuthLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <Spinner fullScreen />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(drawer)/(tabs)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}

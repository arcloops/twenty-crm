import { Redirect } from 'expo-router';

import { useAuth } from '@/auth/auth-context';
import { Spinner } from '@/ui';

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <Spinner fullScreen />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(drawer)/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}

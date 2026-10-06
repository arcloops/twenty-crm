import { Stack } from 'expo-router';

import { Screen, EmptyState } from '@/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen>
        <EmptyState
          title="Screen not found"
          description="That route does not exist in the mobile app."
        />
      </Screen>
    </>
  );
}

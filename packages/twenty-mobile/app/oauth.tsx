import { Redirect } from 'expo-router';

// AuthSession completes on twenty://oauth / exp://…/--/oauth before this mounts.
// Keep a route so deep-link resolution does not 404 if the session already closed.
export default function OAuthRedirectScreen() {
  return <Redirect href="/(auth)/login" />;
}

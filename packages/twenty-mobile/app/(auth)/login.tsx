import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/auth/auth-context';
import { useAuthProvidersConfig } from '@/auth/use-auth-providers-config';
import { API_BASE_URL } from '@/config/env';
import { useMobileT } from '@/i18n/use-mobile-t';
import { Button, Screen, TextInput, useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

export default function LoginScreen() {
  const theme = useTheme();
  const t = useMobileT();
  const { signIn, signInWithMicrosoft, signInWithGoogle } = useAuth();
  const { providers } = useAuthProvidersConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialProvider, setSocialProvider] = useState<
    'microsoft' | 'google' | null
  >(null);

  const finishSignIn = async (action: () => Promise<void>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await action();
      router.replace('/(app)/(drawer)/(tabs)/home');
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : 'Unable to sign in',
      );
    } finally {
      setIsSubmitting(false);
      setSocialProvider(null);
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    await finishSignIn(() => signIn(email, password));
  };

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={[styles.brand, { color: theme.text.primary }]}>
          Arcloops CRM
        </Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
          {t('Sign in with Microsoft, Google, or your workspace email')}
        </Text>
        <Text style={[styles.meta, { color: theme.text.tertiary }]}>
          {API_BASE_URL}
        </Text>
      </View>

      {providers.microsoft ? (
        <Button
          label={t('Continue with Microsoft')}
          variant="secondary"
          loading={isSubmitting && socialProvider === 'microsoft'}
          disabled={isSubmitting}
          onPress={() => {
            setSocialProvider('microsoft');
            void finishSignIn(signInWithMicrosoft);
          }}
        />
      ) : null}
      {providers.google ? (
        <Button
          label={t('Continue with Google')}
          variant="secondary"
          loading={isSubmitting && socialProvider === 'google'}
          disabled={isSubmitting}
          onPress={() => {
            setSocialProvider('google');
            void finishSignIn(signInWithGoogle);
          }}
        />
      ) : null}

      {providers.password ? (
        <>
          {(providers.microsoft || providers.google) && (
            <Text style={[styles.divider, { color: theme.text.tertiary }]}>
              or email
            </Text>
          )}

          <TextInput
            label="Email"
            testID="login-email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            label="Password"
            testID="login-password"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}

          <Button
            label="Sign in"
            testID="login-submit"
            loading={isSubmitting && socialProvider === null}
            disabled={isSubmitting}
            onPress={() => {
              void handleSubmit();
            }}
          />
        </>
      ) : (
        error ? <Text style={{ color: theme.danger }}>{error}</Text> : null
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing(2),
    marginBottom: spacing(4),
    marginTop: spacing(8),
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  meta: {
    fontSize: 12,
  },
  divider: {
    fontSize: 13,
    fontWeight: '600',
    marginVertical: spacing(1),
    textAlign: 'center',
  },
});

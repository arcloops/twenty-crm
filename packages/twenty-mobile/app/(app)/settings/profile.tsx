import React, { useLayoutEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';

import { useAuth } from '@/auth/auth-context';
import { useWorkspaceMemberSettings } from '@/settings/use-workspace-member-settings';
import { Button, Screen, TextInput, useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

export default function ProfileSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isSaving, error, updateSettings } = useWorkspaceMemberSettings();

  const [firstName, setFirstName] = useState(
    user?.workspaceMember?.name?.firstName ?? '',
  );
  const [lastName, setLastName] = useState(
    user?.workspaceMember?.name?.lastName ?? '',
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Profile' });
  }, [navigation]);

  const handleSave = async () => {
    try {
      await updateSettings({
        name: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
      });
      Alert.alert('Saved', 'Profile updated.');
    } catch {
      // error state already set
    }
  };

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: theme.text.primary }]}>
        Your profile
      </Text>
      <Text style={{ color: theme.text.secondary, marginBottom: spacing(3) }}>
        {user?.email}
      </Text>

      <View style={styles.form}>
        <TextInput
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />
        <TextInput
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />
      </View>

      {error ? (
        <Text style={{ color: theme.danger, marginTop: spacing(2) }}>
          {error}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button label="Save" loading={isSaving} onPress={() => void handleSave()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  form: {
    gap: spacing(2),
  },
  actions: {
    marginTop: spacing(4),
  },
});

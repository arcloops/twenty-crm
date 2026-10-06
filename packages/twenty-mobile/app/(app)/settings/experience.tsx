import React, { useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';

import { useAuth } from '@/auth/auth-context';
import {
  MOBILE_LOCALES,
  type ColorSchemePreference,
} from '@/settings/queries';
import { useWorkspaceMemberSettings } from '@/settings/use-workspace-member-settings';
import { Screen, Spinner, useTheme } from '@/ui';
import { radius, spacing } from '@/ui/theme';

const COLOR_SCHEMES: ColorSchemePreference[] = ['System', 'Light', 'Dark'];

export default function ExperienceSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user, setOptimisticWorkspaceMember, refreshUser } = useAuth();
  const { isSaving, error, updateSettings } = useWorkspaceMemberSettings();
  const [localError, setLocalError] = useState<string | null>(null);

  const currentScheme =
    (user?.workspaceMember?.colorScheme as ColorSchemePreference | undefined) ??
    'System';
  const currentLocale = user?.workspaceMember?.locale ?? 'en';

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Experience' });
  }, [navigation]);

  const handleScheme = (colorScheme: ColorSchemePreference) => {
    const previous = currentScheme;
    setLocalError(null);
    setOptimisticWorkspaceMember({ colorScheme });
    void updateSettings({ colorScheme }).catch(async () => {
      setOptimisticWorkspaceMember({ colorScheme: previous });
      setLocalError('Could not update theme');
      try {
        await refreshUser();
      } catch {
        // keep local revert
      }
    });
  };

  const handleLocale = (locale: string) => {
    const previous = currentLocale;
    setLocalError(null);
    setOptimisticWorkspaceMember({ locale });
    void updateSettings({ locale }).catch(async () => {
      setOptimisticWorkspaceMember({ locale: previous });
      setLocalError('Could not update language');
      try {
        await refreshUser();
      } catch {
        // keep local revert
      }
    });
  };

  return (
    <Screen scroll>
      <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
        Theme
      </Text>
      <View style={styles.chipRow}>
        {COLOR_SCHEMES.map((scheme) => {
          const selected = scheme === currentScheme;
          return (
            <Pressable
              key={scheme}
              onPress={() => handleScheme(scheme)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected
                    ? theme.accent.soft
                    : theme.background.secondary,
                  borderColor: selected
                    ? theme.accent.primary
                    : theme.border.primary,
                },
              ]}
            >
              <Text
                style={{
                  color: selected ? theme.accent.primary : theme.text.primary,
                  fontWeight: selected ? '700' : '500',
                }}
              >
                {scheme}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text
        style={[
          styles.sectionTitle,
          { color: theme.text.primary, marginTop: spacing(4) },
        ]}
      >
        Language
      </Text>
      <View style={styles.chipRow}>
        {MOBILE_LOCALES.map((locale) => {
          const selected = locale.code === currentLocale;
          return (
            <Pressable
              key={locale.code}
              onPress={() => handleLocale(locale.code)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected
                    ? theme.accent.soft
                    : theme.background.secondary,
                  borderColor: selected
                    ? theme.accent.primary
                    : theme.border.primary,
                },
              ]}
            >
              <Text
                style={{
                  color: selected ? theme.accent.primary : theme.text.primary,
                  fontWeight: selected ? '700' : '500',
                }}
              >
                {locale.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isSaving ? <Spinner /> : null}
      {error || localError ? (
        <Text style={{ color: theme.danger, marginTop: spacing(2) }}>
          {localError ?? error}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing(2),
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(1.5),
  },
  chip: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.5),
  },
});

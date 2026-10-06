import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from 'react-native';

import { useTheme } from '@/ui/theme-provider';
import { radius, spacing } from '@/ui/theme';

type TextInputProps = RNTextInputProps & {
  label?: string;
  error?: string;
};

export const TextInput = ({
  label,
  error,
  style,
  ...props
}: TextInputProps) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: theme.text.secondary }]}>
          {label}
        </Text>
      ) : null}
      <RNTextInput
        placeholderTextColor={theme.text.tertiary}
        style={[
          styles.input,
          {
            backgroundColor: theme.background.secondary,
            borderColor: error ? theme.danger : theme.border.primary,
            color: theme.text.primary,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing(1),
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
  },
  error: {
    fontSize: 12,
  },
});

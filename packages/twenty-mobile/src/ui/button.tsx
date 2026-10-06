import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { useTheme } from '@/ui/theme-provider';
import { radius, spacing } from '@/ui/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
};

export const Button = ({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) => {
  const theme = useTheme();
  const isDisabled = disabled === true || loading === true;

  const backgroundColor =
    variant === 'primary'
      ? theme.accent.primary
      : variant === 'danger'
        ? theme.danger
        : variant === 'secondary'
          ? theme.background.tertiary
          : 'transparent';

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? theme.text.inverted
      : theme.text.primary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        {
          backgroundColor,
          opacity: isDisabled ? 0.5 : state.pressed ? 0.85 : 1,
          borderColor:
            variant === 'ghost' ? theme.border.primary : 'transparent',
          borderWidth: variant === 'ghost' ? 1 : 0,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});

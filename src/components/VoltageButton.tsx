import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { Spacing } from '@/constants/layout';
import { VoltageText } from './VoltageText';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface VoltageButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  compact?: boolean;
  loading?: boolean;
}

export function VoltageButton({
  label,
  variant = 'primary',
  fullWidth = false,
  compact = false,
  loading = false,
  style,
  ...props
}: VoltageButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        compact && styles.compact,
        (props.disabled || loading) && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={props.disabled || loading}
      {...props}
    >
      <VoltageText
        variant="label"
        style={[styles.label, styles[`${variant}Label` as keyof typeof styles] as TextStyle]}
      >
        {loading ? 'COMMITTING...' : label}
      </VoltageText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  compact: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    letterSpacing: 2,
  },
  // Variants
  primary: {
    backgroundColor: Colors.heat,
  },
  primaryLabel: {
    color: Colors.textInverse,
  },
  secondary: {
    backgroundColor: Colors.surfaceElevated,
  },
  secondaryLabel: {
    color: Colors.textPrimary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.textMuted,
  },
  ghostLabel: {
    color: Colors.textSecondary,
  },
  danger: {
    backgroundColor: Colors.errorMuted,
  },
  dangerLabel: {
    color: Colors.error,
  },
  disabled: {
    opacity: 0.5,
  },
});

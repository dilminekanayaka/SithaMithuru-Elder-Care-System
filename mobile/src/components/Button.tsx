/**
 * Button.tsx — SithaMithuru Design System
 *
 * One button component with semantic variants, replacing the dozens of
 * bespoke TouchableOpacity+StyleSheet button definitions across the app.
 *
 * Variants:
 *  • primary   — the screen's main action (filled blue)
 *  • secondary — supporting action (outlined)
 *  • danger    — destructive action (delete, disconnect, resolve emergency)
 *  • ghost     — low-emphasis inline action
 *
 * Sizes: `md` (default, 48dp) and `lg` (56dp — the Elder-mode default and
 * the minimum for any primary Elder action).
 *
 * Always renders a real disabled state and a loading state, so no caller
 * needs to hand-roll "is this button busy?" UI.
 */

import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius, elevation } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** MaterialCommunityIcons name rendered before the label. */
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  /** Explains *why* the button is disabled — surfaced to screen readers. */
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
}) => {
  const isInactive = disabled || loading;
  const height = size === 'lg' ? 56 : 48;

  const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary:   { bg: colors.primary,   fg: colors.onPrimary },
    secondary: { bg: colors.surface,   fg: colors.primary, border: colors.primary },
    danger:    { bg: colors.error,     fg: colors.onError },
    ghost:     { bg: 'transparent',    fg: colors.primary },
  };
  const p = palette[variant];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { height, backgroundColor: p.bg },
        p.border ? { borderWidth: 1.5, borderColor: p.border } : null,
        variant === 'primary' || variant === 'danger' ? elevation.e2 : null,
        fullWidth ? styles.fullWidth : styles.autoWidth,
        isInactive && styles.inactive,
        style,
      ]}
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={p.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <MaterialCommunityIcons
              name={icon as any}
              size={size === 'lg' ? 22 : 20}
              color={p.fg}
              style={styles.icon}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              { color: p.fg, fontSize: size === 'lg' ? 18 : 16 },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.s5,
  },
  fullWidth: {
    width: '100%',
  },
  autoWidth: {
    alignSelf: 'flex-start',
  },
  inactive: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing.s2,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default Button;

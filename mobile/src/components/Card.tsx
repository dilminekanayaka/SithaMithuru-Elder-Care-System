/**
 * Card.tsx — SithaMithuru Design System
 *
 * The standard surface container. Replaces the ad-hoc
 * `{ backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, ... }` blocks
 * repeated across nearly every screen with slightly different radii and
 * shadow depths.
 *
 * Pass `onPress` to make it an interactive card — it then renders with a real
 * press state and button accessibility role, rather than a View wrapped in a
 * bare Touchable by each caller.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radius, elevation } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** `flat` drops the shadow — use inside already-elevated surfaces. */
  variant?: 'default' | 'flat';
  /** Left accent stripe, for status-bearing cards (e.g. missed dose). */
  accentColor?: string;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  accentColor,
  padded = true,
  style,
  accessibilityLabel,
}) => {
  const content = (
    <>
      {accentColor ? (
        <View style={[styles.accent, { backgroundColor: accentColor }]} pointerEvents="none" />
      ) : null}
      {children}
    </>
  );

  const composed = [
    styles.base,
    padded && styles.padded,
    variant === 'default' && elevation.e1,
    accentColor ? styles.withAccent : null,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={composed}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={composed} accessibilityLabel={accessibilityLabel}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.s4,
  },
  withAccent: {
    paddingLeft: spacing.s4 + 4,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
});

export default Card;

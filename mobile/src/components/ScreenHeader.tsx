/**
 * ScreenHeader.tsx — SithaMithuru Design System
 *
 * The single shared screen header: back button + title (+ optional subtitle
 * and trailing action). Replaces the near-identical header markup that was
 * hand-rolled in ~147 screens, each with slightly different heights, paddings
 * and icon colors.
 *
 * `variant="elder"` uses larger type and a bigger touch target, per the
 * Elder-mode accessibility rules (readability over density).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, elevation } from '../theme';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Optional trailing action (e.g. overflow menu, add button). */
  rightIcon?: string;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
  /** Elder screens get larger text + touch targets. */
  variant?: 'default' | 'elder';
  style?: StyleProp<ViewStyle>;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  rightAccessibilityLabel,
  variant = 'default',
  style,
}) => {
  const isElder = variant === 'elder';
  const touchSize = isElder ? 52 : 44;
  const iconSize = isElder ? 28 : 24;

  return (
    <View style={[styles.container, isElder && styles.containerElder, style]}>
      {onBack ? (
        <TouchableOpacity
          style={[styles.iconSlot, { width: touchSize, height: touchSize }]}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={iconSize} color={colors.text.primary} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: touchSize }} />
      )}

      <View style={styles.titleBlock}>
        <Text
          style={[styles.title, isElder && styles.titleElder]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightIcon && onRightPress ? (
        <TouchableOpacity
          style={[styles.iconSlot, { width: touchSize, height: touchSize }]}
          onPress={onRightPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={rightAccessibilityLabel || 'More options'}
        >
          <MaterialCommunityIcons name={rightIcon as any} size={iconSize} color={colors.text.primary} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: touchSize }} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    ...elevation.e1,
  },
  containerElder: {
    minHeight: 64,
  },
  iconSlot: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.s2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
  },
  titleElder: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default ScreenHeader;

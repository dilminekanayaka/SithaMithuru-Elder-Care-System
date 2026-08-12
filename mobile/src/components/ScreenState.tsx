/**
 * ScreenState.tsx — SithaMithuru Design System
 *
 * The three non-success screen states, standardized so every data-driven
 * screen handles them identically:
 *
 *  • <LoadingState />  — never a blank/frozen screen
 *  • <EmptyState />    — real guidance + a next action, never a fake record
 *  • <ErrorState />    — friendly human message + Retry, never a raw
 *                        exception, stack trace, or HTTP status code
 *
 * ErrorState deliberately accepts a *message we wrote*, not an Error object,
 * so a caller can't accidentally leak "AxiosError 500" to an elderly user.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius } from '../theme';
import Button from './Button';

// ─── Loading ────────────────────────────────────────────────────────────────

export interface LoadingStateProps {
  message?: string;
  style?: StyleProp<ViewStyle>;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading…',
  style,
}) => (
  <View style={[styles.wrap, style]} accessible accessibilityLabel={message}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// ─── Empty ──────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  /** MaterialCommunityIcons name. */
  icon?: string;
  title: string;
  /** What the user can do next — keep it plain and actionable. */
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => (
  <View style={[styles.wrap, style]} accessible accessibilityLabel={`${title}. ${description || ''}`}>
    <View style={[styles.iconCircle, { backgroundColor: colors.surfaceVariant }]}>
      <MaterialCommunityIcons name={icon as any} size={44} color={colors.text.tertiary} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
    {actionLabel && onAction ? (
      <Button
        label={actionLabel}
        onPress={onAction}
        variant="primary"
        size="lg"
        fullWidth={false}
        style={styles.action}
      />
    ) : null}
  </View>
);

// ─── Error ──────────────────────────────────────────────────────────────────

export interface ErrorStateProps {
  /** Human-readable, e.g. "Unable to load medications". Never a raw error. */
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'Please check your connection and try again.',
  onRetry,
  retryLabel = 'Try Again',
  style,
}) => (
  <View style={[styles.wrap, style]} accessible accessibilityLabel={`${title}. ${description}`}>
    <View style={[styles.iconCircle, { backgroundColor: colors.errorContainer }]}>
      <MaterialCommunityIcons name="alert-circle-outline" size={44} color={colors.error} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    {onRetry ? (
      <Button
        label={retryLabel}
        onPress={onRetry}
        variant="primary"
        size="lg"
        icon="refresh"
        fullWidth={false}
        style={styles.action}
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s10,
    paddingHorizontal: spacing.s6,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.s2,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: spacing.s3,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  action: {
    marginTop: spacing.s5,
    paddingHorizontal: spacing.s6,
  },
});

export default { LoadingState, EmptyState, ErrorState };

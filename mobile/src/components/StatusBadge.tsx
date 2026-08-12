/**
 * StatusBadge.tsx — SithaMithuru Design System
 *
 * Standard status pill for medication/task/emergency/sync state.
 *
 * ACCESSIBILITY RULE: status is never communicated by color alone — every
 * badge pairs its color with a distinct icon *and* a text label, so the
 * meaning survives colorblindness and greyscale. This is a hard requirement
 * for medication and emergency states.
 */

import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius } from '../theme';

export type StatusKind =
  | 'taken'
  | 'completed'
  | 'upcoming'
  | 'pending'
  | 'missed'
  | 'emergency'
  | 'rescheduled'
  | 'resolved'
  | 'offline'
  | 'syncing'
  | 'synced';

interface StatusConfig {
  bg: string;
  fg: string;
  border: string;
  icon: string;
  defaultLabel: string;
}

const CONFIG: Record<StatusKind, StatusConfig> = {
  taken:       { ...colors.status.taken,       fg: colors.status.taken.text,       icon: 'check-circle',          defaultLabel: 'Taken' },
  completed:   { ...colors.status.completed,   fg: colors.status.completed.text,   icon: 'check-circle',          defaultLabel: 'Completed' },
  upcoming:    { ...colors.status.upcoming,    fg: colors.status.upcoming.text,    icon: 'clock-outline',         defaultLabel: 'Upcoming' },
  pending:     { ...colors.status.pending,     fg: colors.status.pending.text,     icon: 'clock-outline',         defaultLabel: 'Pending' },
  missed:      { ...colors.status.missed,      fg: colors.status.missed.text,      icon: 'alert-circle',          defaultLabel: 'Missed' },
  emergency:   { ...colors.status.missed,      fg: colors.status.missed.text,      icon: 'alert-decagram',        defaultLabel: 'Emergency' },
  rescheduled: { ...colors.status.rescheduled, fg: colors.status.rescheduled.text, icon: 'calendar-refresh',      defaultLabel: 'Rescheduled' },
  resolved:    { ...colors.status.resolved,    fg: colors.status.resolved.text,    icon: 'check-all',             defaultLabel: 'Resolved' },
  offline:     { ...colors.status.resolved,    fg: colors.status.resolved.text,    icon: 'wifi-off',              defaultLabel: 'Offline' },
  syncing:     { ...colors.status.rescheduled, fg: colors.status.rescheduled.text, icon: 'sync',                  defaultLabel: 'Syncing' },
  synced:      { ...colors.status.taken,       fg: colors.status.taken.text,       icon: 'cloud-check-outline',   defaultLabel: 'Synced' },
};

export interface StatusBadgeProps {
  status: StatusKind;
  /** Overrides the default label (e.g. "Taken 8:05 AM"). */
  label?: string;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  style,
}) => {
  const cfg = CONFIG[status];
  const text = label || cfg.defaultLabel;
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          paddingVertical: isSm ? 3 : 5,
          paddingHorizontal: isSm ? spacing.s2 : spacing.s3,
        },
        style,
      ]}
      accessible
      accessibilityLabel={`Status: ${text}`}
    >
      <MaterialCommunityIcons
        name={cfg.icon as any}
        size={isSm ? 13 : 15}
        color={cfg.fg}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: cfg.fg, fontSize: isSm ? 11 : 13 }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '800',
  },
});

export default StatusBadge;

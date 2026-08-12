/**
 * SyncStatusBanner.tsx — Visual Offline & Sync Status Indicator Component
 *
 * Renders a dynamic, accessible banner showing real-time connectivity and sync queue status:
 *  • Offline state: Amber/Gray notice with offline queue item count
 *  • Syncing state: Animated spinner + "Synchronizing clinical records..."
 *  • Synced state: Green checkmark + "Everything up to date"
 *  • Failed state: Red warning + "Sync failed — will retry automatically"
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSync, SyncState } from '../context/SyncContext';
import { colors } from '../theme';

interface SyncStatusBannerProps {
  onSyncPress?: () => void;
}

const SyncStatusBanner: React.FC<SyncStatusBannerProps> = ({ onSyncPress }) => {
  const { syncState, pendingCount, lastSyncedAt, syncNow } = useSync();

  if (syncState === 'synced' && pendingCount === 0) {
    return null; // Silent when fully synced
  }

  const getConfig = () => {
    switch (syncState) {
      case 'offline':
        return {
          bg: colors.warningContainer,
          border: colors.status.upcoming.border,
          textColor: colors.warningDark,
          icon: 'wifi-off',
          iconColor: colors.warning,
          text: `Offline Mode • ${pendingCount > 0 ? `${pendingCount} changes saved locally` : 'Local storage active'}`,
        };
      case 'syncing':
        return {
          bg: colors.infoContainer,
          border: colors.status.rescheduled.border,
          textColor: colors.infoDark,
          icon: 'sync',
          iconColor: colors.info,
          text: 'Synchronizing clinical records with cloud...',
          loading: true,
        };
      case 'failed':
        return {
          bg: colors.errorContainer,
          border: colors.status.missed.border,
          textColor: colors.errorDark,
          icon: 'alert-circle-outline',
          iconColor: colors.error,
          text: `Sync paused (${pendingCount} queued) — tap to retry`,
        };
      default:
        if (pendingCount > 0) {
          return {
            bg: colors.category.journal.bg,
            border: colors.category.journal.accent,
            textColor: colors.category.journal.accent,
            icon: 'cloud-upload-outline',
            iconColor: colors.category.journal.accent,
            text: `${pendingCount} offline update${pendingCount > 1 ? 's' : ''} ready to sync`,
          };
        }
        return null;
    }
  };

  const config = getConfig();
  if (!config) return null;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}
      onPress={() => {
        if (onSyncPress) onSyncPress();
        else syncNow();
      }}
      activeOpacity={0.85}
      accessible={true}
      accessibilityLabel={config.text}
    >
      {config.loading ? (
        <ActivityIndicator size="small" color={config.iconColor} style={{ marginRight: 8 }} />
      ) : (
        <MaterialCommunityIcons name={config.icon as any} size={18} color={config.iconColor} style={{ marginRight: 8 }} />
      )}
      <Text style={[styles.text, { color: config.textColor }]}>{config.text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
});

export default SyncStatusBanner;

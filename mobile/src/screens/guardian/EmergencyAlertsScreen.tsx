/**
 * EmergencyAlertsScreen.tsx — G-03
 *
 * Production Guardian Emergency Alerts List.
 * Fully wired to GET /api/v1/guardian/emergency-alerts
 *
 * Priorities:
 *  • Active SOS alerts rendered at the top in pulsing high-contrast red cards
 *  • Filter tabs: All, Active, Resolved
 *  • Instant navigation to EmergencyDetailsScreen on tap
 *  • Pull to refresh & clear empty states
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';
import ScreenHeader from '../../components/ScreenHeader';

export interface EmergencyAlertItem {
  id: string;
  elder_id: string;
  elder_name: string;
  elder_phone?: string;
  device_location?: string;
  triggered_phrase?: string;
  latitude?: number;
  longitude?: number;
  maps_url?: string;
  status: 'Pending' | 'Active' | 'Resolved' | 'False Alarm';
  resolution_reason?: string;
  resolution_notes?: string;
  cancelled_by_role?: string;
  resolved_by_name?: string;
  created_at: string;
  resolved_at?: string;
}

interface EmergencyAlertsProps {
  token: string;
  onBack: () => void;
  onSelectAlert?: (alert: EmergencyAlertItem) => void;
  onSessionExpired?: () => void;
}

// Pulse animation for active SOS
const PulseView = ({ children, active }: { children: React.ReactNode; active: boolean }) => {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.02, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [active]);

  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
};

const formatTimestamp = (iso: string) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) {
      return `Today at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return iso;
  }
};

const SkeletonItem = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceVariant }} />
        <View style={{ gap: 6 }}>
          <View style={{ width: 140, height: 16, borderRadius: 4, backgroundColor: colors.surfaceVariant }} />
          <View style={{ width: 100, height: 12, borderRadius: 4, backgroundColor: colors.surfaceVariant }} />
        </View>
      </View>
      <View style={{ width: 64, height: 24, borderRadius: 12, backgroundColor: colors.surfaceVariant }} />
    </View>
  </View>
);

const EmergencyAlertsScreen: React.FC<EmergencyAlertsProps> = ({
  token,
  onBack,
  onSelectAlert,
  onSessionExpired,
}) => {
  const [alerts, setAlerts] = useState<EmergencyAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await apiFetch('/guardian/emergency-alerts', token);
      if (Array.isArray(res)) {
        setAlerts(res);
      } else if (res && Array.isArray(res.data)) {
        setAlerts(res.data);
      } else {
        setAlerts([]);
      }
    } catch (e: any) {
      if (e instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setError(e.message || 'Failed to load emergency alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, onSessionExpired]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const filteredAlerts = alerts.filter((item) => {
    const isActive = item.status === 'Active' || item.status === 'Pending';
    if (activeFilter === 'active') return isActive;
    if (activeFilter === 'resolved') return !isActive;
    return true;
  });

  const activeCount = alerts.filter((a) => a.status === 'Active' || a.status === 'Pending').length;
  const resolvedCount = alerts.length - activeCount;

  const renderItem = ({ item }: { item: EmergencyAlertItem }) => {
    const isActive = item.status === 'Active' || item.status === 'Pending';
    const isFalseAlarm = item.status === 'False Alarm';

    return (
      <PulseView active={isActive}>
        <TouchableOpacity
          style={[styles.card, isActive && styles.activeCard]}
          onPress={() => onSelectAlert && onSelectAlert(item)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Emergency alert for ${item.elder_name}, status ${item.status}`}
        >
          <View style={styles.cardHeader}>
            <View style={styles.elderRow}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: isActive ? colors.errorContainer : isFalseAlarm ? colors.warningContainer : colors.primaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name={isActive ? 'alert-decagram' : isFalseAlarm ? 'alert-remove-outline' : 'shield-check'}
                  size={26}
                  color={isActive ? colors.error : isFalseAlarm ? colors.warning : colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.elderName}>{item.elder_name || 'Elder'}</Text>
                <Text style={styles.triggerReason} numberOfLines={1}>
                  {item.triggered_phrase || 'Emergency SOS Triggered'}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.statusChip,
                isActive ? styles.chipActive : isFalseAlarm ? styles.chipFalseAlarm : styles.chipResolved,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isActive
                      ? colors.error
                      : isFalseAlarm
                      ? colors.warning
                      : colors.primary,
                  },
                ]}
              >
                {isActive ? 'ACTIVE SOS' : item.status}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.metaText}>{formatTimestamp(item.created_at)}</Text>
            </View>
            {(item.device_location || item.latitude) ? (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.text.tertiary} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.device_location || `${item.latitude}, ${item.longitude}`}
                </Text>
              </View>
            ) : null}
          </View>

          {item.resolution_reason ? (
            <View style={styles.resolutionNoteRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.resolutionNoteText}>
                Resolved: {item.resolution_reason}
                {item.resolved_by_name ? ` by ${item.resolved_by_name}` : ''}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </PulseView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <ScreenHeader title="Emergency Alerts" onBack={onBack} />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: `All (${alerts.length})` },
          { key: 'active', label: `Active (${activeCount})` },
          { key: 'resolved', label: `Resolved (${resolvedCount})` },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key as any)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${tab.label}`}
          >
            <Text style={[styles.filterTabText, activeFilter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.listContent}>
          <SkeletonItem />
          <SkeletonItem />
          <SkeletonItem />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="cloud-off-outline" size={56} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>Failed to load emergency alerts</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchAlerts()} accessibilityRole="button">
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredAlerts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAlerts(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="shield-check" size={64} color={colors.primary} />
              <Text style={styles.emptyTitle}>No Emergency Alerts</Text>
              <Text style={styles.emptySub}>
                {activeFilter === 'active'
                  ? 'There are no active SOS emergencies right now.'
                  : 'No emergency history recorded.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s4,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.outlineVariant,
  },
  backBtn: {
    padding: spacing.s1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    gap: spacing.s2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.outlineVariant,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  filterTabActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.s5,
    gap: spacing.s3,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.s5,
    ...elevation.e2,
  },
  activeCard: {
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.errorContainer,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.s3,
  },
  elderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elderName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  triggerReason: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusChip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  chipActive: {
    backgroundColor: colors.errorContainer,
  },
  chipResolved: {
    backgroundColor: colors.primaryContainer,
  },
  chipFalseAlarm: {
    backgroundColor: colors.warningContainer,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: spacing.s4,
    borderTopWidth: 1,
    borderColor: colors.outlineVariant,
    paddingTop: spacing.s3,
    flexWrap: 'wrap',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s1,
  },
  metaText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  resolutionNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.s2,
    paddingTop: spacing.s2,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  resolutionNoteText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.s5,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s16,
    gap: spacing.s2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.s3,
  },
  errorSub: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.s4,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default EmergencyAlertsScreen;

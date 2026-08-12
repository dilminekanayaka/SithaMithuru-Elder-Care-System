/**
 * EmergencyHistoryScreen.tsx — Screen ELDER-S27 (Emergency History Screen)
 * Spec: es27.txt
 *
 * Requirements (es27.txt):
 *  1. Read-Only Mandate: Immutable audit log of emergency events (No editing or deleting past records).
 *  2. Header: Back arrow (←), Title "Emergency History".
 *  3. Subtitle: "Your recent safety events".
 *  4. Chronological Date Grouping (TODAY, 02 AUGUST, 20 JULY, etc.):
 *     - Cancelled Event: ✓ Emergency Detection | 10 August • 10:32 AM | Cancelled (Amber badge)
 *     - Real Triggered Event: 🚨 Emergency Alert | 02 August • 7:45 PM | Guardian notified (Green badge)
 *     - Offline Pending Event: 🚨 Emergency Alert | 10 August • 10:32 AM | Waiting for connection (Gray badge)
 *  5. Empty State: 🛡️ "No emergency events. Your safety history will appear here when an event occurs."
 *  6. 100% Offline-First
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

export interface EmergencyEventRecord {
  id: string;
  type: 'CANCELLED' | 'TRIGGERED' | 'PENDING';
  title: string;
  dateStr: string;
  timeStr: string;
  statusText: string;
  group: 'TODAY' | 'EARLIER';
  createdAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

interface EmergencyHistoryProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  elderId?: string | number;
  token?: string;
  onViewEvent?: (event: EmergencyEventRecord) => void;
}

const EmergencyHistoryScreen: React.FC<EmergencyHistoryProps> = ({
  onBack,
  onNavigate = () => {},
  elderId,
  token,
  onViewEvent,
}) => {
  const [events, setEvents] = useState<EmergencyEventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Load live emergency history from SQLite DB & API
  const loadEmergencyHistory = React.useCallback(async () => {
    setLoading(true);
    try {
      const { getDB } = require('../../database/db');
      const { apiFetch } = require('../../services/api');
      const db = await getDB();

      const localLogs = await db.getAllAsync(
        'SELECT * FROM emergency_logs_offline ORDER BY created_at DESC'
      );

      let fetchedLogs = localLogs || [];

      if (elderId && token) {
        try {
          const res = await apiFetch(`/emergency/elder/${elderId}`, token);
          if (res && Array.isArray(res.logs)) {
            fetchedLogs = res.logs;
          }
        } catch {
          // Fallback to SQLite cache
        }
      }

      if (fetchedLogs.length > 0) {
        const formatted: EmergencyEventRecord[] = fetchedLogs.map((e: any, idx: number) => {
          const isCancelled = e.status === 'Resolved' && e.cancelled_by_role;
          const isPending = e.synced === 0 || e.status === 'Pending';
          return {
            id: String(e.id || `emg_${idx}`),
            type: isPending ? 'PENDING' : isCancelled ? 'CANCELLED' : 'TRIGGERED',
            title: e.triggered_phrase || 'Emergency Alert',
            dateStr: e.created_at ? new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today',
            timeStr: e.created_at ? new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
            statusText: isPending ? 'Waiting for connection' : isCancelled ? 'Cancelled' : 'Guardian Notified',
            group: 'TODAY',
            createdAt: e.created_at,
            resolvedAt: e.resolved_at,
            resolutionNotes: e.resolution_notes,
          };
        });
        setEvents(formatted);
      }
    } catch (err) {
      console.warn('Failed to load emergency history from SQLite:', err);
    } finally {
      setLoading(false);
    }
  }, [elderId, token]);

  React.useEffect(() => {
    loadEmergencyHistory();
  }, [loadEmergencyHistory]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `Emergency History. ${events.length} safety events recorded.`
    );
  }, [events]);

  const todayEvents = events.filter((e) => e.group === 'TODAY');
  const earlierEvents = events.filter((e) => e.group === 'EARLIER');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es27.txt Section 1) ─── */}
      <ScreenHeader title="Emergency History" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── SUBTITLE BANNER (es27.txt Section 2) ─── */}
        <View style={styles.bannerBox}>
          <Text style={styles.bannerSubtitle}>Your recent safety events</Text>
        </View>

        {events.length === 0 ? (
          /* ─── 13. EMPTY STATE ─── */
          <View style={styles.emptyBox}>
            <View style={styles.emptyShieldCircle}>
              <MaterialCommunityIcons name="shield-check-outline" size={54} color={colors.success} />
            </View>
            <Text style={styles.emptyTitle}>No emergency events</Text>
            <Text style={styles.emptySubtitle}>
              Your safety history will appear here when an event occurs.
            </Text>
          </View>
        ) : (
          <>
            {/* ─── TODAY GROUP ─── */}
            {todayEvents.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.groupLabel}>TODAY</Text>
                {todayEvents.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.eventCard}
                    onPress={() => {
                      if (onViewEvent) onViewEvent(item);
                      onNavigate('emergencyDetails');
                    }}
                    activeOpacity={0.85}
                    accessible={true}
                    accessibilityLabel={`Emergency event ${item.title}, dated ${item.dateStr}`}
                  >
                    <View style={styles.cardHeaderRow}>
                      <MaterialCommunityIcons
                        name={
                          item.type === 'CANCELLED'
                            ? 'check-circle-outline'
                            : 'alert-circle'
                        }
                        size={28}
                        color={
                          item.type === 'CANCELLED'
                            ? colors.warning
                            : item.type === 'TRIGGERED'
                            ? colors.error
                            : colors.text.secondary
                        }
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.eventTitleText}>{item.title}</Text>
                        <Text style={styles.dateTimeText}>
                          {item.dateStr} • {item.timeStr}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            item.type === 'CANCELLED'
                              ? colors.warningContainer
                              : item.type === 'TRIGGERED'
                              ? colors.successContainer
                              : colors.surfaceVariant,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              item.type === 'CANCELLED'
                                ? colors.warning
                                : item.type === 'TRIGGERED'
                                ? colors.success
                                : colors.text.secondary,
                          },
                        ]}
                      >
                        {item.statusText}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ─── EARLIER GROUP ─── */}
            {earlierEvents.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.groupLabel}>EARLIER</Text>
                {earlierEvents.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.eventCard}
                    onPress={() => {
                      if (onViewEvent) onViewEvent(item);
                      onNavigate('emergencyDetails');
                    }}
                    activeOpacity={0.85}
                    accessible={true}
                    accessibilityLabel={`Emergency event ${item.title}, dated ${item.dateStr}`}
                  >
                    <View style={styles.cardHeaderRow}>
                      <MaterialCommunityIcons
                        name={
                          item.type === 'CANCELLED'
                            ? 'check-circle-outline'
                            : 'alert-circle'
                        }
                        size={28}
                        color={
                          item.type === 'CANCELLED'
                            ? colors.warning
                            : item.type === 'TRIGGERED'
                            ? colors.error
                            : colors.text.secondary
                        }
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.eventTitleText}>{item.title}</Text>
                        <Text style={styles.dateTimeText}>
                          {item.dateStr} • {item.timeStr}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            item.type === 'CANCELLED'
                              ? colors.warningContainer
                              : item.type === 'TRIGGERED'
                              ? colors.successContainer
                              : colors.surfaceVariant,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              item.type === 'CANCELLED'
                                ? colors.warning
                                : item.type === 'TRIGGERED'
                                ? colors.success
                                : colors.text.secondary,
                          },
                        ]}
                      >
                        {item.statusText}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <BottomNavBar activeTab="sos" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4 || 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s4 || 16,
    paddingBottom: 110,
  },
  bannerBox: {
    marginBottom: spacing.s4 || 16,
  },
  bannerSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  groupSection: {
    marginBottom: spacing.s4 || 16,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s3 || 12,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  dateTimeText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyShieldCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.successContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmergencyHistoryScreen;

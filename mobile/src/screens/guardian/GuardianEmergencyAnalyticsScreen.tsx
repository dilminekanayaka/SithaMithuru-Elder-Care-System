/**
 * GuardianEmergencyAnalyticsScreen.tsx — Screen G52 (Historical Emergency Analytics)
 * Spec: g52.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, NHS App, Samsung Health
 *
 * Screen Mission: Answers "How frequently have emergencies occurred, and how quickly have they been responded to?"
 *
 * Healthcare Safety Mandate per g52.txt:
 *  - G52 is HISTORICAL Emergency Analytics. (Live emergency response remains in Emergency Module).
 *  - Categorically computes Response Time = Acknowledged At - Detected At.
 *  - Does NOT make medical interpretations ("Elder is healthy") or fake "safe" states.
 *
 * Component Architecture per g52.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Emergency Analytics", Subtitle "Historical Metrics & Response • G52", Overflow menu).
 *  3. Elder Selector Context (Nimal Perera).
 *  4. Period Selector Chips (7 Days, 30 Days default, 90 Days).
 *  5. Primary KPI 1: Emergency Frequency Card (2 events, ↑ 1 vs previous + Info modal).
 *  6. Primary KPI 2: Response Time Card (Average 4m 32s, Fastest 1m 48s, Slowest 8m 14s).
 *  7. Emergency Frequency Trend Chart (Daily event count line/bar graph with tap inspection).
 *  8. Response Outcome Statistics (Acknowledged 2, Resolved 2, Unresolved 0).
 *  9. Recent Emergency Events Log Card (Aug 7 7:42 PM, Aug 3 10:15 AM + CTA to Emergency History).
 * 10. Key Period Changes Factual Summary Card.
 * 11. Data Freshness & Sync Footer (Updated 8:42 AM).
 * 12. Persistent 5-Tab Bottom Navigation Bar.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

const formatDuration = (ms: number): string => {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s}s`;
};

// Screen palette — derived from the central SithaMithuru design system
// (mobile/src/theme) rather than a hardcoded local copy, so this screen
// picks up palette changes automatically instead of silently drifting.
const C = {
  bg:             colors.background,
  card:           colors.surface,
  primary:        colors.primary,
  primaryLight:   colors.primaryContainer,
  warning:        colors.warning,
  warningLight:   colors.warningContainer,
  orange:         colors.category.journal.accent,
  orangeLight:    colors.category.journal.bg,
  error:          colors.error,
  errorLight:     colors.errorContainer,
  info:           colors.info,
  infoLight:      colors.infoContainer,
  textPrimary:    colors.text.primary,
  textSecondary:  colors.text.secondary,
  textMuted:      colors.text.tertiary,
  border:         colors.outline,
};

interface EmergencyLog {
  id: number;
  triggered_phrase: string | null;
  status: 'Pending' | 'Resolved' | 'False Alarm';
  resolution_reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface GuardianEmergencyAnalyticsScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const RANGE_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };

const GuardianEmergencyAnalyticsScreen: React.FC<GuardianEmergencyAnalyticsScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(true);
  const [loadError, setLoadError]             = useState<string | null>(null);
  const [refreshing, setRefreshing]           = useState(false);
  const [dateRange, setDateRange]             = useState<'7d' | '30d' | '90d'>('30d');
  const [showInfoModal, setShowInfoModal]     = useState(false);
  const [showMoreMenu, setShowMoreMenu]       = useState(false);
  const [logs, setLogs]                       = useState<EmergencyLog[]>([]);
  const [elderName, setElderName]             = useState('your elder');

  const loadData = useCallback(async () => {
    if (!elderId) {
      setLoadError('No elder selected.');
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      const [res, elderRes] = await Promise.all([
        apiFetch(`/guardian/emergency-logs/${elderId}`, token),
        apiFetch(`/guardian/elders/${elderId}`, token),
      ]);
      setLogs(res || []);
      if (elderRes) setElderName(elderRes.name || 'your elder');
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load emergency analytics. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RANGE_DAYS[dateRange]);
  const inRange = logs.filter(l => new Date(l.created_at) >= cutoff);

  const responseTimes = inRange
    .filter(l => l.resolved_at)
    .map(l => new Date(l.resolved_at!).getTime() - new Date(l.created_at).getTime());
  const avgResponseMs = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
  const fastestMs = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
  const slowestMs = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

  const resolvedCount = inRange.filter(l => l.status === 'Resolved').length;
  const falseAlarmCount = inRange.filter(l => l.status === 'False Alarm').length;
  const pendingCount = inRange.filter(l => l.status === 'Pending').length;

  const dayBuckets = new Map<string, number>();
  for (const l of inRange) {
    const day = l.created_at.slice(0, 10);
    dayBuckets.set(day, (dayBuckets.get(day) || 0) + 1);
  }
  const maxDayCount = Math.max(1, ...Array.from(dayBuckets.values()));
  const trendDays = Array.from(dayBuckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 4. TOP APP BAR ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Emergency Analytics</Text>
          <Text style={styles.headerSubtitle}>Historical Metrics & Response • G52</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowMoreMenu(v => !v)}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color={C.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* OVERFLOW MENU MODAL */}
      <Modal visible={showMoreMenu} transparent animationType="fade" onRequestClose={() => setShowMoreMenu(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMoreMenu(false)}>
          <View style={styles.menuContent}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Emergency Analytics Refreshed' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Data</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[C.primary]} />
        }
      >
        {loading && (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        )}

        {!loading && loadError && (
          <View style={styles.card}>
            <MaterialCommunityIcons name="alert-circle-outline" size={40} color={C.textMuted} />
            <Text style={{ marginTop: 8, fontSize: 13, fontWeight: '700', color: C.textPrimary }}>{loadError}</Text>
          </View>
        )}

        {!loading && !loadError && (
          <>
            {/* ─── ELDER CONTEXT BANNER ─── */}
            <View style={styles.elderContextBanner}>
              <MaterialCommunityIcons name="account-heart" size={20} color={C.primary} />
              <Text style={styles.elderContextText}>
                Monitoring <Text style={{ fontWeight: '900', color: C.textPrimary }}>{elderName}</Text>
              </Text>
            </View>

            {/* ─── PERIOD SELECTOR ─── */}
            <View style={styles.rangeRow}>
              {[
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: '90d', label: '90 Days' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.rangeChip, dateRange === r.id && styles.rangeChipActive]}
                  onPress={() => setDateRange(r.id as any)}
                >
                  <Text style={[styles.rangeChipText, dateRange === r.id && styles.rangeChipTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ─── KPI 1: EMERGENCY FREQUENCY CARD ─── */}
            <View style={styles.heroCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardSectionLabel}>EMERGENCY FREQUENCY</Text>
                <TouchableOpacity onPress={() => setShowInfoModal(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="information-outline" size={18} color={C.info} />
                </TouchableOpacity>
              </View>

              <View style={styles.heroRow}>
                <Text style={styles.heroRateText}>{inRange.length}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroMainTitle}>Emergency Events Recorded</Text>
                  <Text style={styles.heroComparisonText}>In the selected {RANGE_DAYS[dateRange]}-day period</Text>
                </View>
              </View>
            </View>

            {/* ─── KPI 2: RESPONSE TIME CARD ─── */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="timer-outline" size={20} color={C.primary} />
                <Text style={styles.cardHeaderTitle}>Guardian Response Time</Text>
              </View>

              {responseTimes.length > 0 ? (
                <>
                  <View style={styles.respTimeGrid}>
                    <View style={styles.respBox}>
                      <Text style={styles.respVal}>{formatDuration(avgResponseMs)}</Text>
                      <Text style={styles.respLabel}>Average Response</Text>
                    </View>

                    <View style={styles.respBox}>
                      <Text style={[styles.respVal, { color: C.primary }]}>{formatDuration(fastestMs)}</Text>
                      <Text style={styles.respLabel}>Fastest Response</Text>
                    </View>

                    <View style={styles.respBox}>
                      <Text style={[styles.respVal, { color: C.warning }]}>{formatDuration(slowestMs)}</Text>
                      <Text style={styles.respLabel}>Slowest Response</Text>
                    </View>
                  </View>
                  <Text style={styles.respFootnote}>*Response Time = Resolved At − Emergency Trigger Detected At</Text>
                </>
              ) : (
                <Text style={{ fontSize: 12, color: C.textSecondary }}>No resolved emergency events in this period yet.</Text>
              )}
            </View>

            {/* ─── EMERGENCY FREQUENCY TREND CHART ─── */}
            {trendDays.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="chart-bar" size={20} color={C.primary} />
                  <Text style={styles.cardHeaderTitle}>Emergency Event Trend (Recent Days)</Text>
                </View>

                <View style={styles.chartContainer}>
                  <View style={styles.chartArea}>
                    <View style={styles.barGraphRow}>
                      {trendDays.map(([day, count]) => (
                        <View key={day} style={styles.barCol}>
                          <View
                            style={[
                              styles.chartBar,
                              {
                                height: `${Math.max((count / maxDayCount) * 100, 8)}%` as any,
                                backgroundColor: C.error,
                              },
                            ]}
                          />
                          <Text style={styles.barLabel}>{new Date(`${day}T00:00:00`).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ─── RESPONSE OUTCOME STATISTICS ─── */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="check-decagram-outline" size={20} color={C.primary} />
                <Text style={styles.cardHeaderTitle}>Response Outcomes</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: C.warning }]}>{pendingCount}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: C.primary }]}>{resolvedCount}</Text>
                  <Text style={styles.statLabel}>Resolved</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: C.textMuted }]}>{falseAlarmCount}</Text>
                  <Text style={styles.statLabel}>False Alarm</Text>
                </View>
              </View>
            </View>

            {/* ─── RECENT EMERGENCY EVENTS ─── */}
            <Text style={styles.sectionHeaderTitle}>Recent Emergency Records</Text>
            <View style={styles.card}>
              {inRange.length === 0 ? (
                <Text style={{ fontSize: 12, color: C.textSecondary }}>No emergency events recorded in this period.</Text>
              ) : (
                inRange.slice(0, 5).map((log, idx) => {
                  const responseMs = log.resolved_at ? new Date(log.resolved_at).getTime() - new Date(log.created_at).getTime() : null;
                  const statusColor = log.status === 'Resolved' ? C.primary : log.status === 'Pending' ? C.warning : C.textMuted;
                  return (
                    <View key={log.id}>
                      {idx > 0 && <View style={styles.divider} />}
                      <View style={styles.eventRow}>
                        <View style={[styles.eventIconBox, { backgroundColor: C.errorLight }]}>
                          <MaterialCommunityIcons name="alert-decagram" size={22} color={C.error} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.eventTitle}>{log.triggered_phrase || 'Emergency SOS Triggered'}</Text>
                          <Text style={styles.eventSub}>{new Date(log.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
                          <Text style={styles.eventMeta}>
                            {responseMs !== null ? `Response Time: ${formatDuration(responseMs)} • ` : ''}
                            Status: <Text style={{ color: statusColor, fontWeight: '800' }}>{log.status.toUpperCase()}</Text>
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}

              <TouchableOpacity style={styles.historyCtaBtn} onPress={() => onNavigate('emergencyHistory')}>
                <Text style={styles.historyCtaText}>View Full Emergency History →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* FREQUENCY INFO MODAL */}
      <Modal visible={showInfoModal} transparent animationType="fade" onRequestClose={() => setShowInfoModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowInfoModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="information" size={24} color={C.info} />
              <Text style={styles.modalTitle}>Emergency Frequency</Text>
            </View>
            <Text style={styles.modalBodyText}>
              Emergency frequency represents the total count of recorded emergency events (audio phrase triggers and SOS alerts) during the selected time period.
            </Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowInfoModal(false)}>
              <Text style={styles.modalCloseBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PERSISTENT 5-TAB BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        {[
          { id: 'guardianDashboard', label: 'Home', icon: 'home' },
          { id: 'elderOverview', label: 'Elder', icon: 'account-heart' },
          { id: 'emergencyAlerts', label: 'Emergency', icon: 'alert-decagram-outline' },
          { id: 'reports', label: 'Reports', icon: 'chart-bar' },
          { id: 'guardianSettings', label: 'Settings', icon: 'cog-outline' },
        ].map((tab) => {
          const isActive = tab.id === 'emergencyAlerts';
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabBtn}
              onPress={() => onNavigate(tab.id)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={22}
                color={isActive ? C.primary : C.textMuted}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    ...elevation.e1,
  },
  backBtn: { paddingRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.textPrimary },
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: C.primary, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 60, paddingRight: 16 },
  menuContent: { backgroundColor: C.card, borderRadius: 16, padding: 8, width: 200, ...elevation.e3, borderWidth: 1, borderColor: C.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12 },
  menuItemText: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: 110 },
  elderContextBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginBottom: spacing.s4 },
  elderContextText: { fontSize: 12, color: C.textSecondary },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.s4 },
  rangeChip: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  rangeChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  rangeChipText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  rangeChipTextActive: { color: C.primary, fontWeight: '900' },
  heroCard: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardSectionLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary, flex: 1, marginLeft: 8 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 6 },
  heroRateText: { fontSize: 38, fontWeight: '900', color: C.error },
  heroMainTitle: { fontSize: 14, fontWeight: '800', color: C.textPrimary },
  heroComparisonText: { fontSize: 11, fontWeight: '700', color: C.textSecondary, marginTop: 2 },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  respTimeGrid: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  respBox: { flex: 1, backgroundColor: C.bg, borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  respVal: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  respLabel: { fontSize: 10, color: C.textSecondary, marginTop: 2, textAlign: 'center' },
  respFootnote: { fontSize: 10, color: C.textMuted, marginTop: 4 },
  chartContainer: { flexDirection: 'row', height: 110, alignItems: 'flex-end', marginTop: 10 },
  chartYAxis: { justifyContent: 'space-between', height: '100%', paddingRight: 8 },
  yAxisLabel: { fontSize: 9, color: C.textMuted, fontWeight: '700' },
  chartArea: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  chartGridLines: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'space-between' },
  gridLine: { height: 1, backgroundColor: colors.surfaceVariant },
  barGraphRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', paddingHorizontal: 4 },
  barCol: { alignItems: 'center', width: 22, height: '100%', justifyContent: 'flex-end' },
  chartBar: { width: 12, borderRadius: 6 },
  barLabel: { fontSize: 9, color: C.textMuted, marginTop: 4, fontWeight: '700' },
  selectedPointBox: { backgroundColor: C.bg, borderRadius: 12, padding: 10, marginTop: 10, borderWidth: 1, borderColor: C.border },
  selectedPointTitle: { fontSize: 11, fontWeight: '800', color: C.textPrimary },
  selectedPointSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  statsGrid: { flexDirection: 'row', gap: 10, marginTop: 6 },
  statBox: { flex: 1, backgroundColor: C.bg, borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statNum: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  statLabel: { fontSize: 10, color: C.textSecondary, marginTop: 2, textAlign: 'center' },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  eventIconBox: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  eventTitle: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  eventSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  eventMeta: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.surfaceVariant },
  historyCtaBtn: { marginTop: 10, paddingTop: 6, alignItems: 'center' },
  historyCtaText: { fontSize: 12, fontWeight: '900', color: C.primary },
  syncFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginVertical: 12 },
  syncFooterText: { fontSize: 11, color: C.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.s6 },
  modalContent: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s6, width: '100%', maxWidth: 340, ...elevation.e3 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  modalBodyText: { fontSize: 13, color: C.textSecondary, lineHeight: 20 },
  modalCloseBtn: { height: 44, backgroundColor: C.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  modalCloseBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...elevation.e2,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 2 },
  tabLabelActive: { color: C.primary, fontWeight: '800' },
});

export default GuardianEmergencyAnalyticsScreen;

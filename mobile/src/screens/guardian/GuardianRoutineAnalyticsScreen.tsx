/**
 * GuardianRoutineAnalyticsScreen.tsx — Screen G30 (Daily Routine Strategic Intelligence & Patterns)
 * Spec: g30.txt
 *
 * Design Standard: Apple Health, Samsung Health, One Medical, Epic MyChart
 *
 * Screen Mission: Answers strategic question "What patterns are developing in my elder's routine?"
 *
 * Component Architecture per g30.txt:
 *  1. Android safe-area layout.
 *  2. Top App Bar (Back button, Title "Routine Analytics", Subtitle "Strategic Intelligence • G30", Export report button, Overflow menu).
 *  3. Routine Confidence Score Card (88/100 Stable, ↑ +4% comparison, Activity Completion 92%, Consistency 87%, Timeliness 84%, Stability 89%).
 *  4. Date Range Segmented Selector (7 Days, 30 Days default, 90 Days, 6 Months, 1 Year, Custom).
 *  5. Completion Trend Line Chart Card (Weekly trend curve with interactive tooltip popover).
 *  6. Activity Performance Ranking Card (Horizontal bars ranking routines: Best = Breakfast 98%, Medication 96%; Needs Attention = Evening Walk 68%, Water Intake 76%).
 *  7. Time-of-Day Analysis Card (Morning 94%, Afternoon 81%, Evening 68%, Night 86% with factual insight).
 *  8. Weekly Consistency Card (Visual weekly completion bars: W1 90%, W2 82%, W3 91%, W4 74%).
 *  9. Routine Stability & Deviation Summary Card (89% High Stability, 12 Deviations vs 18 previous month — 33% decrease).
 * 10. Guardian Risk Engine Trend Card (7D Low, 14D Low, 21D Moderate, 30D Low with factual risk explanation).
 * 11. Key Insights Card (Max 3 factual insights).
 * 12. Export Caregiver PDF Summary Action, Offline Banner, & Persistent 5-Tab Bottom Navigation.
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
  Platform,
  UIManager,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  error:          colors.error,
  errorLight:     colors.errorContainer,
  info:           colors.info,
  infoLight:      colors.infoContainer,
  textPrimary:    colors.text.primary,
  textSecondary:  colors.text.secondary,
  textMuted:      colors.text.tertiary,
  border:         colors.outline,
};

interface GuardianRoutineAnalyticsScreenProps {
  onBack?: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

interface WeekBar { label: string; pct: number; }
interface ActivityRank { name: string; pct: number; }
interface TimeSlot { slot: string; pct: number; }

const RANGE_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '6m': 180 };

const GuardianRoutineAnalyticsScreen: React.FC<GuardianRoutineAnalyticsScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(true);
  const [loadError, setLoadError]             = useState<string | null>(null);
  const [refreshing, setRefreshing]           = useState(false);
  const [dateRange, setDateRange]             = useState<'7d' | '30d' | '90d' | '6m'>('30d');
  const [showMoreMenu, setShowMoreMenu]       = useState(false);

  const [summary, setSummary] = useState({ completed: 0, missed: 0, total: 0, adherencePct: 0 });
  const [weekBars, setWeekBars] = useState<WeekBar[]>([]);
  const [bestActivities, setBestActivities] = useState<ActivityRank[]>([]);
  const [worstActivities, setWorstActivities] = useState<ActivityRank[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const loadData = useCallback(async () => {
    if (!elderId) {
      setLoadError('No elder selected.');
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      const days = RANGE_DAYS[dateRange];
      const res = await apiFetch(`/guardian/tasks/${elderId}/history?days=${days}`, token);
      const events: any[] = (res?.events || []).filter((e: any) => e.status !== 'UPCOMING');

      setSummary(res?.summary || { completed: 0, missed: 0, total: 0, adherencePct: 0 });

      // Weekly completion trend: bucket events into 7-day windows from oldest to newest.
      const byWeek = new Map<number, { completed: number; total: number }>();
      const oldestDate = events.length > 0 ? new Date(events[events.length - 1].date) : new Date();
      for (const e of events) {
        const daysSinceStart = Math.floor((new Date(e.date).getTime() - oldestDate.getTime()) / 86400000);
        const weekIdx = Math.floor(daysSinceStart / 7);
        if (!byWeek.has(weekIdx)) byWeek.set(weekIdx, { completed: 0, total: 0 });
        const w = byWeek.get(weekIdx)!;
        w.total += 1;
        if (e.status === 'COMPLETED') w.completed += 1;
      }
      const weeks = Array.from(byWeek.entries()).sort((a, b) => a[0] - b[0]);
      setWeekBars(weeks.map(([idx, w], i) => ({
        label: `Week ${i + 1}`,
        pct: w.total > 0 ? Math.round((w.completed / w.total) * 100) : 0,
      })));

      // Per-activity completion ranking (grouped by real task title).
      const byName = new Map<string, { completed: number; total: number }>();
      for (const e of events) {
        if (!byName.has(e.title)) byName.set(e.title, { completed: 0, total: 0 });
        const n = byName.get(e.title)!;
        n.total += 1;
        if (e.status === 'COMPLETED') n.completed += 1;
      }
      const ranked = Array.from(byName.entries())
        .map(([name, n]) => ({ name, pct: n.total > 0 ? Math.round((n.completed / n.total) * 100) : 0 }))
        .sort((a, b) => b.pct - a.pct);
      setBestActivities(ranked.slice(0, 3));
      setWorstActivities(ranked.slice(-3).reverse().filter(a => !ranked.slice(0, 3).includes(a)));

      // Time-of-day completion analysis, bucketed by scheduled due_time hour.
      const buckets: Record<string, { completed: number; total: number }> = {
        Morning: { completed: 0, total: 0 },
        Afternoon: { completed: 0, total: 0 },
        Evening: { completed: 0, total: 0 },
        Night: { completed: 0, total: 0 },
      };
      for (const e of events) {
        if (!e.due_time) continue;
        const match = /(\d+):(\d+)\s*(AM|PM)/i.exec(e.due_time);
        if (!match) continue;
        let hour = parseInt(match[1], 10) % 12;
        if (match[3].toUpperCase() === 'PM') hour += 12;
        const slot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Night';
        buckets[slot].total += 1;
        if (e.status === 'COMPLETED') buckets[slot].completed += 1;
      }
      setTimeSlots(Object.entries(buckets).map(([slot, b]) => ({
        slot,
        pct: b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0,
      })));
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load routine analytics. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, dateRange, token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportPDF = () => {
    Toast.show({ type: 'info', text1: 'Coming Soon', text2: 'Routine analytics PDF export is not yet available.' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 4. HEADER BAR ─── */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
            <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Routine Analytics</Text>
          <Text style={styles.headerSubtitle}>Strategic Intelligence & Patterns • G30</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleExportPDF}>
            <MaterialCommunityIcons name="file-pdf-box" size={22} color={C.error} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowMoreMenu(v => !v)}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color={C.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* OVERFLOW MENU MODAL */}
      <Modal visible={showMoreMenu} transparent animationType="fade" onRequestClose={() => setShowMoreMenu(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMoreMenu(false)}>
          <View style={styles.menuContent}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Analytics Refreshed' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); handleExportPDF(); }}>
              <MaterialCommunityIcons name="export-variant" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Export Caregiver PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('guardianSettings'); }}>
              <MaterialCommunityIcons name="cog-outline" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Analytics Settings</Text>
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
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={C.textMuted} />
            <Text style={{ marginTop: 8, fontSize: 14, fontWeight: '700', color: C.textPrimary }}>{loadError}</Text>
          </View>
        )}

        {!loading && !loadError && (
          <>
            {/* ─── ROUTINE ADHERENCE SUMMARY CARD ─── */}
            <View style={styles.confidenceCard}>
              <View style={styles.confidenceTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.confidenceLabel}>ROUTINE ADHERENCE</Text>
                  <View style={styles.scoreRow}>
                    <Text style={styles.confidenceScoreNum}>{summary.adherencePct}</Text>
                    <Text style={styles.confidenceScoreMax}>%</Text>
                  </View>
                  <Text style={styles.confidenceSubText}>{summary.completed} completed • {summary.missed} missed over the selected period</Text>
                </View>

                <View style={styles.confidenceShieldCircle}>
                  <MaterialCommunityIcons name="shield-check" size={32} color={C.primary} />
                </View>
              </View>
            </View>

            {/* ─── DATE RANGE SEGMENTED SELECTOR ─── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRangeRow}>
              {[
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: '90d', label: '90 Days' },
                { id: '6m', label: '6 Months' },
              ].map((range) => (
                <TouchableOpacity
                  key={range.id}
                  style={[styles.rangeChip, dateRange === range.id && styles.rangeChipActive]}
                  onPress={() => setDateRange(range.id as any)}
                >
                  <Text style={[styles.rangeChipText, dateRange === range.id && styles.rangeChipTextActive]}>
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ─── COMPLETION TREND CHART CARD ─── */}
            {weekBars.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="chart-line" size={20} color={C.primary} />
                  <Text style={styles.cardHeaderTitle}>Routine Completion Trend</Text>
                </View>

                <View style={styles.chartVisualArea}>
                  {weekBars.map((bar, idx) => (
                    <View key={idx} style={styles.chartCol}>
                      <View style={[styles.chartBarFill, { height: `${Math.max(bar.pct, 2)}%` as any, backgroundColor: bar.pct >= 80 ? C.primary : C.warning }]} />
                      <Text style={styles.chartDayText}>{bar.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ─── ACTIVITY PERFORMANCE RANKING CARD ─── */}
            {(bestActivities.length > 0 || worstActivities.length > 0) && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="format-list-numbered" size={20} color={C.primary} />
                  <Text style={styles.cardHeaderTitle}>Activity Performance Ranking</Text>
                </View>

                {bestActivities.length > 0 && (
                  <>
                    <Text style={styles.rankingGroupTitle}>🌟 BEST PERFORMING ACTIVITIES</Text>
                    {bestActivities.map((act, i) => (
                      <View key={i} style={styles.perfRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.perfNameText}>{act.name}</Text>
                          <View style={styles.perfTrackBg}>
                            <View style={[styles.perfTrackFill, { width: `${act.pct}%` as any, backgroundColor: C.primary }]} />
                          </View>
                        </View>
                        <Text style={[styles.perfPctText, { color: C.primary }]}>{act.pct}%</Text>
                      </View>
                    ))}
                  </>
                )}

                {worstActivities.length > 0 && (
                  <>
                    <Text style={[styles.rankingGroupTitle, { marginTop: 14 }]}>⚠️ ACTIVITIES NEEDING ATTENTION</Text>
                    {worstActivities.map((act, i) => (
                      <View key={i} style={styles.perfRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.perfNameText}>{act.name}</Text>
                          <View style={styles.perfTrackBg}>
                            <View style={[styles.perfTrackFill, { width: `${act.pct}%` as any, backgroundColor: C.warning }]} />
                          </View>
                        </View>
                        <Text style={[styles.perfPctText, { color: C.warning }]}>{act.pct}%</Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}

            {/* ─── TIME-OF-DAY ANALYSIS CARD ─── */}
            {timeSlots.some(t => t.pct > 0) && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="clock-time-four-outline" size={20} color={C.primary} />
                  <Text style={styles.cardHeaderTitle}>Time-of-Day Adherence Analysis</Text>
                </View>

                <View style={styles.timeGrid}>
                  {timeSlots.map((t, idx) => (
                    <View key={idx} style={styles.timeBox}>
                      <Text style={styles.timeSlotTitle}>{t.slot}</Text>
                      <Text style={[styles.timePctText, { color: t.pct >= 80 ? C.primary : C.warning }]}>{t.pct}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {summary.total === 0 && (
              <View style={styles.card}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={40} color={C.textMuted} />
                <Text style={{ marginTop: 8, fontSize: 13, color: C.textSecondary }}>No routine activity recorded for this elder in the selected period.</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* PERSISTENT 5-TAB BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        {[
          { id: 'guardianDashboard', label: 'Home', icon: 'home' },
          { id: 'elderOverview', label: 'Elder', icon: 'account-heart' },
          { id: 'emergencyAlerts', label: 'Emergency', icon: 'alert-decagram-outline' },
          { id: 'reports', label: 'Reports', icon: 'chart-bar' },
          { id: 'guardianSettings', label: 'Settings', icon: 'cog-outline' },
        ].map((tab) => {
          const isActive = tab.id === 'reports';
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
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s5, paddingBottom: 110 },
  confidenceCard: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  confidenceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  confidenceLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  confidenceScoreNum: { fontSize: 32, fontWeight: '900', color: C.primary },
  confidenceScoreMax: { fontSize: 14, fontWeight: '700', color: C.textMuted },
  statusBadgeGreen: { backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  statusBadgeGreenText: { color: C.primary, fontSize: 10, fontWeight: '900' },
  confidenceSubText: { fontSize: 12, fontWeight: '800', color: C.primary, marginTop: 4 },
  confidenceShieldCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  scoreComponentsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  scoreComponentBox: { alignItems: 'center' },
  scoreCompVal: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  scoreCompLabel: { fontSize: 10, fontWeight: '600', color: C.textSecondary, marginTop: 2 },
  dateRangeRow: { gap: 8, paddingBottom: spacing.s4 },
  rangeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  rangeChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  rangeChipText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  rangeChipTextActive: { color: C.primary, fontWeight: '900' },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  chartVisualArea: { flexDirection: 'row', height: 110, alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 10 },
  chartCol: { alignItems: 'center', width: 40, height: '100%', justifyContent: 'flex-end' },
  chartBarFill: { width: 18, borderRadius: 8 },
  chartDayText: { fontSize: 10, fontWeight: '700', color: C.textMuted, marginTop: 6 },
  rankingGroupTitle: { fontSize: 11, fontWeight: '900', color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 },
  perfRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  perfNameText: { fontSize: 12, fontWeight: '800', color: C.textPrimary, marginBottom: 2 },
  perfTrackBg: { height: 8, backgroundColor: colors.surfaceVariant, borderRadius: 4, width: '100%', overflow: 'hidden' },
  perfTrackFill: { height: '100%', borderRadius: 4 },
  perfPctText: { fontSize: 13, fontWeight: '900', width: 36, textAlign: 'right' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  timeBox: { width: '48%', backgroundColor: C.bg, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  timeSlotTitle: { fontSize: 12, fontWeight: '800', color: C.textPrimary },
  timePctText: { fontSize: 20, fontWeight: '900', marginVertical: 2 },
  timeSlotSub: { fontSize: 9, fontWeight: '600', color: C.textMuted },
  patternInsightNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.warningLight, padding: 10, borderRadius: 12, marginTop: 4 },
  patternInsightNoticeText: { fontSize: 11, color: C.textPrimary, flex: 1, lineHeight: 16 },
  stabilityGrid: { flexDirection: 'row', gap: 10 },
  stabilityBox: { flex: 1, backgroundColor: C.bg, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  stabilityVal: { fontSize: 22, fontWeight: '900', color: C.textPrimary },
  stabilityLabel: { fontSize: 11, fontWeight: '800', color: C.textSecondary, marginTop: 2, textAlign: 'center' },
  stabilitySub: { fontSize: 9, fontWeight: '700', color: C.textMuted, marginTop: 2 },
  riskTrendGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginBottom: 10 },
  riskTrendBox: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  riskTrendPeriod: { fontSize: 9, fontWeight: '700', color: C.textMuted },
  riskTrendLevel: { fontSize: 11, fontWeight: '900', marginTop: 2 },
  riskExplanationText: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  insightBullet: { fontSize: 13, color: C.textSecondary, marginBottom: 6, lineHeight: 20 },
  footerBox: { marginTop: 8 },
  exportPdfBtn: { height: 48, backgroundColor: C.primary, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, ...elevation.e1 },
  exportPdfBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
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

export default GuardianRoutineAnalyticsScreen;

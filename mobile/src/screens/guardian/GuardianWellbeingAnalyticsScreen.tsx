/**
 * GuardianWellbeingAnalyticsScreen.tsx — Screen G36 (Well-being Strategic Analytics & Trends)
 * Spec: g36.txt
 *
 * Design Standard: Apple Health, Samsung Health, One Medical, Epic MyChart
 *
 * Screen Mission: Answers "What long-term well-being patterns and observable trends can I understand over time?"
 *
 * Healthcare Safety Mandate per g36.txt:
 *  - NOT a mental-health diagnosis application.
 *  - NO clinical depression scores, anxiety scores, or mental health diagnostic conclusions.
 *  - Uses observable, explainable, system-generated metrics & central Risk Engine trends.
 *
 * Component Architecture per g36.txt:
 *  1. Android safe-area layout.
 *  2. Top App Bar (Back button, Title "Well-being Analytics", Subtitle "Strategic Trends • G36", Export PDF, Overflow menu).
 *  3. Date Range Segmented Selector (7 Days, 30 Days default, 90 Days, 6 Months, 1 Year, Custom Date).
 *  4. Check-in Completion Consistency Card (86% Consistency, 26/30 days completed).
 *  5. Accessible Mood Level Trend Line Chart with interactive date tooltips & textual summary.
 *  6. Mood Distribution Horizontal Bar Breakdown (Very Good 5, Good 14, Okay 7, Low 4, Very Low 0).
 *  7. Baseline Comparison & 30-Day Shift Card (Current 7D 72% vs Ref 30D 84%, -12% shift).
 *  8. Time-of-Day Pattern Grid Card (Morning 88%, Afternoon 81%, Evening 64%, Night 79%).
 *  9. Well-being Alert & Central Guardian Risk Engine Trend Summary (24D Green, 5D Yellow, 1D Orange, 0D Red).
 * 10. Key Strategic Observations Card (Max 3 factual non-diagnostic points).
 * 11. PDF Report Export CTA, Offline Banner, & Persistent 5-Tab Bottom Navigation.
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

const MOOD_COLORS: Record<string, string> = {
  Happy: colors.primary,
  Neutral: colors.warning,
  Sad: colors.warning,
  Anxious: colors.warning,
  Angry: colors.error,
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

interface MoodHistoryEntry {
  id: number;
  mood_type: string;
  notes: string | null;
  date: string;
  day_name: string;
  created_at: string;
}

interface GuardianWellbeingAnalyticsScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

const GuardianWellbeingAnalyticsScreen: React.FC<GuardianWellbeingAnalyticsScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(true);
  const [loadError, setLoadError]             = useState<string | null>(null);
  const [refreshing, setRefreshing]           = useState(false);
  const [showMoreMenu, setShowMoreMenu]       = useState(false);
  const [history, setHistory]                 = useState<MoodHistoryEntry[]>([]);

  const loadData = useCallback(async () => {
    if (!elderId) {
      setLoadError('No elder selected.');
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      const res = await apiFetch(`/mood/elder/${elderId}`, token);
      setHistory(res?.history || []);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load well-being analytics. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const checkinDays = new Set(history.map(h => h.date)).size;
  const consistencyPct = Math.round((checkinDays / 7) * 100);

  const moodCounts: Record<string, number> = {};
  for (const h of history) moodCounts[h.mood_type] = (moodCounts[h.mood_type] || 0) + 1;
  const distribution = Object.entries(moodCounts)
    .map(([mood, count]) => ({ mood, count, pct: history.length > 0 ? Math.round((count / history.length) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  const buckets: Record<string, { happy: number; total: number }> = {
    Morning: { happy: 0, total: 0 },
    Afternoon: { happy: 0, total: 0 },
    Evening: { happy: 0, total: 0 },
    Night: { happy: 0, total: 0 },
  };
  for (const h of history) {
    const hour = new Date(h.created_at).getHours();
    const slot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Night';
    buckets[slot].total += 1;
    if (h.mood_type === 'Happy') buckets[slot].happy += 1;
  }
  const timeOfDay = Object.entries(buckets)
    .filter(([, b]) => b.total > 0)
    .map(([slot, b]) => ({ slot, pct: Math.round((b.happy / b.total) * 100), total: b.total }));

  const mostFrequent = distribution[0];
  const lowMoodCount = (moodCounts['Sad'] || 0) + (moodCounts['Angry'] || 0) + (moodCounts['Anxious'] || 0);
  const observations: string[] = [];
  if (mostFrequent) observations.push(`${mostFrequent.mood} was the most frequently recorded mood in the last 7 days (${mostFrequent.count} of ${history.length} check-ins).`);
  if (lowMoodCount > 0) observations.push(`${lowMoodCount} low-mood check-in${lowMoodCount === 1 ? '' : 's'} (Sad, Angry, or Anxious) recorded in the last 7 days.`);
  if (checkinDays < 7) observations.push(`Check-ins were missing on ${7 - checkinDays} of the last 7 days.`);

  const handleExportPdf = () => {
    Toast.show({ type: 'info', text1: 'Coming Soon', text2: 'Well-being analytics PDF export is not yet available.' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 4. HEADER BAR ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Well-being Analytics</Text>
          <Text style={styles.headerSubtitle}>Strategic Trends • G36</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleExportPdf}>
            <MaterialCommunityIcons name="file-download-outline" size={22} color={C.primary} />
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Refreshed Analytics' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); handleExportPdf(); }}>
              <MaterialCommunityIcons name="file-pdf-box" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Export PDF Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('todaysWellbeing'); }}>
              <MaterialCommunityIcons name="history" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>View History (G34)</Text>
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
            {/* ─── CHECK-IN COMPLETION CONSISTENCY CARD ─── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="check-all" size={20} color={C.primary} />
                <Text style={styles.cardHeaderTitle}>Check-in Completion Consistency (Last 7 Days)</Text>
              </View>

              <View style={styles.consistencyRow}>
                <Text style={styles.consistencyNum}>{consistencyPct}%</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.consistencyMainText}>{checkinDays} of 7 days completed</Text>
                  <Text style={styles.consistencySubText}>{7 - checkinDays} days without a check-in record.</Text>
                </View>
              </View>
            </View>

            {/* ─── MOOD DISTRIBUTION HORIZONTAL BARS ─── */}
            {distribution.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="chart-bar" size={20} color={C.primary} />
                  <Text style={styles.cardHeaderTitle}>Mood Record Distribution</Text>
                </View>

                <View style={styles.distList}>
                  {distribution.map((dist) => (
                    <View key={dist.mood} style={styles.distRow}>
                      <View style={{ width: 85 }}>
                        <Text style={styles.distMoodName}>{dist.mood}</Text>
                      </View>

                      <View style={styles.distBarBg}>
                        <View style={[styles.distBarFill, { width: `${dist.pct}%` as any, backgroundColor: MOOD_COLORS[dist.mood] || C.primary }]} />
                      </View>

                      <Text style={styles.distCountText}>{dist.count} ({dist.pct}%)</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ─── TIME-OF-DAY PATTERN GRID ─── */}
            {timeOfDay.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color={C.primary} />
                  <Text style={styles.cardHeaderTitle}>Time-of-Day Check-in Pattern</Text>
                </View>

                <View style={styles.todGrid}>
                  {timeOfDay.map((tod) => (
                    <View key={tod.slot} style={styles.todBox}>
                      <Text style={styles.todLabelText}>{tod.slot} ({tod.total} check-in{tod.total === 1 ? '' : 's'})</Text>
                      <View style={styles.todValRow}>
                        <Text style={styles.todValNum}>{tod.pct}%</Text>
                        <Text style={styles.todStatusText}>Happy</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ─── KEY OBSERVATIONS ─── */}
            {observations.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={C.primary} />
                  <Text style={styles.cardHeaderTitle}>Key Observations</Text>
                </View>

                <View style={styles.observationsList}>
                  {observations.map((obs, idx) => (
                    <View key={idx} style={styles.obsItemRow}>
                      <View style={styles.obsNumCircle}>
                        <Text style={styles.obsNumText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.obsBodyText}>{obs}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {history.length === 0 && (
              <View style={styles.card}>
                <MaterialCommunityIcons name="emoticon-outline" size={40} color={C.textMuted} />
                <Text style={{ marginTop: 8, fontSize: 13, color: C.textSecondary }}>No mood check-ins recorded for this elder in the last 7 days.</Text>
              </View>
            )}

            {/* EXPORT PDF CTA */}
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportPdf} activeOpacity={0.85}>
              <MaterialCommunityIcons name="file-download-outline" size={20} color="#FFF" />
              <Text style={styles.exportBtnText}>Export Well-being Analytics PDF Report</Text>
            </TouchableOpacity>
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
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: 110 },
  dateRangeRow: { gap: 8, marginBottom: spacing.s4 },
  rangeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  rangeChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  rangeChipText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  rangeChipTextActive: { color: C.primary, fontWeight: '900' },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  consistencyRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  consistencyNum: { fontSize: 28, fontWeight: '900', color: C.primary },
  consistencyMainText: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  consistencySubText: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  chartVisualBox: { gap: 8, marginBottom: 10 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trendLevelLabel: { width: 70, fontSize: 11, fontWeight: '700', color: C.textSecondary },
  trendBarBg: { flex: 1, height: 8, backgroundColor: colors.surfaceVariant, borderRadius: 4, overflow: 'hidden' },
  trendBarFill: { height: '100%', borderRadius: 4 },
  chartSummaryText: { fontSize: 11, color: C.textSecondary, lineHeight: 16, marginTop: 4 },
  distList: { gap: 10 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  distMoodName: { fontSize: 12, fontWeight: '700', color: C.textPrimary },
  distBarBg: { flex: 1, height: 10, backgroundColor: colors.surfaceVariant, borderRadius: 5, overflow: 'hidden' },
  distBarFill: { height: '100%', borderRadius: 5 },
  distCountText: { width: 70, fontSize: 11, fontWeight: '700', color: C.textSecondary, textAlign: 'right' },
  baselineCompareGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  baselineCompareBox: { flex: 1, backgroundColor: C.bg, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  baselineCompareVal: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  baselineCompareLabel: { fontSize: 10, fontWeight: '600', color: C.textSecondary, marginTop: 2, textAlign: 'center' },
  diffPillRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.orangeLight, padding: 10, borderRadius: 12 },
  diffPillText: { fontSize: 11, fontWeight: '800', color: C.orange },
  todGrid: { gap: 8, marginBottom: 10 },
  todBox: { backgroundColor: C.bg, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  todLabelText: { fontSize: 11, fontWeight: '700', color: C.textSecondary },
  todValRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  todValNum: { fontSize: 14, fontWeight: '900', color: C.primary },
  todStatusText: { fontSize: 11, fontWeight: '700', color: C.textPrimary },
  todInsightText: { fontSize: 11, color: C.textSecondary, lineHeight: 16 },
  riskTrendGrid: { flexDirection: 'row', gap: 8 },
  riskTrendBox: { flex: 1, padding: 10, borderRadius: 12, alignItems: 'center' },
  riskTrendNum: { fontSize: 14, fontWeight: '900' },
  riskTrendLabel: { fontSize: 9, fontWeight: '800', color: C.textSecondary, marginTop: 2 },
  observationsList: { gap: 10 },
  obsItemRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  obsNumCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  obsNumText: { fontSize: 11, fontWeight: '900', color: C.primary },
  obsBodyText: { flex: 1, fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  exportBtn: { height: 50, backgroundColor: C.primary, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4, ...elevation.e2 },
  exportBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.s6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  applyDateBtn: { height: 44, backgroundColor: C.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  applyDateBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
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

export default GuardianWellbeingAnalyticsScreen;

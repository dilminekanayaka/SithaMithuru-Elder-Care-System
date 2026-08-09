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
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = {
  bg:             '#F8FAFC',
  card:           '#FFFFFF',
  primary:        '#2E7D32',
  primaryLight:   '#E8F5E9',
  warning:        '#F9A825',
  warningLight:   '#FFF8E1',
  error:          '#D32F2F',
  errorLight:     '#FFEBEE',
  info:           '#1565C0',
  infoLight:      '#E3F2FD',
  textPrimary:    '#1E293B',
  textSecondary:  '#64748B',
  textMuted:      '#94A3B8',
  border:         '#E2E8F0',
};

interface GuardianRoutineAnalyticsScreenProps {
  onBack?: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianRoutineAnalyticsScreen: React.FC<GuardianRoutineAnalyticsScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(false);
  const [refreshing, setRefreshing]           = useState(false);
  const [dateRange, setDateRange]             = useState<'7d' | '30d' | '90d' | '6m' | '1y' | 'custom'>('30d');
  const [showMoreMenu, setShowMoreMenu]       = useState(false);
  const [selectedWeekTooltip, setSelectedWeekTooltip] = useState<string | null>(null);

  const handleExportPDF = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: 'success',
      text1: 'Exporting PDF Report',
      text2: 'Generating 30-Day Routine Strategic Analytics Report...',
    });
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
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} colors={[C.primary]} />
        }
      >
        {/* ─── 5. ROUTINE CONFIDENCE SCORE CARD ─── */}
        <View style={styles.confidenceCard}>
          <View style={styles.confidenceTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.confidenceLabel}>ROUTINE CONFIDENCE SCORE</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.confidenceScoreNum}>88</Text>
                <Text style={styles.confidenceScoreMax}>/ 100</Text>
                <View style={styles.statusBadgeGreen}>
                  <Text style={styles.statusBadgeGreenText}>STABLE</Text>
                </View>
              </View>
              <Text style={styles.confidenceSubText}>↑ +4% compared with previous 30 days</Text>
            </View>

            <View style={styles.confidenceShieldCircle}>
              <MaterialCommunityIcons name="shield-check" size={32} color={C.primary} />
            </View>
          </View>

          {/* ─── 6. SCORE COMPONENTS BREAKDOWN ─── */}
          <View style={styles.scoreComponentsGrid}>
            <View style={styles.scoreComponentBox}>
              <Text style={styles.scoreCompVal}>92%</Text>
              <Text style={styles.scoreCompLabel}>Completion</Text>
            </View>

            <View style={styles.scoreComponentBox}>
              <Text style={styles.scoreCompVal}>87%</Text>
              <Text style={styles.scoreCompLabel}>Consistency</Text>
            </View>

            <View style={styles.scoreComponentBox}>
              <Text style={styles.scoreCompVal}>84%</Text>
              <Text style={styles.scoreCompLabel}>Timeliness</Text>
            </View>

            <View style={styles.scoreComponentBox}>
              <Text style={styles.scoreCompVal}>89%</Text>
              <Text style={styles.scoreCompLabel}>Stability</Text>
            </View>
          </View>
        </View>

        {/* ─── 7. DATE RANGE SEGMENTED SELECTOR ─── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRangeRow}>
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
            { id: '6m', label: '6 Months' },
            { id: '1y', label: '1 Year' },
            { id: 'custom', label: 'Custom' },
          ].map((range) => (
            <TouchableOpacity
              key={range.id}
              style={[styles.rangeChip, dateRange === range.id && styles.rangeChipActive]}
              onPress={() => {
                setDateRange(range.id as any);
                Toast.show({ type: 'info', text1: 'Analytics Range', text2: `Displaying metrics for ${range.label}` });
              }}
            >
              <Text style={[styles.rangeChipText, dateRange === range.id && styles.rangeChipTextActive]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ─── 8. COMPLETION TREND LINE CHART CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="chart-line" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Routine Completion Trend (30 Days)</Text>
          </View>

          <View style={styles.chartVisualArea}>
            {[
              { label: 'Week 1', pct: 90, status: 'good' },
              { label: 'Week 2', pct: 82, status: 'good' },
              { label: 'Week 3', pct: 91, status: 'good' },
              { label: 'Week 4', pct: 74, status: 'warn' },
            ].map((bar, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.chartCol}
                onPress={() => {
                  setSelectedWeekTooltip(`${bar.label}: ${bar.pct}% Completion`);
                  Toast.show({ type: 'info', text1: bar.label, text2: `${bar.pct}% Overall Routine Completion Rate` });
                }}
              >
                <View style={[styles.chartBarFill, { height: `${bar.pct}%` as any, backgroundColor: bar.status === 'good' ? C.primary : C.warning }]} />
                <Text style={styles.chartDayText}>{bar.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── 10. ACTIVITY PERFORMANCE RANKING CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="format-list-numbered" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Activity Performance Ranking</Text>
          </View>

          <Text style={styles.rankingGroupTitle}>🌟 BEST PERFORMING ACTIVITIES</Text>
          {[
            { name: 'Breakfast Meal', pct: 98, color: C.primary },
            { name: 'Medication Routine', pct: 96, color: C.primary },
            { name: 'Morning Walk', pct: 94, color: C.primary },
          ].map((act, i) => (
            <TouchableOpacity key={i} style={styles.perfRow} onPress={() => onNavigate('routineDetails')}>
              <View style={{ flex: 1 }}>
                <Text style={styles.perfNameText}>{act.name}</Text>
                <View style={styles.perfTrackBg}>
                  <View style={[styles.perfTrackFill, { width: `${act.pct}%` as any, backgroundColor: act.color }]} />
                </View>
              </View>
              <Text style={[styles.perfPctText, { color: act.color }]}>{act.pct}%</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.rankingGroupTitle, { marginTop: 14 }]}>⚠️ ACTIVITIES NEEDING ATTENTION</Text>
          {[
            { name: 'Evening Walk', pct: 68, color: C.warning },
            { name: 'Water Intake Target', pct: 76, color: C.warning },
            { name: 'Sleep Schedule', pct: 79, color: C.warning },
          ].map((act, i) => (
            <TouchableOpacity key={i} style={styles.perfRow} onPress={() => onNavigate('routineDetails')}>
              <View style={{ flex: 1 }}>
                <Text style={styles.perfNameText}>{act.name}</Text>
                <View style={styles.perfTrackBg}>
                  <View style={[styles.perfTrackFill, { width: `${act.pct}%` as any, backgroundColor: act.color }]} />
                </View>
              </View>
              <Text style={[styles.perfPctText, { color: act.color }]}>{act.pct}%</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── 14. TIME-OF-DAY ANALYSIS CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="clock-time-four-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Time-of-Day Adherence Analysis</Text>
          </View>

          <View style={styles.timeGrid}>
            {[
              { slot: 'Morning', pct: 94, sub: '06:00 AM – 12:00 PM', color: C.primary },
              { slot: 'Afternoon', pct: 81, sub: '12:00 PM – 05:00 PM', color: C.primary },
              { slot: 'Evening', pct: 68, sub: '05:00 PM – 09:00 PM', color: C.warning },
              { slot: 'Night', pct: 86, sub: '09:00 PM – 06:00 AM', color: C.primary },
            ].map((t, idx) => (
              <View key={idx} style={styles.timeBox}>
                <Text style={styles.timeSlotTitle}>{t.slot}</Text>
                <Text style={[styles.timePctText, { color: t.color }]}>{t.pct}%</Text>
                <Text style={styles.timeSlotSub}>{t.sub}</Text>
              </View>
            ))}
          </View>

          <View style={styles.patternInsightNotice}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={C.warning} />
            <Text style={styles.patternInsightNoticeText}>
              <Text style={{ fontWeight: '800' }}>Time Pattern Insight:</Text> Most missed activities occurred between 6:00 PM and 9:00 PM (Evening time window).
            </Text>
          </View>
        </View>

        {/* ─── 17. ROUTINE STABILITY & DEVIATIONS CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="axis-arrow" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Routine Stability & Deviation Summary</Text>
          </View>

          <View style={styles.stabilityGrid}>
            <View style={styles.stabilityBox}>
              <Text style={styles.stabilityVal}>89%</Text>
              <Text style={styles.stabilityLabel}>Routine Stability</Text>
              <Text style={styles.stabilitySub}>High Stability Rate</Text>
            </View>

            <View style={styles.stabilityBox}>
              <Text style={[styles.stabilityVal, { color: C.primary }]}>12</Text>
              <Text style={styles.stabilityLabel}>Deviations (This Month)</Text>
              <Text style={styles.stabilitySub}>↓ 33% vs 18 prev month</Text>
            </View>
          </View>
        </View>

        {/* ─── 20. GUARDIAN RISK ENGINE TREND CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="shield-alert-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Guardian Risk Engine Trend</Text>
          </View>

          <View style={styles.riskTrendGrid}>
            {[
              { period: '7 Days', level: 'LOW', bg: C.primaryLight, color: C.primary },
              { period: '14 Days', level: 'LOW', bg: C.primaryLight, color: C.primary },
              { period: '21 Days', level: 'MODERATE', bg: C.warningLight, color: C.warning },
              { period: '30 Days', level: 'LOW', bg: C.primaryLight, color: C.primary },
            ].map((r, i) => (
              <View key={i} style={[styles.riskTrendBox, { backgroundColor: r.bg }]}>
                <Text style={styles.riskTrendPeriod}>{r.period}</Text>
                <Text style={[styles.riskTrendLevel, { color: r.color }]}>{r.level}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.riskExplanationText}>
            • <Text style={{ fontWeight: '800' }}>Recent Risk Pattern:</Text> Routine-related risk has remained low during the selected 30-day period.
          </Text>
        </View>

        {/* ─── 19. KEY STRATEGIC INSIGHTS CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="star-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Key Strategic Insights</Text>
          </View>

          <Text style={styles.insightBullet}>• Routine completion improved <Text style={{ fontWeight: '800', color: C.primary }}>+4% this month</Text>.</Text>
          <Text style={styles.insightBullet}>• Evening activities have the highest missed rate (<Text style={{ fontWeight: '800', color: C.warning }}>68% completion</Text>).</Text>
          <Text style={styles.insightBullet}>• Morning routine remains highly consistent (<Text style={{ fontWeight: '800', color: C.primary }}>94% completion</Text>).</Text>
        </View>

        {/* ─── 23. EXPORT CAREGIVER REPORT PDF CTA ─── */}
        <View style={styles.footerBox}>
          <TouchableOpacity style={styles.exportPdfBtn} onPress={handleExportPDF} activeOpacity={0.85}>
            <MaterialCommunityIcons name="file-pdf-box" size={22} color="#FFF" />
            <Text style={styles.exportPdfBtnText}>Export Caregiver Analytics Report (PDF)</Text>
          </TouchableOpacity>
        </View>

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
    justify.content: 'space-between',
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
  scoreComponentsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
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
  perfTrackBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, width: '100%', overflow: 'hidden' },
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
    justify.content: 'space-around',
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...elevation.e2,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 2 },
  tabLabelActive: { color: C.primary, fontWeight: '800' },
});

export default GuardianRoutineAnalyticsScreen;

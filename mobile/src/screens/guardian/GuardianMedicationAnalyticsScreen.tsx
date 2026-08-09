/**
 * GuardianMedicationAnalyticsScreen.tsx — Screen G50 (Medication Analytics & Adherence Trends)
 * Spec: g50.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, NHS App, Samsung Health
 *
 * Screen Mission: Answers "How consistently has my elder been following their medication schedule, and is that pattern improving or getting worse?"
 *
 * Healthcare Safety Mandate per g50.txt:
 *  - G50 is an ANALYTICS screen analyzing existing medication records.
 *  - Factual metrics without unsupported clinical conclusions or subjective "Good / Bad" judgments.
 *  - Formula Info modal explains: Completed scheduled doses / Total scheduled doses × 100.
 *
 * Component Architecture per g50.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Medication Analytics", Subtitle "Adherence & Trends • G50", Overflow menu).
 *  3. Elder Selector Context (Nimal Perera).
 *  4. Time Range Selector (7 Days, 30 Days default, 90 Days).
 *  5. Primary KPI Adherence Card (92% Adherence, ↑ 4% vs previous period + Info tooltip modal).
 *  6. Adherence Trend Line Chart Card (Interactive tap data points: Date, Scheduled, Completed, Missed).
 *  7. Medication Performance Breakdown List (Morning 96%, Evening 88%, Vitamin 91%).
 *  8. Missed Doses Summary Card (2 missed this period, ↓ 1 vs previous + CTA to Missed Medications G40).
 *  9. Key Trend Statement Card.
 * 10. Data Freshness & Sync Footer (Updated 8:42 AM).
 * 11. Persistent 5-Tab Bottom Navigation Bar.
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
  Modal,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

const C = {
  bg:             '#F8FAFC',
  card:           '#FFFFFF',
  primary:        '#2E7D32',
  primaryLight:   '#E8F5E9',
  warning:        '#F9A825',
  warningLight:   '#FFF8E1',
  orange:         '#E65100',
  orangeLight:    '#FFF3E0',
  error:          '#D32F2F',
  errorLight:     '#FFEBEE',
  info:           '#1565C0',
  infoLight:      '#E3F2FD',
  textPrimary:    '#1E293B',
  textSecondary:  '#64748B',
  textMuted:      '#94A3B8',
  border:         '#E2E8F0',
};

interface GuardianMedicationAnalyticsScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
  token?: string;
  elderId?: string | null;
  onSessionExpired?: () => void;
}

const GuardianMedicationAnalyticsScreen: React.FC<GuardianMedicationAnalyticsScreenProps> = ({
  onBack,
  onNavigate = () => {},
  token,
  elderId,
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(false);
  const [refreshing, setRefreshing]           = useState(false);
  const [dateRange, setDateRange]             = useState<'7d' | '30d' | '90d'>('30d');
  const [showFormulaModal, setShowFormulaModal]= useState(false);
  const [showMoreMenu, setShowMoreMenu]       = useState(false);
  const [selectedPoint, setSelectedPoint]     = useState<{ day: string; rate: number; scheduled: number; completed: number; missed: number } | null>(null);

  const trendData = [
    { day: 'Mon', rate: 90, scheduled: 6, completed: 5, missed: 1 },
    { day: 'Tue', rate: 95, scheduled: 6, completed: 6, missed: 0 },
    { day: 'Wed', rate: 88, scheduled: 8, completed: 7, missed: 1 },
    { day: 'Thu', rate: 94, scheduled: 6, completed: 6, missed: 0 },
    { day: 'Fri', rate: 96, scheduled: 6, completed: 6, missed: 0 },
    { day: 'Sat', rate: 92, scheduled: 6, completed: 5, missed: 1 },
    { day: 'Sun', rate: 92, scheduled: 6, completed: 6, missed: 0 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 4. TOP APP BAR ─── */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
            <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Medication Analytics</Text>
          <Text style={styles.headerSubtitle}>Adherence & Trends • G50</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Medication Analytics Refreshed' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Analytics</Text>
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
        {/* ─── 5. ELDER CONTEXT BANNER ─── */}
        <View style={styles.elderContextBanner}>
          <MaterialCommunityIcons name="account-heart" size={20} color={C.primary} />
          <Text style={styles.elderContextText}>
            Monitoring <Text style={{ fontWeight: '900', color: C.textPrimary }}>Nimal Perera</Text>
          </Text>
        </View>

        {/* ─── 6. TIME RANGE SELECTOR CHIPS ─── */}
        <View style={styles.rangeRow}>
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
          ].map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.rangeChip, dateRange === r.id && styles.rangeChipActive]}
              onPress={() => { setDateRange(r.id as any); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.rangeChipText, dateRange === r.id && styles.rangeChipTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── 7 & 8. PRIMARY KPI ADHERENCE CARD ─── */}
        <View style={styles.heroCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionLabel}>MEDICATION ADHERENCE RATE</Text>
            <TouchableOpacity onPress={() => setShowFormulaModal(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="information-outline" size={18} color={C.info} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroRow}>
            <Text style={styles.heroRateText}>92%</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroMainTitle}>Current Period Adherence</Text>
              <Text style={styles.heroComparisonText}>▲ ↑ 4% compared with previous period (88%)</Text>
            </View>
          </View>
        </View>

        {/* ─── 12 & 13. ADHERENCE TREND LINE CHART CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="chart-line" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Adherence Rate Trend</Text>
          </View>

          {/* Interactive Line Chart Visualizer */}
          <View style={styles.chartContainer}>
            <View style={styles.chartYAxis}>
              <Text style={styles.yAxisLabel}>100%</Text>
              <Text style={styles.yAxisLabel}>90%</Text>
              <Text style={styles.yAxisLabel}>80%</Text>
            </View>

            <View style={styles.chartArea}>
              <View style={styles.chartGridLines}>
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
              </View>

              <View style={styles.barGraphRow}>
                {trendData.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.barCol}
                    onPress={() => { setSelectedPoint(item); Haptics.selectionAsync(); }}
                  >
                    <View style={[styles.chartBar, { height: `${item.rate}%` as any, backgroundColor: item.rate >= 90 ? C.primary : C.warning }]} />
                    <Text style={styles.barLabel}>{item.day}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {selectedPoint && (
            <View style={styles.selectedPointBox}>
              <Text style={styles.selectedPointTitle}>{selectedPoint.day} Breakdown:</Text>
              <Text style={styles.selectedPointSub}>
                {selectedPoint.rate}% Adherence • {selectedPoint.completed} of {selectedPoint.scheduled} doses completed ({selectedPoint.missed} missed)
              </Text>
            </View>
          )}
        </View>

        {/* ─── 16. MEDICATION PERFORMANCE BREAKDOWN ─── */}
        <Text style={styles.sectionHeaderTitle}>Individual Medication Performance</Text>
        <View style={styles.card}>
          {[
            { name: 'Morning Medication (Amlodipine)', rate: 96, missed: 1 },
            { name: 'Evening Medication (Metformin)', rate: 88, missed: 3 },
            { name: 'Vitamin D3 Supplement', rate: 91, missed: 1 },
          ].map((m, i) => (
            <TouchableOpacity key={i} style={styles.medPerfRow} onPress={() => onNavigate('medicationDetails')}>
              <View style={{ flex: 1 }}>
                <Text style={styles.medPerfName}>{m.name}</Text>
                <Text style={styles.medPerfSub}>{m.rate}% adherence • {m.missed} missed dose{m.missed > 1 ? 's' : ''}</Text>
              </View>
              <Text style={[styles.medPerfPct, { color: m.rate >= 90 ? C.primary : C.warning }]}>{m.rate}%</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── 19. MISSED DOSES SUMMARY CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="pill-off" size={20} color={C.error} />
            <Text style={styles.cardHeaderTitle}>Missed Doses Summary</Text>
          </View>

          <View style={styles.missedSummaryRow}>
            <Text style={styles.missedNumText}>2</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.missedMainText}>Missed doses this period</Text>
              <Text style={styles.missedSubText}>↓ 1 dose less than previous period (3 missed)</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.missedCtaBtn} onPress={() => onNavigate('missedMedication')}>
            <Text style={styles.missedCtaBtnText}>View Missed Medications Exception Center (G40) →</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 21. KEY TREND STATEMENT CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Key Adherence Insights</Text>
          </View>
          <Text style={styles.trendStatementText}>
            • Medication adherence improved by <Text style={{ fontWeight: '800', color: C.primary }}>4%</Text> compared with the previous period.
          </Text>
          <Text style={[styles.trendStatementText, { marginTop: 6 }]}>
            • Evening Medication adherence decreased slightly to 88% due to late dose confirmations.
          </Text>
        </View>

        {/* ─── 29. DATA FRESHNESS & SYNC FOOTER ─── */}
        <View style={styles.syncFooter}>
          <MaterialCommunityIcons name="sync" size={14} color={C.textMuted} />
          <Text style={styles.syncFooterText}>✓ Medication data updated Today at 8:42 AM</Text>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ─── 8. FORMULA INFO MODAL ─── */}
      <Modal visible={showFormulaModal} transparent animationType="fade" onRequestClose={() => setShowFormulaModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFormulaModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="information" size={24} color={C.info} />
              <Text style={styles.modalTitle}>Adherence Calculation</Text>
            </View>

            <Text style={styles.modalBodyText}>
              Medication Adherence is calculated as the percentage of scheduled medication events recorded as completed during the selected period.
            </Text>
            <Text style={[styles.modalBodyText, { fontWeight: '800', marginTop: 8, color: C.textPrimary }]}>
              Formula: (Completed Doses / Total Scheduled Doses) × 100
            </Text>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowFormulaModal(false)}>
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
  heroRateText: { fontSize: 38, fontWeight: '900', color: C.primary },
  heroMainTitle: { fontSize: 14, fontWeight: '800', color: C.textPrimary },
  heroComparisonText: { fontSize: 11, fontWeight: '700', color: C.primary, marginTop: 2 },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  chartContainer: { flexDirection: 'row', height: 110, alignItems: 'flex-end', marginTop: 10 },
  chartYAxis: { justifyContent: 'space-between', height: '100%', paddingRight: 8 },
  yAxisLabel: { fontSize: 9, color: C.textMuted, fontWeight: '700' },
  chartArea: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  chartGridLines: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'space-between' },
  gridLine: { height: 1, backgroundColor: '#F1F5F9' },
  barGraphRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', paddingHorizontal: 4 },
  barCol: { alignItems: 'center', width: 22 },
  chartBar: { width: 12, borderRadius: 6 },
  barLabel: { fontSize: 9, color: C.textMuted, marginTop: 4, fontWeight: '700' },
  selectedPointBox: { backgroundColor: C.bg, borderRadius: 12, padding: 10, marginTop: 10, borderWidth: 1, borderColor: C.border },
  selectedPointTitle: { fontSize: 11, fontWeight: '800', color: C.textPrimary },
  selectedPointSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  medPerfRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  medPerfName: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  medPerfSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  medPerfPct: { fontSize: 14, fontWeight: '900' },
  missedSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 6 },
  missedNumText: { fontSize: 32, fontWeight: '900', color: C.error },
  missedMainText: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  missedSubText: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  missedCtaBtn: { marginTop: 8, paddingTop: 6 },
  missedCtaBtnText: { fontSize: 11, fontWeight: '900', color: C.primary },
  trendStatementText: { fontSize: 13, color: C.textSecondary, lineHeight: 18 },
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
    justify.content: 'space-around',
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...elevation.e2,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 2 },
  tabLabelActive: { color: C.primary, fontWeight: '800' },
});

export default GuardianMedicationAnalyticsScreen;

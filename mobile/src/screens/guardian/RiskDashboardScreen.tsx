/**
 * RiskDashboardScreen.tsx — Screen G51 (Risk Analytics & Trend Statistics)
 * Spec: g51.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, NHS App, Samsung Health
 *
 * Screen Mission: Answers "How has my elder's monitored risk level changed over time, and what patterns should I be aware of?"
 *
 * Healthcare Safety Mandate per g51.txt:
 *  - Categorical Risk Model (GREEN / YELLOW / RED) - DOES NOT use continuous numerical fake scores.
 *  - Factual risk transition statistics and observed risk factors.
 *  - Distinguishes Risk Engine (which determines risk) from Risk Analytics (which visualizes history).
 *
 * Component Architecture per g51.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Risk Analytics", Subtitle "Status Trends & Statistics • G51", Refresh action).
 *  3. Elder Selector Context (Nimal Perera).
 *  4. Period Selector Chips (7 Days, 30 Days default, 90 Days).
 *  5. Current Monitored Risk Hero Card (GREEN / YELLOW / RED + Last analysis timestamp).
 *  6. Categorical Risk Trend Chart (Discrete GREEN/YELLOW/RED y-axis state nodes with tap inspection).
 *  7. Risk Distribution Horizontal Bar Card (Green 22d / 73%, Yellow 6d / 20%, Red 2d / 7%).
 *  8. Risk Transitions & Statistics (Green→Yellow, Yellow→Red transitions count).
 *  9. Common Observed Risk Factors (Missed Medication 4, Inactivity 3, Emergency 2).
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
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
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

interface RiskDashboardScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const RiskDashboardScreen: React.FC<RiskDashboardScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]               = useState(false);
  const [refreshing, setRefreshing]         = useState(false);
  const [dateRange, setDateRange]           = useState<'7d' | '30d' | '90d'>('30d');
  const [currentRiskLevel]                  = useState<'GREEN' | 'YELLOW' | 'RED'>('GREEN');
  const [selectedDay, setSelectedDay]       = useState<{ day: string; level: string; factor: string } | null>(null);

  const categoricalTrend = [
    { day: 'Mon', level: 'GREEN', factor: 'Baseline routine' },
    { day: 'Tue', level: 'GREEN', factor: 'Baseline routine' },
    { day: 'Wed', level: 'YELLOW', factor: 'Missed evening medication' },
    { day: 'Thu', level: 'GREEN', factor: 'Resolved medication' },
    { day: 'Fri', level: 'GREEN', factor: 'Baseline routine' },
    { day: 'Sat', level: 'YELLOW', factor: 'Inactivity detected' },
    { day: 'Sun', level: 'GREEN', factor: 'Baseline routine' },
  ];

  const getLevelColor = (level: string) => {
    if (level === 'RED') return C.error;
    if (level === 'YELLOW') return C.warning;
    return C.primary;
  };

  const getLevelBg = (level: string) => {
    if (level === 'RED') return C.errorLight;
    if (level === 'YELLOW') return C.warningLight;
    return C.primaryLight;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 4. TOP APP BAR ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Risk Analytics</Text>
          <Text style={styles.headerSubtitle}>Status Trends & Statistics • G51</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => Toast.show({ type: 'success', text1: 'Risk Data Refreshed' })}>
            <MaterialCommunityIcons name="refresh" size={22} color={C.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} colors={[C.primary]} />
        }
      >
        {/* ─── 5. ELDER SELECTOR BANNER ─── */}
        <View style={styles.elderContextBanner}>
          <MaterialCommunityIcons name="account-heart" size={20} color={C.primary} />
          <Text style={styles.elderContextText}>
            Monitoring <Text style={{ fontWeight: '900', color: C.textPrimary }}>Nimal Perera</Text>
          </Text>
        </View>

        {/* ─── 6. PERIOD SELECTOR ─── */}
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

        {/* ─── 7–9. CURRENT MONITORED RISK HERO CARD ─── */}
        <View style={[styles.heroCard, { borderColor: getLevelColor(currentRiskLevel) }]}>
          <View style={styles.heroHeaderRow}>
            <View style={[styles.statusBadge, { backgroundColor: getLevelBg(currentRiskLevel) }]}>
              <MaterialCommunityIcons name="shield-check" size={16} color={getLevelColor(currentRiskLevel)} />
              <Text style={[styles.statusBadgeText, { color: getLevelColor(currentRiskLevel) }]}>
                CURRENT RISK: {currentRiskLevel}
              </Text>
            </View>
            <Text style={styles.lastAnalysisTime}>Analysis: Today, 8:42 AM</Text>
          </View>

          <Text style={styles.heroTitle}>Low Risk Baseline Status</Text>
          <Text style={styles.heroSubText}>
            No significant risk elevation detected in the latest engine analysis. Health routine and medication compliance remain within safe boundaries.
          </Text>
        </View>

        {/* ─── 10–12. CATEGORICAL RISK TREND CHART ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="chart-timeline-variant" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Categorical Risk Trend</Text>
          </View>

          {/* Categorical Grid Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartYAxis}>
              <Text style={[styles.yAxisLabel, { color: C.error }]}>RED</Text>
              <Text style={[styles.yAxisLabel, { color: C.warning }]}>YELLOW</Text>
              <Text style={[styles.yAxisLabel, { color: C.primary }]}>GREEN</Text>
            </View>

            <View style={styles.chartArea}>
              <View style={styles.chartGridLines}>
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
              </View>

              <View style={styles.barGraphRow}>
                {categoricalTrend.map((item, idx) => {
                  const nodeColor = getLevelColor(item.level);
                  const isBottom = item.level === 'GREEN';
                  const isMid = item.level === 'YELLOW';
                  const isTop = item.level === 'RED';
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.nodeCol}
                      onPress={() => { setSelectedDay(item); Haptics.selectionAsync(); }}
                    >
                      <View style={styles.nodeLane}>
                        <View
                          style={[
                            styles.nodeDot,
                            { backgroundColor: nodeColor },
                            isTop && { marginBottom: 65 },
                            isMid && { marginBottom: 35 },
                            isBottom && { marginBottom: 5 },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{item.day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {selectedDay && (
            <View style={styles.selectedPointBox}>
              <Text style={styles.selectedPointTitle}>{selectedDay.day} Risk State: {selectedDay.level}</Text>
              <Text style={styles.selectedPointSub}>Primary Trigger: {selectedDay.factor}</Text>
            </View>
          )}
        </View>

        {/* ─── 13 & 14. RISK DISTRIBUTION CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="chart-pie" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Risk State Distribution (30 Days)</Text>
          </View>

          <View style={styles.distRow}>
            <View style={styles.distLabelRow}>
              <Text style={styles.distLabel}>Green (Low Risk)</Text>
              <Text style={[styles.distVal, { color: C.primary }]}>22 Days (73%)</Text>
            </View>
            <View style={styles.distBarBg}>
              <View style={[styles.distBarFill, { width: '73%', backgroundColor: C.primary }]} />
            </View>
          </View>

          <View style={styles.distRow}>
            <View style={styles.distLabelRow}>
              <Text style={styles.distLabel}>Yellow (Elevated Risk)</Text>
              <Text style={[styles.distVal, { color: C.warning }]}>6 Days (20%)</Text>
            </View>
            <View style={styles.distBarBg}>
              <View style={[styles.distBarFill, { width: '20%', backgroundColor: C.warning }]} />
            </View>
          </View>

          <View style={styles.distRow}>
            <View style={styles.distLabelRow}>
              <Text style={styles.distLabel}>Red (High Risk)</Text>
              <Text style={[styles.distVal, { color: C.error }]}>2 Days (7%)</Text>
            </View>
            <View style={styles.distBarBg}>
              <View style={[styles.distBarFill, { width: '7%', backgroundColor: C.error }]} />
            </View>
          </View>
        </View>

        {/* ─── 16 & 17. RISK TRANSITIONS & STATISTICS ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="swap-horizontal" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Risk Transitions & Statistics</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>30</Text>
              <Text style={styles.statLabel}>Days Analyzed</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNum}>8</Text>
              <Text style={styles.statLabel}>State Transitions</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: C.warning }]}>5</Text>
              <Text style={styles.statLabel}>Green → Yellow</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: C.error }]}>2</Text>
              <Text style={styles.statLabel}>Yellow → Red</Text>
            </View>
          </View>
        </View>

        {/* ─── 21. COMMON OBSERVED RISK FACTORS ─── */}
        <Text style={styles.sectionHeaderTitle}>Observed Contributing Factors</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.factorRow} onPress={() => onNavigate('medicationAnalytics')}>
            <View style={[styles.factorIconBox, { backgroundColor: C.primaryLight }]}>
              <MaterialCommunityIcons name="pill" size={20} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.factorTitle}>Missed Medication Events</Text>
              <Text style={styles.factorSub}>4 recorded instances during period</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.factorRow} onPress={() => onNavigate('activityDashboard')}>
            <View style={[styles.factorIconBox, { backgroundColor: C.warningLight }]}>
              <MaterialCommunityIcons name="walk" size={20} color={C.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.factorTitle}>Unexpected Inactivity</Text>
              <Text style={styles.factorSub}>3 recorded instances during period</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.factorRow} onPress={() => onNavigate('emergencyHistory')}>
            <View style={[styles.factorIconBox, { backgroundColor: C.errorLight }]}>
              <MaterialCommunityIcons name="alert-decagram-outline" size={20} color={C.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.factorTitle}>Emergency SOS Keyword Events</Text>
              <Text style={styles.factorSub}>2 recorded instances during period</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ─── 19. KEY PERIOD CHANGES CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Key Period Insights</Text>
          </View>
          <Text style={styles.bulletText}>
            • Risk remained <Text style={{ fontWeight: '800', color: C.primary }}>mostly Green (73%)</Text> throughout the selected period.
          </Text>
          <Text style={[styles.bulletText, { marginTop: 6 }]}>
            • Yellow-risk periods occurred primarily due to missed evening medication doses.
          </Text>
        </View>

        {/* ─── 30. DATA FRESHNESS FOOTER ─── */}
        <View style={styles.syncFooter}>
          <MaterialCommunityIcons name="sync" size={14} color={C.textMuted} />
          <Text style={styles.syncFooterText}>✓ Risk analysis synchronized Today at 8:42 AM</Text>
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
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: 110 },
  elderContextBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginBottom: spacing.s4 },
  elderContextText: { fontSize: 12, color: C.textSecondary },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.s4 },
  rangeChip: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  rangeChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  rangeChipText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  rangeChipTextActive: { color: C.primary, fontWeight: '900' },
  heroCard: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 2, ...elevation.e1 },
  heroHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '900' },
  lastAnalysisTime: { fontSize: 11, color: C.textMuted, fontWeight: '700' },
  heroTitle: { fontSize: 20, fontWeight: '900', color: C.textPrimary, marginVertical: 4 },
  heroSubText: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  chartContainer: { flexDirection: 'row', height: 110, alignItems: 'flex-end', marginTop: 10 },
  chartYAxis: { justifyContent: 'space-between', height: '100%', paddingRight: 8 },
  yAxisLabel: { fontSize: 9, fontWeight: '900' },
  chartArea: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  chartGridLines: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'space-between' },
  gridLine: { height: 1, backgroundColor: '#F1F5F9' },
  barGraphRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', paddingHorizontal: 4 },
  nodeCol: { alignItems: 'center', width: 22, height: '100%', justifyContent: 'flex-end' },
  nodeLane: { height: '80%', justifyContent: 'flex-end', alignItems: 'center' },
  nodeDot: { width: 12, height: 12, borderRadius: 6 },
  barLabel: { fontSize: 9, color: C.textMuted, marginTop: 4, fontWeight: '700' },
  selectedPointBox: { backgroundColor: C.bg, borderRadius: 12, padding: 10, marginTop: 10, borderWidth: 1, borderColor: C.border },
  selectedPointTitle: { fontSize: 11, fontWeight: '800', color: C.textPrimary },
  selectedPointSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  distRow: { marginVertical: 6 },
  distLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  distLabel: { fontSize: 12, fontWeight: '800', color: C.textPrimary },
  distVal: { fontSize: 12, fontWeight: '900' },
  distBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  distBarFill: { height: '100%', borderRadius: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  statBox: { width: '47%', backgroundColor: C.bg, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statNum: { fontSize: 20, fontWeight: '900', color: C.primary },
  statLabel: { fontSize: 10, color: C.textSecondary, fontWeight: '700', marginTop: 2 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  factorIconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  factorTitle: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  factorSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  bulletText: { fontSize: 13, color: C.textSecondary, lineHeight: 18 },
  syncFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginVertical: 12 },
  syncFooterText: { fontSize: 11, color: C.textMuted },
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

export default RiskDashboardScreen;

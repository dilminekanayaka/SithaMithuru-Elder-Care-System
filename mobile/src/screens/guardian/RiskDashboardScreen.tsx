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
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

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

interface RiskFactors {
  missedMedsCount: number;
  totalMedsCount: number;
  missedTasksCount: number;
  totalTasksCount: number;
  sadMoodCount: number;
  sosCount: number;
  totalLoggedActivities: number;
  isInactive: boolean;
}

interface RiskProfile {
  score: number;
  category: 'Low' | 'Medium' | 'High';
  factors: RiskFactors;
  recommendations: string[];
}

interface RiskDashboardScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

const CATEGORY_LEVEL: Record<string, 'GREEN' | 'YELLOW' | 'RED'> = {
  Low: 'GREEN',
  Medium: 'YELLOW',
  High: 'RED',
};

const RiskDashboardScreen: React.FC<RiskDashboardScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState<string | null>(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [profile, setProfile]         = useState<RiskProfile | null>(null);
  const [elderName, setElderName]     = useState('your elder');

  const loadData = useCallback(async () => {
    if (!elderId) {
      setLoadError('No elder selected.');
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      const [riskRes, elderRes] = await Promise.all([
        apiFetch(`/guardian/risk-profile/${elderId}`, token),
        apiFetch(`/guardian/elders/${elderId}`, token),
      ]);
      setProfile(riskRes || null);
      if (elderRes) setElderName(elderRes.name || 'your elder');
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load risk analysis. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentRiskLevel = profile ? CATEGORY_LEVEL[profile.category] : 'GREEN';

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
          <TouchableOpacity style={styles.iconBtn} onPress={() => { setRefreshing(true); loadData(); }}>
            <MaterialCommunityIcons name="refresh" size={22} color={C.primary} />
          </TouchableOpacity>
        </View>
      </View>

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

        {!loading && !loadError && profile && (
          <>
            {/* ─── ELDER SELECTOR BANNER ─── */}
            <View style={styles.elderContextBanner}>
              <MaterialCommunityIcons name="account-heart" size={20} color={C.primary} />
              <Text style={styles.elderContextText}>
                Monitoring <Text style={{ fontWeight: '900', color: C.textPrimary }}>{elderName}</Text>
              </Text>
            </View>

            {/* ─── CURRENT MONITORED RISK HERO CARD ─── */}
            <View style={[styles.heroCard, { borderColor: getLevelColor(currentRiskLevel) }]}>
              <View style={styles.heroHeaderRow}>
                <View style={[styles.statusBadge, { backgroundColor: getLevelBg(currentRiskLevel) }]}>
                  <MaterialCommunityIcons name="shield-check" size={16} color={getLevelColor(currentRiskLevel)} />
                  <Text style={[styles.statusBadgeText, { color: getLevelColor(currentRiskLevel) }]}>
                    CURRENT RISK: {profile.category.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.lastAnalysisTime}>Score: {profile.score}/100</Text>
              </View>

              <Text style={styles.heroTitle}>
                {profile.category === 'Low' ? 'Low Risk Baseline Status' : profile.category === 'Medium' ? 'Elevated Risk Detected' : 'High Risk — Attention Needed'}
              </Text>
              <Text style={styles.heroSubText}>
                Based on the last 7 days of medication, task, mood, and emergency activity for this elder.
              </Text>
            </View>

            {/* ─── OBSERVED CONTRIBUTING FACTORS (last 7 days, real) ─── */}
            <Text style={styles.sectionHeaderTitle}>Observed Contributing Factors (Last 7 Days)</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.factorRow} onPress={() => onNavigate('medicationAnalytics')}>
                <View style={[styles.factorIconBox, { backgroundColor: C.primaryLight }]}>
                  <MaterialCommunityIcons name="pill" size={20} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.factorTitle}>Missed Medication Doses</Text>
                  <Text style={styles.factorSub}>{profile.factors.missedMedsCount} of {profile.factors.totalMedsCount} scheduled doses missed</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.factorRow} onPress={() => onNavigate('routineHistory')}>
                <View style={[styles.factorIconBox, { backgroundColor: C.warningLight }]}>
                  <MaterialCommunityIcons name="clipboard-text-off-outline" size={20} color={C.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.factorTitle}>Missed Daily Tasks</Text>
                  <Text style={styles.factorSub}>{profile.factors.missedTasksCount} of {profile.factors.totalTasksCount} scheduled tasks missed</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.factorRow} onPress={() => onNavigate('wellbeingHistory')}>
                <View style={[styles.factorIconBox, { backgroundColor: C.infoLight }]}>
                  <MaterialCommunityIcons name="emoticon-sad-outline" size={20} color={C.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.factorTitle}>Low Mood Check-ins</Text>
                  <Text style={styles.factorSub}>{profile.factors.sadMoodCount} Sad/Angry/Anxious check-ins recorded</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.factorRow} onPress={() => onNavigate('emergencyAlerts')}>
                <View style={[styles.factorIconBox, { backgroundColor: C.errorLight }]}>
                  <MaterialCommunityIcons name="alert-decagram-outline" size={20} color={C.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.factorTitle}>Emergency SOS Events</Text>
                  <Text style={styles.factorSub}>{profile.factors.sosCount} SOS event{profile.factors.sosCount === 1 ? '' : 's'} triggered</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
              </TouchableOpacity>

              {profile.factors.isInactive && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.factorRow}>
                    <View style={[styles.factorIconBox, { backgroundColor: C.errorLight }]}>
                      <MaterialCommunityIcons name="sleep" size={20} color={C.error} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.factorTitle}>No Activity Detected</Text>
                      <Text style={styles.factorSub}>Zero medication, task, or mood logs in the last 7 days</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* ─── KEY RECOMMENDATIONS CARD (real, from risk engine) ─── */}
            {profile.recommendations.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={C.primary} />
                  <Text style={styles.cardHeaderTitle}>Recommendations</Text>
                </View>
                {profile.recommendations.map((rec, idx) => (
                  <Text key={idx} style={[styles.bulletText, idx > 0 && { marginTop: 6 }]}>• {rec}</Text>
                ))}
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
  gridLine: { height: 1, backgroundColor: colors.surfaceVariant },
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
  distBarBg: { height: 8, backgroundColor: colors.surfaceVariant, borderRadius: 4, overflow: 'hidden' },
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
  divider: { height: 1, backgroundColor: colors.surfaceVariant },
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
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...elevation.e2,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 2 },
  tabLabelActive: { color: C.primary, fontWeight: '800' },
});

export default RiskDashboardScreen;

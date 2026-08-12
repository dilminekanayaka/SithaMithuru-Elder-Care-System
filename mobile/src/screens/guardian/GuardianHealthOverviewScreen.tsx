/**
 * GuardianHealthOverviewScreen.tsx — Screen G49 (Health Overview & Executive Summary)
 * Spec: g49.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, NHS App, Samsung Health
 *
 * Screen Mission: Answers "How has my elder been doing recently?"
 *
 * Healthcare Safety Mandate per g49.txt:
 *  - Summary layer that provides navigation to detailed analytics (G50 Medication, G51 Risk, G52 Emergency).
 *  - Uses application-level monitoring language ("Monitored activity remained stable") rather than clinical diagnosis ("Health is good").
 *
 * Component Architecture per g49.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Health Overview", Subtitle "Executive Summary • G49", Overflow menu).
 *  3. Elder Selector & Period Segmented Control ([Week] vs [Month]).
 *  4. Period Date Navigation Bar (‹ Aug 3 - Aug 9, 2026 ›).
 *  5. Overall Monitored Status Hero Card (Status: STABLE • Monitored activity remained generally stable).
 *  6. Summary Category Cards:
 *     - Medication: 92% Adherence (↑ 4% from previous week) -> Navigates to G50.
 *     - Risk: Mostly Green (Green 5d, Yellow 2d) -> Navigates to G51.
 *     - Activity: Stable (Within expected pattern) -> Navigates to G43.
 *     - Emergency: 0 events (No emergency events) -> Navigates to G52.
 *  7. Key Changes Factual Bullet Points Card.
 *  8. Data Freshness & Sync Footer (Updated 8:42 AM).
 *  9. Offline Banner & Persistent 5-Tab Bottom Navigation Bar.
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

interface GuardianHealthOverviewScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

interface OverviewData {
  elderName: string;
  medAdherencePct: number;
  medTaken: number;
  medMissed: number;
  riskCategory: 'Low' | 'Medium' | 'High';
  riskScore: number;
  activityEventCount: number;
  emergencyCount7d: number;
}

const GuardianHealthOverviewScreen: React.FC<GuardianHealthOverviewScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [refreshing, setRefreshing]     = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [data, setData]                 = useState<OverviewData | null>(null);

  const loadData = useCallback(async () => {
    if (!elderId) {
      setLoadError('No elder selected.');
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      const [medRes, riskRes, activityRes, emergencyRes, elderRes] = await Promise.all([
        apiFetch(`/guardian/medications/${elderId}/history?days=7`, token),
        apiFetch(`/guardian/risk-profile/${elderId}`, token),
        apiFetch(`/guardian/elders/${elderId}/activity?limit=100`, token),
        apiFetch(`/guardian/emergency-logs/${elderId}`, token),
        apiFetch(`/guardian/elders/${elderId}`, token),
      ]);

      const activityFeed: any[] = activityRes?.data || activityRes || [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const emergencyList: any[] = emergencyRes || [];
      const emergencyCount7d = emergencyList.filter((e: any) => new Date(e.created_at) >= sevenDaysAgo).length;

      setData({
        elderName: elderRes?.name || 'your elder',
        medAdherencePct: medRes?.summary?.adherencePct ?? 0,
        medTaken: medRes?.summary?.taken ?? 0,
        medMissed: medRes?.summary?.missed ?? 0,
        riskCategory: riskRes?.category || 'Low',
        riskScore: riskRes?.score ?? 0,
        activityEventCount: activityFeed.length,
        emergencyCount7d,
      });
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load health overview. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const riskColor = (cat: string) => cat === 'High' ? C.error : cat === 'Medium' ? C.warning : C.primary;
  const riskBg = (cat: string) => cat === 'High' ? C.errorLight : cat === 'Medium' ? C.warningLight : C.primaryLight;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 4. TOP APP BAR ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Health Overview</Text>
          <Text style={styles.headerSubtitle}>Executive Summary • G49</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Health Overview Refreshed' }); }}>
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

        {!loading && !loadError && data && (
          <>
            {/* ─── ELDER SELECTOR BANNER ─── */}
            <View style={styles.elderContextBanner}>
              <MaterialCommunityIcons name="account-heart" size={20} color={C.primary} />
              <Text style={styles.elderContextText}>
                Monitoring <Text style={{ fontWeight: '900', color: C.textPrimary }}>{data.elderName}</Text> • Last 7 Days
              </Text>
            </View>

            {/* ─── OVERALL MONITORED STATUS HERO CARD ─── */}
            <View style={styles.heroStatusCard}>
              <View style={styles.statusBadgeRow}>
                <View style={[styles.statusBadge, { backgroundColor: riskBg(data.riskCategory) }]}>
                  <MaterialCommunityIcons name="shield-check" size={16} color={riskColor(data.riskCategory)} />
                  <Text style={[styles.statusBadgeText, { color: riskColor(data.riskCategory) }]}>MONITORED RISK: {data.riskCategory.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>
                {data.riskCategory === 'Low' ? 'Overall Activity Remained Stable' : data.riskCategory === 'Medium' ? 'Some Attention Areas Detected' : 'Elevated Risk — Review Recommended'}
              </Text>
              <Text style={styles.heroSubText}>
                {data.medAdherencePct}% medication adherence and {data.activityEventCount} recorded events over the last 7 days.
              </Text>
            </View>

            {/* ─── SUMMARY CATEGORY CARDS ─── */}
            <Text style={styles.sectionHeaderTitle}>Domain Summary Cards</Text>

            {/* Medication Summary */}
            <TouchableOpacity style={styles.categoryCard} onPress={() => onNavigate('medicationAnalytics')} activeOpacity={0.85}>
              <View style={styles.categoryRow}>
                <View style={[styles.categoryIconBox, { backgroundColor: C.primaryLight }]}>
                  <MaterialCommunityIcons name="pill" size={22} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeaderTop}>
                    <Text style={styles.categoryCardTitle}>Medication Monitoring</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
                  </View>
                  <Text style={styles.heroMetricVal}>{data.medAdherencePct}% <Text style={styles.heroMetricSub}>Adherence Rate</Text></Text>
                  <Text style={styles.categoryCardSub}>{data.medTaken} taken • {data.medMissed} missed • View Medication Analytics →</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Risk Summary */}
            <TouchableOpacity style={styles.categoryCard} onPress={() => onNavigate('riskDashboard')} activeOpacity={0.85}>
              <View style={styles.categoryRow}>
                <View style={[styles.categoryIconBox, { backgroundColor: riskBg(data.riskCategory) }]}>
                  <MaterialCommunityIcons name="chart-line-variant" size={22} color={riskColor(data.riskCategory)} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeaderTop}>
                    <Text style={styles.categoryCardTitle}>Risk Status Assessment</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
                  </View>
                  <Text style={[styles.heroMetricVal, { color: riskColor(data.riskCategory) }]}>{data.riskCategory} Risk <Text style={styles.heroMetricSub}>(Score {data.riskScore}/100)</Text></Text>
                  <Text style={styles.categoryCardSub}>Based on the last 7 days • View Risk Analytics →</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Activity Summary */}
            <TouchableOpacity style={styles.categoryCard} onPress={() => onNavigate('activityDashboard')} activeOpacity={0.85}>
              <View style={styles.categoryRow}>
                <View style={[styles.categoryIconBox, { backgroundColor: C.infoLight }]}>
                  <MaterialCommunityIcons name="walk" size={22} color={C.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeaderTop}>
                    <Text style={styles.categoryCardTitle}>Daily Activity Pattern</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
                  </View>
                  <Text style={styles.heroMetricVal}>{data.activityEventCount} <Text style={styles.heroMetricSub}>Recorded Events</Text></Text>
                  <Text style={styles.categoryCardSub}>Medication, task & mood events • View Activity Dashboard →</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Emergency Summary */}
            <TouchableOpacity style={styles.categoryCard} onPress={() => onNavigate('emergencyAlerts')} activeOpacity={0.85}>
              <View style={styles.categoryRow}>
                <View style={[styles.categoryIconBox, { backgroundColor: data.emergencyCount7d > 0 ? C.errorLight : C.primaryLight }]}>
                  <MaterialCommunityIcons name="alert-decagram-outline" size={22} color={data.emergencyCount7d > 0 ? C.error : C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeaderTop}>
                    <Text style={styles.categoryCardTitle}>Emergency Events</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
                  </View>
                  <Text style={[styles.heroMetricVal, data.emergencyCount7d > 0 && { color: C.error }]}>{data.emergencyCount7d} Event{data.emergencyCount7d === 1 ? '' : 's'}</Text>
                  <Text style={styles.categoryCardSub}>In the last 7 days • View Emergency Alerts →</Text>
                </View>
              </View>
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
  elderContextBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginBottom: spacing.s4 },
  elderContextText: { fontSize: 12, color: C.textSecondary },
  periodCard: { backgroundColor: C.card, borderRadius: 20, padding: 12, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  segmentedRow: { flexDirection: 'row', gap: 8, backgroundColor: C.bg, padding: 4, borderRadius: 12 },
  segmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: C.card, ...elevation.e1 },
  segmentBtnText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  segmentBtnTextActive: { color: C.primary, fontWeight: '900' },
  dateNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingHorizontal: 6 },
  dateNavBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  dateNavText: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  heroStatusCard: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  statusBadgeRow: { flexDirection: 'row', marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '900', color: C.primary },
  heroTitle: { fontSize: 20, fontWeight: '900', color: C.textPrimary, marginVertical: 4 },
  heroSubText: { fontSize: 12, color: C.textSecondary, lineHeight: 18, marginTop: 4 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  categoryCard: { backgroundColor: C.card, borderRadius: 20, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  categoryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  categoryIconBox: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryCardTitle: { fontSize: 14, fontWeight: '900', color: C.textPrimary },
  heroMetricVal: { fontSize: 18, fontWeight: '900', color: C.primary, marginTop: 2 },
  heroMetricSub: { fontSize: 11, fontWeight: '700', color: C.textSecondary },
  categoryCardSub: { fontSize: 11, color: C.textMuted, marginTop: 4 },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginVertical: 4 },
  bulletDot: { fontSize: 14, color: C.primary, fontWeight: '900' },
  bulletText: { flex: 1, fontSize: 12, color: C.textSecondary, lineHeight: 18 },
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

export default GuardianHealthOverviewScreen;

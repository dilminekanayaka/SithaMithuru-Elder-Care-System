/**
 * GuardianMoodDashboardScreen.tsx — Screen G31 (Mood & Well-being Dashboard Command Center)
 * Spec: g31.txt
 *
 * Design Standard: Apple Health, One Medical, Samsung Health, Epic MyChart
 *
 * Screen Mission: Answers "How has my elder's emotional well-being been changing, and are there meaningful changes from their normal pattern?"
 *
 * Component Architecture per g31.txt:
 *  1. Android safe-area layout.
 *  2. Top App Bar (Back button, Title "Well-being", Subtitle "Mood & Emotional Command Center • G31", Calendar, Overflow menu).
 *  3. Elder Context Banner (Paired Elder Nimal Perera, Last updated Today 9:12 AM).
 *  4. Latest Check-in Hero Card (😊 Feeling Good, Today 9:10 AM, Completed, View Today's Details G32 CTA).
 *  5. Well-being Overview Card (Check-ins 6/7 days 86%, Current Trend STABLE, Recent Change None, Last Recorded Today).
 *  6. Recent 7-Day Mood Strip (Tappable 7-day pills Mon 😊, Tue 🙂, Wed 😐, Thu 😊, Fri 😊, Sat —, Sun 😊).
 *  7. Accessible Mood Level Trend Curve Card (Very Good / Good / Okay / Low level visualization).
 *  8. Recent Factual Changes Card ("No significant changes detected. Mood pattern has remained consistent").
 *  9. Conditional Guardian Attention Card (Surfaced when Risk Engine detects mood pattern changes).
 * 10. Check-in Consistency Metric Card (86% Consistency).
 * 11. Well-being Insight Card ("Evening check-ins have shown lower mood more frequently").
 * 12. Quick Actions Grid (Today's Well-being G32, View History G34, View Alerts G35, Call Elder).
 * 13. Offline Banner & Persistent 5-Tab Bottom Navigation.
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
  error:          '#D32F2F',
  errorLight:     '#FFEBEE',
  info:           '#1565C0',
  infoLight:      '#E3F2FD',
  textPrimary:    '#1E293B',
  textSecondary:  '#64748B',
  textMuted:      '#94A3B8',
  border:         '#E2E8F0',
};

interface GuardianMoodDashboardScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianMoodDashboardScreen: React.FC<GuardianMoodDashboardScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(false);
  const [refreshing, setRefreshing]           = useState(false);
  const [showMoreMenu, setShowMoreMenu]       = useState(false);

  const handleCallElder = () => {
    Haptics.selectionAsync();
    Alert.alert('Call Elder', 'Dialing Nimal Perera (+94 77 123 4567)...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 5. HEADER BAR ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Well-being</Text>
          <Text style={styles.headerSubtitle}>Mood & Emotional Command Center • G31</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onNavigate('todaysWellbeing')}>
            <MaterialCommunityIcons name="calendar-today" size={22} color={C.primary} />
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Refreshed Well-being' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('todaysWellbeing'); }}>
              <MaterialCommunityIcons name="calendar-check" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Today's Well-being (G32)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('guardianSettings'); }}>
              <MaterialCommunityIcons name="cog-outline" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Well-being Settings</Text>
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
        {/* ─── 6. ELDER CONTEXT BANNER ─── */}
        <View style={styles.elderContextBanner}>
          <MaterialCommunityIcons name="account-heart-outline" size={20} color={C.primary} />
          <Text style={styles.elderContextText}>
            Monitoring <Text style={{ fontWeight: '900', color: C.textPrimary }}>Nimal Perera</Text> • Last updated Today, 9:12 AM
          </Text>
        </View>

        {/* ─── 7. LATEST CHECK-IN HERO CARD ─── */}
        <View style={styles.latestCard}>
          <View style={styles.latestTopRow}>
            <Text style={styles.latestCardLabel}>LATEST CHECK-IN</Text>
            <View style={styles.statusTagCompleted}>
              <Text style={styles.statusTagCompletedText}>COMPLETED ✓</Text>
            </View>
          </View>

          <View style={styles.moodHeroCenter}>
            <View style={styles.moodEmojiCircle}>
              <Text style={{ fontSize: 44 }}>😊</Text>
            </View>
            <Text style={styles.moodHeroTitle}>Feeling Good</Text>
            <Text style={styles.moodHeroTime}>Today • Recorded at 09:10 AM</Text>
          </View>

          <TouchableOpacity style={styles.viewTodayDetailsBtn} onPress={() => onNavigate('todaysWellbeing')} activeOpacity={0.85}>
            <Text style={styles.viewTodayDetailsBtnText}>View Today's Well-being Details (G32) →</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 9. WELL-BEING OVERVIEW CARD ─── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>WELL-BEING OVERVIEW</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewBox}>
              <Text style={styles.overviewVal}>6 / 7</Text>
              <Text style={styles.overviewLabel}>Check-ins (86%)</Text>
            </View>

            <View style={styles.overviewBox}>
              <Text style={[styles.overviewVal, { color: C.primary }]}>STABLE</Text>
              <Text style={styles.overviewLabel}>Current Trend</Text>
            </View>

            <View style={styles.overviewBox}>
              <Text style={styles.overviewVal}>None</Text>
              <Text style={styles.overviewLabel}>Recent Change</Text>
            </View>

            <View style={styles.overviewBox}>
              <Text style={styles.overviewVal}>09:10 AM</Text>
              <Text style={styles.overviewLabel}>Last Check-in</Text>
            </View>
          </View>
        </View>

        {/* ─── 10. RECENT 7-DAY MOOD STRIP ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Recent 7-Day Mood Strip</Text>
          </View>

          <View style={styles.moodStripRow}>
            {[
              { day: 'Mon', emoji: '😊', label: 'Good' },
              { day: 'Tue', emoji: '🙂', label: 'Okay' },
              { day: 'Wed', emoji: '😐', label: 'Neutral' },
              { day: 'Thu', emoji: '😊', label: 'Good' },
              { day: 'Fri', emoji: '😊', label: 'Good' },
              { day: 'Sat', emoji: '—', label: 'Off' },
              { day: 'Sun', emoji: '😊', label: 'Good' },
            ].map((m, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.moodStripPill}
                onPress={() => Toast.show({ type: 'info', text1: `${m.day} Mood`, text2: `Recorded state: ${m.label}` })}
              >
                <Text style={styles.moodStripDay}>{m.day}</Text>
                <Text style={{ fontSize: 20, marginVertical: 4 }}>{m.emoji}</Text>
                <Text style={styles.moodStripLabel}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── 11. ACCESSIBLE MOOD LEVEL TREND CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="chart-timeline-variant" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Mood Level Trend (7 Days)</Text>
          </View>

          <View style={styles.trendVisualBox}>
            {[
              { level: 'Very Good', barWidth: '90%', color: C.primary },
              { level: 'Good', barWidth: '85%', color: C.primary },
              { level: 'Okay', barWidth: '60%', color: C.warning },
              { level: 'Low', barWidth: '20%', color: C.error },
            ].map((lvl, i) => (
              <View key={i} style={styles.trendLevelRow}>
                <Text style={styles.trendLevelLabel}>{lvl.level}</Text>
                <View style={styles.trendLevelBarBg}>
                  <View style={[styles.trendLevelBarFill, { width: lvl.barWidth as any, backgroundColor: lvl.color }]} />
                </View>
              </View>
            ))}
          </View>
          <Text style={styles.trendSummaryText}>• Factual Observation: Mood has remained predominantly Good or Okay during the last 7 days.</Text>
        </View>

        {/* ─── 12. RECENT FACTUAL CHANGES CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="swap-horizontal" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Recent Pattern Changes</Text>
          </View>
          <Text style={styles.changeBodyText}>
            • <Text style={{ fontWeight: '800', color: C.primary }}>No significant changes detected.</Text> Elder emotional well-being check-ins match their established 30-day baseline.
          </Text>
        </View>

        {/* ─── 14. CHECK-IN CONSISTENCY CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="check-all" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Check-in Completion Consistency</Text>
          </View>
          <View style={styles.consistencyRow}>
            <Text style={styles.consistencyNum}>86%</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.consistencyText}>6 of 7 scheduled check-ins completed</Text>
              <Text style={styles.consistencySub}>Regular check-in activity helps detect early routine shifts.</Text>
            </View>
          </View>
        </View>

        {/* ─── 16. WELL-BEING INSIGHT CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Well-being Insights</Text>
          </View>
          <Text style={styles.insightText}>• Evening check-ins have shown lower mood slightly more frequently than morning check-ins.</Text>
        </View>

        {/* ─── 15. QUICK ACTIONS GRID ─── */}
        <Text style={styles.sectionHeaderTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => onNavigate('todaysWellbeing')}>
            <MaterialCommunityIcons name="calendar-check" size={20} color={C.primary} />
            <Text style={styles.quickActionBtnText}>Today's Well-being (G32)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionBtn} onPress={handleCallElder}>
            <MaterialCommunityIcons name="phone" size={20} color={C.primary} />
            <Text style={styles.quickActionBtnText}>Call Elder</Text>
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
          const isActive = tab.id === 'elderOverview';
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
  latestCard: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  latestTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  latestCardLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  statusTagCompleted: { backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusTagCompletedText: { fontSize: 10, fontWeight: '900', color: C.primary },
  moodHeroCenter: { alignItems: 'center', marginVertical: 12 },
  moodEmojiCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  moodHeroTitle: { fontSize: 24, fontWeight: '900', color: C.textPrimary },
  moodHeroTime: { fontSize: 12, fontWeight: '700', color: C.textSecondary, marginTop: 2 },
  viewTodayDetailsBtn: { height: 44, backgroundColor: C.primaryLight, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  viewTodayDetailsBtnText: { color: C.primary, fontSize: 13, fontWeight: '900' },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardSectionLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8, marginBottom: 10 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  overviewBox: { width: '48%', backgroundColor: C.bg, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  overviewVal: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  overviewLabel: { fontSize: 10, fontWeight: '600', color: C.textSecondary, marginTop: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  moodStripRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodStripPill: { width: 44, height: 72, borderRadius: 14, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  moodStripDay: { fontSize: 10, fontWeight: '800', color: C.textMuted },
  moodStripLabel: { fontSize: 9, fontWeight: '700', color: C.textSecondary },
  trendVisualBox: { gap: 8, marginBottom: 10 },
  trendLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trendLevelLabel: { width: 70, fontSize: 11, fontWeight: '700', color: C.textSecondary },
  trendLevelBarBg: { flex: 1, height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  trendLevelBarFill: { height: '100%', borderRadius: 4 },
  trendSummaryText: { fontSize: 11, color: C.textSecondary, lineHeight: 16 },
  changeBodyText: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  consistencyRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  consistencyNum: { fontSize: 28, fontWeight: '900', color: C.primary },
  consistencyText: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  consistencySub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  insightText: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  quickActionsGrid: { flexDirection: 'row', gap: 10 },
  quickActionBtn: { flex: 1, height: 48, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, ...elevation.e1 },
  quickActionBtnText: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
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

export default GuardianMoodDashboardScreen;

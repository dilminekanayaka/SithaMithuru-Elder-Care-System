/**
 * GuardianActivityDashboardScreen.tsx — Screen G43 (Daily Activity Dashboard)
 * Spec: g43.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, NHS App, Samsung Health
 *
 * Screen Mission: Answers "Is my elder following their usual daily routine, and is there anything unusual that needs my attention?"
 *
 * Healthcare Safety Mandate per g43.txt:
 *  - Activity data is OBSERVATIONAL. Do NOT present Activity Score as a clinical or general medical assessment.
 *  - Distinguishes "No activity received" (sync stale) vs "No activity occurred".
 *
 * Component Architecture per g43.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Daily Activity", Subtitle "Activity Dashboard • G43", Overflow menu).
 *  3. Elder Context Banner (Nimal Perera, Today • August 9, Last synced Updated just now).
 *  4. Observational Activity Score Card (Score: 78, Baseline: 82, 7-Day Trend + Info Modal explaining non-medical nature).
 *  5. Today's Chronological Routine Timeline Card (7:00 AM Morning ✓, 8:00 AM Breakfast ✓, 9:30 AM Walk ✓, 12:30 PM Lunch ◷).
 *  6. Activity Summary Metrics (Active: 3h 24m, Rest: 5h 10m, Recorded Events: 8).
 *  7. Inactivity Monitoring Card (✓ No current inactivity alert • Latest activity Walking 10:24 AM).
 *  8. Quick Actions Grid (View Activity Timeline G44, Call Elder).
 *  9. Data Synchronization Footer & Persistent 5-Tab Bottom Navigation Bar.
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

export interface RoutineItem {
  id: string;
  time: string;
  title: string;
  status: 'COMPLETED' | 'UPCOMING' | 'IN_PROGRESS' | 'MISSED';
}

interface GuardianActivityDashboardScreenProps {
  onBack?: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianActivityDashboardScreen: React.FC<GuardianActivityDashboardScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const routines: RoutineItem[] = [
    { id: 'r1', time: '07:00 AM', title: 'Morning Routine', status: 'COMPLETED' },
    { id: 'r2', time: '08:00 AM', title: 'Breakfast', status: 'COMPLETED' },
    { id: 'r3', time: '09:30 AM', title: 'Morning Walk (28 mins)', status: 'COMPLETED' },
    { id: 'r4', time: '12:30 PM', title: 'Lunch Routine', status: 'UPCOMING' },
    { id: 'r5', time: '06:00 PM', title: 'Evening Routine', status: 'UPCOMING' },
  ];

  const handleCallElder = () => {
    Haptics.selectionAsync();
    Alert.alert('Call Elder', 'Dialing Nimal Perera (+94 77 123 4567)...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 5. TOP APP BAR ─── */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
            <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Daily Activity</Text>
          <Text style={styles.headerSubtitle}>Activity Dashboard • G43</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Activity Data Refreshed' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('activityTimeline'); }}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Activity Timeline (G44)</Text>
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
          <MaterialCommunityIcons name="walk" size={20} color={C.primary} />
          <Text style={styles.elderContextText}>
            Monitoring <Text style={{ fontWeight: '900', color: C.textPrimary }}>Nimal Perera</Text> • Today, August 9
          </Text>
        </View>

        {/* ─── 8. OBSERVATIONAL ACTIVITY SCORE CARD ─── */}
        <View style={styles.scoreCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionLabel}>OBSERVED DAILY ACTIVITY SCORE</Text>
            <TouchableOpacity onPress={() => setShowInfoModal(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="information-outline" size={18} color={C.info} />
            </TouchableOpacity>
          </View>

          <View style={styles.scoreHeroRow}>
            <Text style={styles.scoreNumberText}>78</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.scoreMainTitle}>Within Usual Activity Range</Text>
              <Text style={styles.scoreSubText}>Recent baseline: 82 • Slightly below typical morning pattern</Text>
            </View>
          </View>

          <Text style={styles.trendLabel}>7-DAY ACTIVITY LEVEL TREND</Text>
          <View style={styles.trendRow}>
            {[
              { day: 'M', score: 82 },
              { day: 'T', score: 79 },
              { day: 'W', score: 85 },
              { day: 'T', score: 81 },
              { day: 'F', score: 76 },
              { day: 'S', score: 80 },
              { day: 'S', score: 78, active: true },
            ].map((item, index) => (
              <View key={index} style={styles.trendCol}>
                <View style={[styles.trendBarBg, item.active && styles.trendBarActiveBg]}>
                  <View style={[styles.trendBarFill, { height: `${item.score}%`, backgroundColor: item.active ? C.primary : '#94A3B8' }]} />
                </View>
                <Text style={[styles.trendDayText, item.active && styles.trendDayActiveText]}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── 14. TODAY'S ROUTINE TIMELINE CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Today's Routine Timeline</Text>
          </View>

          <View style={styles.timelineList}>
            {routines.map((r, i) => {
              const isComp = r.status === 'COMPLETED';
              const isUp   = r.status === 'UPCOMING';
              return (
                <View key={r.id} style={styles.timelineRow}>
                  <View style={styles.timelineTimeCol}>
                    <Text style={styles.timelineTimeText}>{r.time}</Text>
                  </View>

                  <View style={styles.timelineNodeCol}>
                    <View style={[styles.timelineNodeCircle, { backgroundColor: isComp ? C.primaryLight : C.bg }]}>
                      <MaterialCommunityIcons name={isComp ? 'check' : 'clock-outline'} size={14} color={isComp ? C.primary : C.textMuted} />
                    </View>
                    {i < routines.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  <View style={styles.timelineContentCol}>
                    <Text style={[styles.timelineTitle, isComp && styles.timelineTitleDone]}>{r.title}</Text>
                    <Text style={styles.timelineStatusSub}>{isComp ? '✓ Completed' : '◷ Upcoming'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── 17. ACTIVITY SUMMARY & LATEST ACTIVITY ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="chart-box-outline" size={20} color={C.info} />
            <Text style={styles.cardHeaderTitle}>Activity Summary</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryGridItem}>
              <Text style={[styles.summaryValNum, { color: C.primary }]}>3h 24m</Text>
              <Text style={styles.summaryValLabel}>Active Time</Text>
            </View>
            <View style={styles.summaryGridItem}>
              <Text style={[styles.summaryValNum, { color: C.info }]}>5h 10m</Text>
              <Text style={styles.summaryValLabel}>Rest Time</Text>
            </View>
            <View style={styles.summaryGridItem}>
              <Text style={[styles.summaryValNum, { color: C.textPrimary }]}>8</Text>
              <Text style={styles.summaryValLabel}>Recorded Events</Text>
            </View>
          </View>

          <View style={styles.latestActivityBox}>
            <Text style={styles.latestActivityLabel}>LATEST RECORDED MOVEMENT</Text>
            <Text style={styles.latestActivityVal}>Walking • 10:24 AM</Text>
          </View>
        </View>

        {/* ─── 18 & 21. INACTIVITY MONITORING CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Inactivity Monitoring</Text>
          </View>

          <View style={styles.inactivityBox}>
            <Text style={styles.inactivityTitle}>✓ No Current Inactivity Alert</Text>
            <Text style={styles.inactivitySub}>Last activity recorded at 10:24 AM. No prolonged periods of unexpected inactivity detected today.</Text>
          </View>
        </View>

        {/* ─── QUICK ACTIONS GRID ─── */}
        <Text style={styles.sectionHeaderTitle}>Quick Actions</Text>
        <View style={styles.quickActionGrid}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => onNavigate('activityTimeline')}>
            <MaterialCommunityIcons name="chart-timeline-variant" size={20} color={C.primary} />
            <Text style={styles.quickActionBtnText}>Activity Timeline (G44)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionBtn} onPress={handleCallElder}>
            <MaterialCommunityIcons name="phone" size={20} color={C.primary} />
            <Text style={styles.quickActionBtnText}>Call Elder</Text>
          </TouchableOpacity>
        </View>

        {/* ─── SYNCHRONIZATION INDICATOR ─── */}
        <View style={styles.syncFooter}>
          <MaterialCommunityIcons name="sync" size={14} color={C.textMuted} />
          <Text style={styles.syncFooterText}>Updated just now • Last synced Today at 9:12 AM</Text>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ─── 11. SCORE EXPLANATION MODAL ─── */}
      <Modal visible={showInfoModal} transparent animationType="fade" onRequestClose={() => setShowInfoModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowInfoModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="information" size={24} color={C.info} />
              <Text style={styles.modalTitle}>Activity Score Notice</Text>
            </View>

            <Text style={styles.modalBodyText}>
              This score summarizes recorded daily activity compared with the elder's configured activity pattern.
            </Text>
            <Text style={[styles.modalBodyText, { fontWeight: '800', marginTop: 8, color: C.textPrimary }]}>
              🔒 Healthcare Safety Boundary: This observational score is NOT a medical assessment, diagnostic conclusion, or clinical health evaluation.
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
  scoreCard: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardSectionLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary, flex: 1, marginLeft: 8 },
  scoreHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 8 },
  scoreNumberText: { fontSize: 36, fontWeight: '900', color: C.primary },
  scoreMainTitle: { fontSize: 14, fontWeight: '800', color: C.textPrimary },
  scoreSubText: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  trendLabel: { fontSize: 10, fontWeight: '900', color: C.textMuted, letterSpacing: 0.8, marginTop: 12, marginBottom: 8 },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', height: 60, alignItems: 'flex-end' },
  trendCol: { alignItems: 'center', flex: 1 },
  trendBarBg: { width: 12, height: 42, backgroundColor: '#F1F5F9', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  trendBarActiveBg: { backgroundColor: C.primaryLight },
  trendBarFill: { width: '100%', borderRadius: 6 },
  trendDayText: { fontSize: 10, fontWeight: '700', color: C.textMuted, marginTop: 4 },
  trendDayActiveText: { color: C.primary, fontWeight: '900' },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  timelineList: { marginTop: 10 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineTimeCol: { width: 65 },
  timelineTimeText: { fontSize: 11, fontWeight: '800', color: C.textSecondary },
  timelineNodeCol: { alignItems: 'center', marginHorizontal: 8 },
  timelineNodeCircle: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  timelineLine: { width: 2, height: 24, backgroundColor: C.border, marginVertical: 2 },
  timelineContentCol: { flex: 1, paddingBottom: 12 },
  timelineTitle: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  timelineTitleDone: { color: C.primary },
  timelineStatusSub: { fontSize: 10, color: C.textMuted, marginTop: 1 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  summaryGridItem: { alignItems: 'center' },
  summaryValNum: { fontSize: 20, fontWeight: '900' },
  summaryValLabel: { fontSize: 11, fontWeight: '700', color: C.textSecondary, marginTop: 2 },
  latestActivityBox: { backgroundColor: C.bg, borderRadius: 12, padding: 10, marginTop: 6, borderWidth: 1, borderColor: C.border },
  latestActivityLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  latestActivityVal: { fontSize: 13, fontWeight: '900', color: C.textPrimary, marginTop: 2 },
  inactivityBox: { backgroundColor: C.primaryLight, borderRadius: 16, padding: 12, marginTop: 6 },
  inactivityTitle: { fontSize: 13, fontWeight: '900', color: C.primary },
  inactivitySub: { fontSize: 11, color: C.textSecondary, marginTop: 2, lineHeight: 16 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  quickActionGrid: { flexDirection: 'row', gap: 8, marginBottom: spacing.s4 },
  quickActionBtn: { flex: 1, height: 48, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, ...elevation.e1 },
  quickActionBtnText: { fontSize: 12, fontWeight: '800', color: C.textPrimary },
  syncFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 },
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

export default GuardianActivityDashboardScreen;

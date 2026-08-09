/**
 * GuardianActivityTimelineScreen.tsx — Screen G44 (Activity Investigation Timeline)
 * Spec: g44.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, NHS App, Samsung Health
 *
 * Screen Mission: Answers "What happened throughout my elder's day?"
 *
 * Architecture Mandate per g44.txt:
 *  - G44 is an INVESTIGATION TIMELINE. Scannable vertical timeline of daily activities.
 *  - Distinguishes "Confirmed Inactivity" vs "Data Gap (missing sync)".
 *  - Tapping any event item -> Navigates to G45 Activity Details.
 *
 * Component Architecture per g44.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Activity Timeline", Subtitle "Investigation Timeline • G44", Overflow menu).
 *  3. Elder Selector Context (Nimal Perera, Today • August 9).
 *  4. Date Navigation Bar (Previous Day < , Selected Date , Next Day >).
 *  5. Daily Summary Card (8 Events, 3h 24m Active, 5h 10m Rest, Activity Score 78).
 *  6. Vertical Chronological Timeline:
 *     - 07:00 AM — Morning Routine (✓ Completed)
 *     - 08:00 AM — Breakfast (35 min • Recorded)
 *     - 09:30 AM — Morning Walk (28 min • Recorded)
 *     - 10:24 AM — Rest (42 min • Recorded)
 *     - 11:06 AM — Activity Gap Notice (2h 18m without recorded activity)
 *     - 12:30 PM — Lunch (◷ Upcoming)
 *  7. Daily Summary Bottom Sheet Modal.
 *  8. Offline Banner & Persistent 5-Tab Bottom Navigation Bar.
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

export interface TimelineEventItem {
  id: string;
  time: string;
  title: string;
  type: 'WALK' | 'MEAL' | 'REST' | 'ROUTINE' | 'GAP';
  duration?: string;
  status: 'RECORDED' | 'COMPLETED' | 'UPCOMING' | 'GAP';
  icon: string;
}

interface GuardianActivityTimelineScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianActivityTimelineScreen: React.FC<GuardianActivityTimelineScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(false);
  const [refreshing, setRefreshing]           = useState(false);
  const [selectedDateOffset, setDateOffset]   = useState<number>(0); // 0 = Today, -1 = Yesterday
  const [showSummaryModal, setShowSummaryModal]= useState(false);
  const [showMoreMenu, setShowMoreMenu]       = useState(false);

  const timelineEvents: TimelineEventItem[] = [
    { id: 'e1', time: '07:00 AM', title: 'Morning Routine', type: 'ROUTINE', status: 'COMPLETED', icon: 'weather-sunny' },
    { id: 'e2', time: '08:00 AM', title: 'Breakfast', type: 'MEAL', duration: '35 min', status: 'RECORDED', icon: 'coffee-outline' },
    { id: 'e3', time: '09:30 AM', title: 'Morning Walk', type: 'WALK', duration: '28 min', status: 'RECORDED', icon: 'walk' },
    { id: 'e4', time: '10:24 AM', title: 'Rest & Hydration', type: 'REST', duration: '42 min', status: 'RECORDED', icon: 'sofa-outline' },
    { id: 'e5', time: '11:06 AM', title: '2h 18m without recorded activity', type: 'GAP', status: 'GAP', icon: 'alert-circle-outline' },
    { id: 'e6', time: '12:30 PM', title: 'Lunch Routine', type: 'MEAL', status: 'UPCOMING', icon: 'silverware-fork-knife' },
  ];

  const handlePrevDay = () => {
    Haptics.selectionAsync();
    setDateOffset(prev => prev - 1);
  };

  const handleNextDay = () => {
    if (selectedDateOffset >= 0) {
      Toast.show({ type: 'info', text1: 'Future Date', text2: 'Future dates do not contain activity history.' });
      return;
    }
    Haptics.selectionAsync();
    setDateOffset(prev => prev + 1);
  };

  const getDateLabel = () => {
    if (selectedDateOffset === 0) return 'Today • August 9, 2026';
    if (selectedDateOffset === -1) return 'Yesterday • August 8, 2026';
    return `August ${9 + selectedDateOffset}, 2026`;
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
          <Text style={styles.headerTitle}>Activity Timeline</Text>
          <Text style={styles.headerSubtitle}>Investigation Timeline • G44</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Timeline Refreshed' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); setShowSummaryModal(true); }}>
              <MaterialCommunityIcons name="chart-box-outline" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>View Daily Summary</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── 6. DATE NAVIGATION BAR ─── */}
      <View style={styles.dateNavCard}>
        <TouchableOpacity style={styles.dateNavBtn} onPress={handlePrevDay}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.dateNavTitle}>{getDateLabel()}</Text>
          <Text style={styles.dateNavSub}>Tap to open calendar</Text>
        </View>

        <TouchableOpacity style={[styles.dateNavBtn, selectedDateOffset >= 0 && { opacity: 0.3 }]} onPress={handleNextDay}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} colors={[C.primary]} />
        }
      >
        {/* ─── 8. DAILY SUMMARY CARD ─── */}
        <View style={styles.summaryCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionLabel}>DAILY ACTIVITY SUMMARY</Text>
            <TouchableOpacity onPress={() => setShowSummaryModal(true)}>
              <Text style={styles.viewSummaryBtnText}>Full Summary →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryMetricsRow}>
            <View style={styles.summaryMetricItem}>
              <Text style={[styles.summaryValNum, { color: C.primary }]}>8</Text>
              <Text style={styles.summaryValLabel}>Events</Text>
            </View>
            <View style={styles.summaryMetricItem}>
              <Text style={[styles.summaryValNum, { color: C.primary }]}>3h 24m</Text>
              <Text style={styles.summaryValLabel}>Active Time</Text>
            </View>
            <View style={styles.summaryMetricItem}>
              <Text style={[styles.summaryValNum, { color: C.info }]}>5h 10m</Text>
              <Text style={styles.summaryValLabel}>Rest Time</Text>
            </View>
            <View style={styles.summaryMetricItem}>
              <Text style={[styles.summaryValNum, { color: C.primary }]}>78</Text>
              <Text style={styles.summaryValLabel}>Score</Text>
            </View>
          </View>
        </View>

        {/* ─── 9. VERTICAL CHRONOLOGICAL TIMELINE ─── */}
        <Text style={styles.sectionHeaderTitle}>Chronological Activity Log</Text>
        <View style={styles.timelineContainer}>
          {timelineEvents.map((item, index) => {
            const isGap       = item.status === 'GAP';
            const isCompleted = item.status === 'COMPLETED';
            const isUpcoming  = item.status === 'UPCOMING';

            if (isGap) {
              return (
                <View key={item.id} style={styles.gapCard}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={18} color={C.warning} />
                  <Text style={styles.gapText}>{item.title}</Text>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.eventRow}
                onPress={() => onNavigate('activityDetails')}
                activeOpacity={0.85}
              >
                <View style={styles.timeCol}>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>

                <View style={styles.nodeCol}>
                  <View style={[styles.nodeCircle, { backgroundColor: isCompleted ? C.primaryLight : isUpcoming ? C.bg : C.infoLight }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={16} color={isCompleted ? C.primary : isUpcoming ? C.textMuted : C.info} />
                  </View>
                  {index < timelineEvents.length - 1 && <View style={styles.nodeLine} />}
                </View>

                <View style={styles.contentCol}>
                  <View style={styles.eventCard}>
                    <View style={styles.eventCardTop}>
                      <Text style={styles.eventTitle}>{item.title}</Text>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={C.textMuted} />
                    </View>
                    <Text style={styles.eventSubText}>
                      {item.duration ? `Duration: ${item.duration} • ` : ''}{isCompleted ? '✓ Completed' : isUpcoming ? '◷ Upcoming' : 'Recorded'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── SYNCHRONIZATION INDICATOR ─── */}
        <View style={styles.syncFooter}>
          <MaterialCommunityIcons name="sync" size={14} color={C.textMuted} />
          <Text style={styles.syncFooterText}>Updated just now • Last synced Today at 9:12 AM</Text>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ─── 21. DAILY SUMMARY BOTTOM SHEET MODAL ─── */}
      <Modal visible={showSummaryModal} transparent animationType="slide" onRequestClose={() => setShowSummaryModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSummaryModal(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Daily Activity Summary</Text>
                <Text style={styles.modalSubtitle}>{getDateLabel()}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSummaryModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBodyCard}>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Activity Score:</Text>
                <Text style={[styles.modalSummaryVal, { color: C.primary }]}>78 (Within Usual Range)</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Recorded Events:</Text>
                <Text style={styles.modalSummaryVal}>8 Activity Events</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Total Active Time:</Text>
                <Text style={styles.modalSummaryVal}>3 hours 24 minutes</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Total Rest Time:</Text>
                <Text style={styles.modalSummaryVal}>5 hours 10 minutes</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Longest Activity:</Text>
                <Text style={styles.modalSummaryVal}>Rest (42 mins)</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Inactivity Gaps:</Text>
                <Text style={styles.modalSummaryVal}>1 gap recorded (2h 18m)</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowSummaryModal(false)}>
              <Text style={styles.modalCloseBtnText}>Close Summary</Text>
            </TouchableOpacity>
          </TouchableOpacity>
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
  dateNavCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, marginHorizontal: spacing.s5, marginTop: spacing.s4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  dateNavBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  dateNavTitle: { fontSize: 14, fontWeight: '900', color: C.textPrimary },
  dateNavSub: { fontSize: 10, color: C.textMuted, marginTop: 1 },
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: 110 },
  summaryCard: { backgroundColor: C.card, borderRadius: 20, padding: 14, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardSectionLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  viewSummaryBtnText: { fontSize: 11, fontWeight: '900', color: C.primary },
  summaryMetricsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryMetricItem: { alignItems: 'center' },
  summaryValNum: { fontSize: 18, fontWeight: '900' },
  summaryValLabel: { fontSize: 10, fontWeight: '700', color: C.textSecondary, marginTop: 2 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 12 },
  timelineContainer: { gap: 4, marginBottom: spacing.s4 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timeCol: { width: 65, paddingTop: 4 },
  timeText: { fontSize: 11, fontWeight: '800', color: C.textSecondary },
  nodeCol: { alignItems: 'center', marginHorizontal: 8 },
  nodeCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  nodeLine: { width: 2, flex: 1, minHeight: 28, backgroundColor: C.border, marginVertical: 2 },
  contentCol: { flex: 1, paddingBottom: 12 },
  eventCard: { backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  eventCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventTitle: { fontSize: 14, fontWeight: '900', color: C.textPrimary },
  eventSubText: { fontSize: 11, color: C.textSecondary, marginTop: 4 },
  gapCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.warningLight, borderRadius: 12, padding: 10, marginVertical: 6, borderWidth: 1, borderColor: C.warning },
  gapText: { fontSize: 11, fontWeight: '800', color: C.orange },
  syncFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 },
  syncFooterText: { fontSize: 11, color: C.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.s6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  modalSubtitle: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  modalBodyCard: { backgroundColor: C.bg, borderRadius: 16, padding: 12, marginVertical: 10, borderWidth: 1, borderColor: C.border },
  modalSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalSummaryLabel: { fontSize: 12, color: C.textSecondary },
  modalSummaryVal: { fontSize: 12, fontWeight: '800', color: C.textPrimary },
  modalCloseBtn: { height: 44, backgroundColor: C.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
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

export default GuardianActivityTimelineScreen;

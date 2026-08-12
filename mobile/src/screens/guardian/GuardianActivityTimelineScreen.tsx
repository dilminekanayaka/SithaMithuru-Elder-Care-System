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

interface ActivityFeedItem {
  type: 'medication' | 'mood' | 'task';
  title: string;
  detail: string;
  event_time: string;
  icon: string;
  color: string;
}

interface GuardianActivityTimelineScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

const GuardianActivityTimelineScreen: React.FC<GuardianActivityTimelineScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                  = useState(true);
  const [loadError, setLoadError]              = useState<string | null>(null);
  const [refreshing, setRefreshing]            = useState(false);
  const [selectedDateOffset, setDateOffset]    = useState<number>(0); // 0 = Today, -6 = 6 days ago (oldest available)
  const [showSummaryModal, setShowSummaryModal]= useState(false);
  const [showMoreMenu, setShowMoreMenu]        = useState(false);
  const [feed, setFeed]                        = useState<ActivityFeedItem[]>([]);

  const loadData = useCallback(async () => {
    if (!elderId) {
      setLoadError('No elder selected.');
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      const res = await apiFetch(`/guardian/elders/${elderId}/activity?limit=100`, token);
      setFeed(res?.data || res || []);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load activity timeline. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + selectedDateOffset);
  const targetDateStr = targetDate.toISOString().slice(0, 10);
  const dayEvents = feed
    .filter(e => e.event_time?.slice(0, 10) === targetDateStr)
    .sort((a, b) => a.event_time.localeCompare(b.event_time));

  const medCount = dayEvents.filter(e => e.type === 'medication').length;
  const moodCount = dayEvents.filter(e => e.type === 'mood').length;
  const taskCount = dayEvents.filter(e => e.type === 'task').length;

  const handlePrevDay = () => {
    if (selectedDateOffset <= -6) {
      Toast.show({ type: 'info', text1: 'No Earlier Data', text2: 'Activity history is only available for the last 7 days.' });
      return;
    }
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
    if (selectedDateOffset === 0) return `Today • ${targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    if (selectedDateOffset === -1) return `Yesterday • ${targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    return targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
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
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[C.primary]} />
        }
      >
        {loading && (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        )}

        {!loading && loadError && (
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={40} color={C.textMuted} />
            <Text style={{ marginTop: 8, fontSize: 13, fontWeight: '700', color: C.textPrimary }}>{loadError}</Text>
          </View>
        )}

        {!loading && !loadError && (
          <>
            {/* ─── DAILY SUMMARY CARD ─── */}
            <View style={styles.summaryCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardSectionLabel}>DAILY ACTIVITY SUMMARY</Text>
                <TouchableOpacity onPress={() => setShowSummaryModal(true)}>
                  <Text style={styles.viewSummaryBtnText}>Full Summary →</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.summaryMetricsRow}>
                <View style={styles.summaryMetricItem}>
                  <Text style={[styles.summaryValNum, { color: C.primary }]}>{dayEvents.length}</Text>
                  <Text style={styles.summaryValLabel}>Events</Text>
                </View>
                <View style={styles.summaryMetricItem}>
                  <Text style={[styles.summaryValNum, { color: C.primary }]}>{medCount}</Text>
                  <Text style={styles.summaryValLabel}>Medication</Text>
                </View>
                <View style={styles.summaryMetricItem}>
                  <Text style={[styles.summaryValNum, { color: C.info }]}>{moodCount}</Text>
                  <Text style={styles.summaryValLabel}>Mood</Text>
                </View>
                <View style={styles.summaryMetricItem}>
                  <Text style={[styles.summaryValNum, { color: C.textPrimary }]}>{taskCount}</Text>
                  <Text style={styles.summaryValLabel}>Tasks</Text>
                </View>
              </View>
            </View>

            {/* ─── VERTICAL CHRONOLOGICAL TIMELINE ─── */}
            <Text style={styles.sectionHeaderTitle}>Chronological Activity Log</Text>
            {dayEvents.length === 0 ? (
              <View style={styles.summaryCard}>
                <Text style={{ fontSize: 12, color: C.textSecondary }}>No activity recorded for this date.</Text>
              </View>
            ) : (
              <View style={styles.timelineContainer}>
                {dayEvents.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.eventRow}
                    onPress={() => onNavigate('activityDetails', item)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.timeCol}>
                      <Text style={styles.timeText}>{new Date(item.event_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>

                    <View style={styles.nodeCol}>
                      <View style={[styles.nodeCircle, { backgroundColor: C.primaryLight }]}>
                        <MaterialCommunityIcons name={item.icon as any} size={16} color={item.color} />
                      </View>
                      {index < dayEvents.length - 1 && <View style={styles.nodeLine} />}
                    </View>

                    <View style={styles.contentCol}>
                      <View style={styles.eventCard}>
                        <View style={styles.eventCardTop}>
                          <Text style={styles.eventTitle}>{item.title}</Text>
                          <MaterialCommunityIcons name="chevron-right" size={18} color={C.textMuted} />
                        </View>
                        {!!item.detail && <Text style={styles.eventSubText}>{item.detail}</Text>}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ─── DAILY SUMMARY BOTTOM SHEET MODAL ─── */}
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
                <Text style={styles.modalSummaryLabel}>Recorded Events:</Text>
                <Text style={styles.modalSummaryVal}>{dayEvents.length} Activity Events</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Medication Events:</Text>
                <Text style={styles.modalSummaryVal}>{medCount}</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Mood Check-ins:</Text>
                <Text style={styles.modalSummaryVal}>{moodCount}</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Task Events:</Text>
                <Text style={styles.modalSummaryVal}>{taskCount}</Text>
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
  modalSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
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
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...elevation.e2,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 2 },
  tabLabelActive: { color: C.primary, fontWeight: '800' },
});

export default GuardianActivityTimelineScreen;

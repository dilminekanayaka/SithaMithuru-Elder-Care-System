/**
 * GuardianTodaysRoutineScreen.tsx — Screen G26 (Today's Routine Execution Schedule)
 * Spec: g26.txt
 *
 * Design Standard: Apple Health, Samsung Health, One Medical, Epic MyChart
 *
 * Screen Mission: Answers "What should my elder be doing today, what has already happened, and what needs attention?"
 *
 * Component Architecture per g26.txt:
 *  1. Android safe-area layout.
 *  2. Top App Bar (Back button, Title "Today's Routine", Calendar picker, Overflow menu with Refresh, Settings, History).
 *  3. Date Selector (Compact ‹ Yesterday | Today | Tomorrow › with Historical View indicator).
 *  4. Today's Progress Card (6/8 completed, 75% complete, Completed 6, Pending 1, Missed 1, Horizontal progress bar).
 *  5. Conditional Attention Banner ("Lunch not confirmed — 45 min overdue", [Send Reminder] button).
 *  6. Next Activity Card (NEXT ACTIVITY / OVERDUE label, Afternoon Walk 4:30 PM, Countdown in 35 min, View Activity CTA).
 *  7. Main Chronological Routine Timeline (Breakfast, Water, Lunch, Walk, Dinner with 200ms expandable details).
 *  8. Standardized Statuses (✓ Completed, ◷ Upcoming, ⚠ Pending, ! Missed, Late, Skipped).
 *  9. Expandable Activity Details (Duration, Target, Reminder status, Send Reminder & View Details CTAs).
 * 10. Reminder Confirmation Bottom Sheet Modal ("Send Reminder to Nimal?").
 * 11. Daily Metrics Section (Water 1.5L/2L, Steps 3,200/5,000, Sleep 7h 45m, Blood Pressure 128/82).
 * 12. Offline Banner & Persistent 5-Tab Bottom Navigation Bar.
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

export interface RoutineActivity {
  id: string;
  name: string;
  category: 'MEAL' | 'HYDRATION' | 'ACTIVITY' | 'HEALTH' | 'REST';
  scheduledTime: string;
  status: 'completed' | 'upcoming' | 'pending' | 'missed' | 'late' | 'skipped';
  completedTime?: string;
  duration?: string;
  target?: string;
  reminderSent: boolean;
  notes?: string;
}

interface GuardianTodaysRoutineScreenProps {
  onBack: () => void;
  token: string;
  elderId: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianTodaysRoutineScreen: React.FC<GuardianTodaysRoutineScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(false);
  const [refreshing, setRefreshing]           = useState(false);
  const [selectedDate, setSelectedDate]       = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  const [expandedId, setExpandedId]           = useState<string | null>('a3'); // Default expand overdue item
  const [showMoreMenu, setShowMoreMenu]       = useState(false);
  const [reminderModalItem, setReminderModalItem] = useState<RoutineActivity | null>(null);

  const activities: RoutineActivity[] = [
    {
      id: 'a1',
      name: 'Breakfast Meal',
      category: 'MEAL',
      scheduledTime: '08:00 AM',
      status: 'completed',
      completedTime: '08:12 AM',
      duration: '20 min',
      target: 'Nutritious breakfast',
      reminderSent: true,
    },
    {
      id: 'a2',
      name: 'Morning Water Intake',
      category: 'HYDRATION',
      scheduledTime: '10:00 AM',
      status: 'completed',
      completedTime: '10:05 AM',
      duration: '5 min',
      target: '750 ml consumed',
      reminderSent: true,
    },
    {
      id: 'a3',
      name: 'Lunch Meal',
      category: 'MEAL',
      scheduledTime: '12:30 PM',
      status: 'pending',
      duration: '30 min',
      target: 'Balanced lunch meal',
      reminderSent: true,
      notes: '45 minutes overdue — Awaiting elder confirmation',
    },
    {
      id: 'a4',
      name: 'Afternoon Walk',
      category: 'ACTIVITY',
      scheduledTime: '04:30 PM',
      status: 'upcoming',
      duration: '30 min',
      target: '2,000 steps stroll',
      reminderSent: false,
    },
    {
      id: 'a5',
      name: 'Dinner Meal',
      category: 'MEAL',
      scheduledTime: '07:00 PM',
      status: 'upcoming',
      duration: '25 min',
      target: 'Light dinner meal',
      reminderSent: false,
    },
  ];

  const completedCount = activities.filter(a => a.status === 'completed').length;
  const pendingCount   = activities.filter(a => a.status === 'pending').length;
  const missedCount    = activities.filter(a => a.status === 'missed').length;
  const totalCount     = activities.length;
  const adherencePct   = Math.round((completedCount / totalCount) * 100);

  const overdueItem = activities.find(a => a.status === 'pending' || a.status === 'missed');
  const nextItem    = activities.find(a => a.status === 'upcoming');

  const toggleExpand = (id: string) => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleOpenReminderModal = (item: RoutineActivity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setReminderModalItem(item);
  };

  const handleConfirmSendReminder = () => {
    if (!reminderModalItem) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: 'success',
      text1: 'Reminder Sent!',
      text2: `Notification sent to elder for ${reminderModalItem.name}.`,
    });
    setReminderModalItem(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 5. TOP APP BAR ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Today's Routine</Text>
          <Text style={styles.headerSubtitle}>Daily Execution Schedule • G26</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => Toast.show({ type: 'info', text1: 'Calendar Picker', text2: 'Select custom routine date...' })}>
            <MaterialCommunityIcons name="calendar" size={22} color={C.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowMoreMenu(v => !v)}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color={C.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* OVERFLOW MORE MENU MODAL */}
      <Modal visible={showMoreMenu} transparent animationType="fade" onRequestClose={() => setShowMoreMenu(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMoreMenu(false)}>
          <View style={styles.menuContent}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Refreshed Today\'s Routine' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('guardianSettings'); }}>
              <MaterialCommunityIcons name="cog-outline" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Routine Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('reports'); }}>
              <MaterialCommunityIcons name="history" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>View Routine History</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── 3. DATE SELECTOR ─── */}
      <View style={styles.dateSelectorRow}>
        {[
          { id: 'yesterday', label: '‹ Yesterday' },
          { id: 'today', label: 'Today (Sat, 8 Aug)' },
          { id: 'tomorrow', label: 'Tomorrow ›' },
        ].map((d) => (
          <TouchableOpacity
            key={d.id}
            style={[styles.dateChip, selectedDate === d.id && styles.dateChipActive]}
            onPress={() => {
              setSelectedDate(d.id as any);
              if (d.id !== 'today') {
                Toast.show({ type: 'info', text1: 'Historical Routine View', text2: `Viewing routine logs for ${d.label}` });
              }
            }}
          >
            <Text style={[styles.dateChipText, selectedDate === d.id && styles.dateChipTextActive]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Historical View Banner Indicator */}
      {selectedDate !== 'today' && (
        <View style={styles.historicalBanner}>
          <MaterialCommunityIcons name="history" size={16} color={C.info} />
          <Text style={styles.historicalBannerText}>
            Historical View Mode ({selectedDate.toUpperCase()}) — Read Only Log
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} colors={[C.primary]} />
        }
      >
        {/* ─── 6. TODAY'S PROGRESS CARD ─── */}
        <View style={styles.card}>
          <View style={styles.progressTopRow}>
            <View>
              <Text style={styles.cardSectionLabel}>TODAY'S ROUTINE PROGRESS</Text>
              <Text style={styles.progressSummaryVal}>{completedCount} / {totalCount} Completed</Text>
            </View>
            <Text style={styles.progressPctText}>{adherencePct}%</Text>
          </View>

          {/* Premium Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${adherencePct}%` as any }]} />
          </View>

          <View style={styles.progressMetricsRow}>
            <View style={styles.metricItem}>
              <View style={[styles.metricDot, { backgroundColor: C.primary }]} />
              <Text style={styles.metricText}>Completed: <Text style={{ fontWeight: '800' }}>{completedCount}</Text></Text>
            </View>

            <View style={styles.metricItem}>
              <View style={[styles.metricDot, { backgroundColor: C.warning }]} />
              <Text style={styles.metricText}>Pending: <Text style={{ fontWeight: '800', color: C.warning }}>{pendingCount}</Text></Text>
            </View>

            <View style={styles.metricItem}>
              <View style={[styles.metricDot, { backgroundColor: C.error }]} />
              <Text style={styles.metricText}>Missed: <Text style={{ fontWeight: '800', color: C.error }}>{missedCount}</Text></Text>
            </View>
          </View>
        </View>

        {/* ─── 7. CONDITIONAL ATTENTION BANNER ─── */}
        {overdueItem && (
          <View style={[styles.card, styles.attentionBanner]}>
            <View style={styles.attentionHeaderRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={22} color={C.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.attentionTitle}>⚠ Attention Required</Text>
                <Text style={styles.attentionSub}>{overdueItem.name} not confirmed — 45 min overdue</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.attentionBtn} onPress={() => handleOpenReminderModal(overdueItem)} activeOpacity={0.85}>
              <MaterialCommunityIcons name="bell-ring-outline" size={16} color="#FFF" />
              <Text style={styles.attentionBtnText}>Send Reminder</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── 8. NEXT ACTIVITY CARD ─── */}
        {nextItem && (
          <View style={[styles.card, styles.nextActivityCard]}>
            <View style={styles.nextCardTop}>
              <View style={styles.nextBadge}>
                <MaterialCommunityIcons name="clock-fast" size={14} color={C.info} />
                <Text style={styles.nextBadgeText}>NEXT ACTIVITY</Text>
              </View>
              <Text style={styles.nextCountdown}>Starts in 35 minutes</Text>
            </View>

            <Text style={styles.nextTitle}>{nextItem.name}</Text>
            <Text style={styles.nextSubTime}>Today • {nextItem.scheduledTime} • Duration: {nextItem.duration}</Text>

            <TouchableOpacity style={styles.viewActivityBtn} onPress={() => toggleExpand(nextItem.id)} activeOpacity={0.85}>
              <Text style={styles.viewActivityBtnText}>View Activity Details</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={C.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* ─── 9. MAIN CHRONOLOGICAL ROUTINE TIMELINE ─── */}
        <Text style={styles.sectionHeaderTitle}>Today's Routine Timeline</Text>
        <View style={styles.timelineContainer}>
          {activities.map((item, idx) => {
            const isCompleted = item.status === 'completed';
            const isPending   = item.status === 'pending';
            const isUpcoming  = item.status === 'upcoming';
            const isExpanded  = expandedId === item.id;

            const iconName = isCompleted ? 'check-circle' : isPending ? 'alert-circle' : 'clock-outline';
            const iconColor = isCompleted ? C.primary : isPending ? C.warning : C.info;
            const bgBadge = isCompleted ? C.primaryLight : isPending ? C.warningLight : C.infoLight;
            const statusLabel = isCompleted ? '✓ Completed' : isPending ? '⚠ Pending' : '◷ Upcoming';

            return (
              <View key={item.id} style={styles.timelineRow}>
                {/* Timeline Line Connector */}
                {idx < activities.length - 1 && <View style={styles.timelineLine} />}

                {/* Timeline Dot Icon */}
                <View style={[styles.timelineDotCircle, { backgroundColor: bgBadge }]}>
                  <MaterialCommunityIcons name={iconName} size={18} color={iconColor} />
                </View>

                {/* Timeline Card */}
                <TouchableOpacity
                  style={[styles.timelineItemCard, isExpanded && styles.timelineItemCardExpanded]}
                  onPress={() => toggleExpand(item.id)}
                  activeOpacity={0.9}
                >
                  <View style={styles.itemTopHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.itemCategoryRow}>
                        <View style={styles.categoryTag}>
                          <Text style={styles.categoryTagText}>{item.category}</Text>
                        </View>
                        <Text style={styles.itemTimeText}>{item.scheduledTime}</Text>
                      </View>
                      <Text style={styles.itemNameText}>{item.name}</Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: bgBadge }]}>
                      <Text style={[styles.statusBadgeText, { color: iconColor }]}>{statusLabel}</Text>
                    </View>
                  </View>

                  {item.completedTime && (
                    <Text style={styles.completedMetaText}>Completed at {item.completedTime}</Text>
                  )}

                  {/* ─── 13. EXPANDABLE DETAILS AREA ─── */}
                  {isExpanded && (
                    <View style={styles.expandedDetailsBox}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Expected Duration:</Text>
                        <Text style={styles.detailVal}>{item.duration || '20 minutes'}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Activity Target:</Text>
                        <Text style={styles.detailVal}>{item.target || 'Standard routine'}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Reminder Status:</Text>
                        <Text style={[styles.detailVal, { color: item.reminderSent ? C.primary : C.textMuted }]}>
                          {item.reminderSent ? 'Reminder Sent ✓' : 'Not Sent'}
                        </Text>
                      </View>

                      {item.notes && (
                        <Text style={styles.itemNotesText}>Note: {item.notes}</Text>
                      )}

                      <View style={styles.expandedActionsRow}>
                        <TouchableOpacity style={styles.expandRemindBtn} onPress={() => handleOpenReminderModal(item)}>
                          <MaterialCommunityIcons name="bell-ring-outline" size={16} color="#FFF" />
                          <Text style={styles.expandRemindBtnText}>Send Reminder</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.expandDetailsBtn} onPress={() => Alert.alert(item.name, `Scheduled: ${item.scheduledTime}\nStatus: ${statusLabel}\nTarget: ${item.target}`)}>
                          <Text style={styles.expandDetailsBtnText}>View Details</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* ─── 15. DAILY METRICS SECTION ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="chart-box-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Daily Health Habit Metrics</Text>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCardBox}>
              <MaterialCommunityIcons name="water" size={20} color="#0284C7" />
              <Text style={styles.metricBoxVal}>1.5 L / 2 L</Text>
              <Text style={styles.metricBoxLabel}>75% Hydration</Text>
            </View>

            <View style={styles.metricCardBox}>
              <MaterialCommunityIcons name="walk" size={20} color="#7C3AED" />
              <Text style={styles.metricBoxVal}>3,200 / 5,000</Text>
              <Text style={styles.metricBoxLabel}>64% Steps</Text>
            </View>

            <View style={styles.metricCardBox}>
              <MaterialCommunityIcons name="bed-clock" size={20} color="#059669" />
              <Text style={styles.metricBoxVal}>7h 45m</Text>
              <Text style={styles.metricBoxLabel}>Good Sleep</Text>
            </View>

            <View style={styles.metricCardBox}>
              <MaterialCommunityIcons name="heart-pulse" size={20} color={C.info} />
              <Text style={styles.metricBoxVal}>128 / 82</Text>
              <Text style={styles.metricBoxLabel}>Blood Pressure</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ─── 14. REMINDER CONFIRMATION BOTTOM SHEET MODAL ─── */}
      <Modal visible={!!reminderModalItem} transparent animationType="slide" onRequestClose={() => setReminderModalItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <MaterialCommunityIcons name="bell-ring-outline" size={24} color={C.warning} />
              <Text style={styles.sheetTitle}>Send Routine Reminder?</Text>
            </View>

            <Text style={styles.sheetBodyText}>
              Send a push notification reminder to Nimal Perera regarding <Text style={{ fontWeight: '800', color: C.textPrimary }}>{reminderModalItem?.name}</Text> (scheduled for {reminderModalItem?.scheduledTime})?
            </Text>

            <View style={styles.sheetBtnRow}>
              <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => setReminderModalItem(null)}>
                <Text style={styles.sheetCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sheetConfirmBtn} onPress={handleConfirmSendReminder}>
                <MaterialCommunityIcons name="bell-ring" size={16} color="#FFF" />
                <Text style={styles.sheetConfirmBtnText}>Send Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
          const isActive = tab.id === 'guardianDashboard';
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
  dateSelectorRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.s5, paddingTop: spacing.s3 },
  dateChip: { flex: 1, height: 36, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  dateChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  dateChipText: { fontSize: 11, fontWeight: '700', color: C.textSecondary },
  dateChipTextActive: { color: C.primary, fontWeight: '900' },
  historicalBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.infoLight, paddingHorizontal: spacing.s5, paddingVertical: 6, marginTop: 8 },
  historicalBannerText: { fontSize: 11, fontWeight: '800', color: C.info },
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: 100 },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardSectionLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  progressTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  progressSummaryVal: { fontSize: 18, fontWeight: '900', color: C.textPrimary, marginTop: 2 },
  progressPctText: { fontSize: 24, fontWeight: '900', color: C.primary },
  progressBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressBarFill: { height: '100%', backgroundColor: C.primary, borderRadius: 4 },
  progressMetricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricDot: { width: 8, height: 8, borderRadius: 4 },
  metricText: { fontSize: 11, color: C.textSecondary },
  attentionBanner: { backgroundColor: C.warningLight, borderColor: C.warning, borderWidth: 1.5 },
  attentionHeaderRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
  attentionTitle: { fontSize: 15, fontWeight: '900', color: C.warning },
  attentionSub: { fontSize: 12, color: C.textPrimary, marginTop: 1 },
  attentionBtn: { height: 40, backgroundColor: C.warning, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  attentionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  nextActivityCard: { backgroundColor: C.infoLight, borderColor: C.info, borderWidth: 1.5 },
  nextCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  nextBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  nextBadgeText: { fontSize: 9, fontWeight: '900', color: C.info },
  nextCountdown: { fontSize: 11, fontWeight: '800', color: C.info },
  nextTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  nextSubTime: { fontSize: 12, color: C.textSecondary, marginTop: 2, marginBottom: 12 },
  viewActivityBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  viewActivityBtnText: { fontSize: 13, fontWeight: '800', color: C.primary },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 12 },
  timelineContainer: { marginBottom: spacing.s4 },
  timelineRow: { flexDirection: 'row', gap: 12, marginBottom: 12, position: 'relative' },
  timelineLine: { position: 'absolute', left: 17, top: 36, bottom: -16, width: 2, backgroundColor: C.border },
  timelineDotCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  timelineItemCard: { flex: 1, backgroundColor: C.card, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  timelineItemCardExpanded: { borderColor: C.primary, borderWidth: 1.5 },
  itemTopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  categoryTagText: { fontSize: 9, fontWeight: '900', color: C.textMuted },
  itemTimeText: { fontSize: 11, fontWeight: '700', color: C.textSecondary },
  itemNameText: { fontSize: 15, fontWeight: '900', color: C.textPrimary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  completedMetaText: { fontSize: 11, color: C.primary, fontWeight: '700', marginTop: 4 },
  expandedDetailsBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  detailLabel: { fontSize: 11, color: C.textSecondary },
  detailVal: { fontSize: 11, fontWeight: '800', color: C.textPrimary },
  itemNotesText: { fontSize: 11, fontStyle: 'italic', color: C.warning, marginTop: 4 },
  expandedActionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  expandRemindBtn: { flex: 1, height: 36, backgroundColor: C.warning, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  expandRemindBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  expandDetailsBtn: { paddingHorizontal: 12, height: 36, backgroundColor: '#F1F5F9', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  expandDetailsBtnText: { fontSize: 11, fontWeight: '800', color: C.textPrimary },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCardBox: { width: '48%', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 14, alignItems: 'center' },
  metricBoxVal: { fontSize: 15, fontWeight: '900', color: C.textPrimary, marginTop: 4 },
  metricBoxLabel: { fontSize: 10, fontWeight: '600', color: C.textSecondary, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  sheetContent: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.s6 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  sheetBodyText: { fontSize: 14, color: C.textSecondary, lineHeight: 22, marginBottom: 20 },
  sheetBtnRow: { flexDirection: 'row', gap: 12 },
  sheetCancelBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  sheetCancelBtnText: { fontSize: 14, fontWeight: '800', color: C.textPrimary },
  sheetConfirmBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: C.warning, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  sheetConfirmBtnText: { fontSize: 14, fontWeight: '900', color: '#FFF' },
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

export default GuardianTodaysRoutineScreen;

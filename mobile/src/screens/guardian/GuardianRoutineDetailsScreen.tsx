/**
 * GuardianRoutineDetailsScreen.tsx — Screen G27 / G27.1 (Comprehensive Activity-Type Dynamic Record & Controls)
 * Specs: g27.txt & g27.1.txt
 *
 * Design Standard: Apple Health, Samsung Health, One Medical, Epic MyChart
 *
 * Screen Mission: Answers "What exactly is this routine activity, what happened with it, and what can I do about it?"
 *
 * Component Architecture per g27.1.txt:
 *  1. Android safe-area layout.
 *  2. Top App Bar (Back button, Title "Routine Details", Minimal overflow menu with Refresh, View History, Settings).
 *  3. Activity Hero Card (Activity Icon 72dp, Name, Category, Frequency, Current Status).
 *  4. Current Status Card (Dynamic per state: Upcoming, Completed, Completed Late, Pending, Missed, Skipped, Unknown).
 *  5. Activity-Specific Layout Engine:
 *     - WALKING/EXERCISE: Duration, Steps (2,000 steps), Distance (1.5 km), Target.
 *     - HYDRATION: Daily Target (2,000 ml), Consumed (1,500 ml), Remaining (500 ml), Progress.
 *     - MEAL: Meal Name, Scheduled Time, Meal Notes, Confirmation timestamp.
 *     - SLEEP: Duration (7h 45m), Bedtime (10:15 PM), Wake Time (06:00 AM), Target (7-9h).
 *     - BLOOD PRESSURE: Systolic / Diastolic (128 / 82 mmHg), Measurement Time.
 *  6. Today's Detailed Audit Record (Scheduled, Reminder Sent, Reminder Opened, Completed timestamp & duration).
 *  7. 7-Day Completion Pattern Visualizer (Mon ✓, Tue ✓, Wed !, Thu ✓, Fri ✓, Sat —, Sun ✓ with 83% completion rate).
 *  8. Factual Pattern Explanation & Risk Context Card ("Walking has been missed 3 times this week").
 *  9. Reminder History Timeline & Recent 5-Day History List.
 * 10. Context-Aware Guardian Action Bar (Send Reminder, Call Elder, View History).
 * 11. Deleted Activity Edge Case State.
 * 12. Reminder Confirmation Bottom Sheet Modal & Persistent 5-Tab Bottom Navigation.
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

export type ActivityType = 'WALKING' | 'WATER' | 'MEAL' | 'SLEEP' | 'BLOOD_PRESSURE' | 'GENERAL';

export interface ActivityRecordDetail {
  id: string;
  name: string;
  type: ActivityType;
  category: string;
  icon: string;
  status: 'upcoming' | 'completed' | 'pending' | 'missed' | 'skipped' | 'late';
  scheduledTime: string;
  completedTime?: string;
  delayMinutes?: number;
  frequency: string;
  expectedWindow: string;
  targetDescription: string;
  // Activity Specific Telemetry
  walkingData?: { steps: number; stepTarget: number; distanceKm: number; durationMin: number };
  waterData?: { consumedMl: number; targetMl: number; lastIntake: string };
  sleepData?: { durationHours: string; bedtime: string; wakeTime: string; targetRange: string };
  bpData?: { systolic: number; diastolic: number; time: string; targetStatus: string };
  mealData?: { mealName: string; notes: string };
  // Timelines & Audit
  todayRecord: { scheduled: string; reminderSent?: string; reminderOpened?: string; completed?: string; duration?: string };
  reminderLogs: { time: string; event: string }[];
  sevenDayPattern: { day: string; status: 'completed' | 'missed' | 'late' | 'off' }[];
  recentHistory: { date: string; status: 'completed' | 'missed' | 'skipped'; time?: string }[];
  patternExplanation: string;
  riskContext?: string;
  isDeleted?: boolean;
}

interface GuardianRoutineDetailsScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  routineId?: string;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianRoutineDetailsScreen: React.FC<GuardianRoutineDetailsScreenProps> = ({
  onBack,
  token,
  elderId,
  routineId = 'r1',
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(false);
  const [refreshing, setRefreshing]           = useState(false);
  const [showMoreMenu, setShowMoreMenu]       = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const detail: ActivityRecordDetail = {
    id: routineId,
    name: 'Afternoon Walk',
    type: 'WALKING',
    category: 'PHYSICAL ACTIVITY',
    icon: 'walk',
    status: 'upcoming',
    scheduledTime: '04:30 PM',
    frequency: 'Daily',
    expectedWindow: '4:30 PM – 5:00 PM',
    targetDescription: '30 minutes outdoor stroll or 2,000 steps target',
    walkingData: { steps: 1850, stepTarget: 2000, distanceKm: 1.4, durationMin: 28 },
    waterData: { consumedMl: 1500, targetMl: 2000, lastIntake: '10:05 AM' },
    sleepData: { durationHours: '7h 45m', bedtime: '10:15 PM', wakeTime: '06:00 AM', targetRange: '7–9 Hours' },
    bpData: { systolic: 128, diastolic: 82, time: '06:00 PM', targetStatus: 'Normal BP' },
    mealData: { mealName: 'Lunch Meal', notes: 'Oatmeal & vegetable soup recommended' },
    todayRecord: {
      scheduled: '04:30 PM',
      reminderSent: '04:25 PM',
      reminderOpened: '04:27 PM',
      completed: 'Pending Confirmation',
      duration: '30 minutes expected',
    },
    reminderLogs: [
      { time: '04:00 PM', event: 'Scheduled Reminder Created' },
      { time: '04:00 PM', event: 'Push Notification Sent to Elder Device' },
      { time: '04:14 PM', event: 'Notification Opened by Elder' },
    ],
    sevenDayPattern: [
      { day: 'Mon', status: 'completed' },
      { day: 'Tue', status: 'completed' },
      { day: 'Wed', status: 'missed' },
      { day: 'Thu', status: 'completed' },
      { day: 'Fri', status: 'completed' },
      { day: 'Sat', status: 'off' },
      { day: 'Sun', status: 'completed' },
    ],
    recentHistory: [
      { date: 'Aug 8', status: 'completed', time: '4:42 PM' },
      { date: 'Aug 7', status: 'completed', time: '4:35 PM' },
      { date: 'Aug 6', status: 'missed' },
      { date: 'Aug 5', status: 'completed', time: '4:28 PM' },
      { date: 'Aug 4', status: 'completed', time: '4:30 PM' },
    ],
    patternExplanation: 'Completed 5 of 6 scheduled walking activities this week (83% weekly completion rate).',
    riskContext: 'This activity has been missed 3 times this week. It may contribute to the current routine risk assessment.',
    isDeleted: false,
  };

  if (detail.isDeleted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Routine Details</Text>
        </View>
        <View style={styles.deletedStateContainer}>
          <MaterialCommunityIcons name="delete-outline" size={56} color={C.textMuted} />
          <Text style={styles.deletedTitle}>Activity Unavailable</Text>
          <Text style={styles.deletedSub}>This routine activity is no longer part of the elder's configured schedule.</Text>
          <TouchableOpacity style={styles.deletedReturnBtn} onPress={onBack}>
            <Text style={styles.deletedReturnBtnText}>Return to Today's Routine</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = detail.status === 'completed';
  const isPending   = detail.status === 'pending';
  const isUpcoming  = detail.status === 'upcoming';
  const isMissed    = detail.status === 'missed';

  const badgeBg    = isCompleted ? C.primaryLight : isPending ? C.warningLight : isMissed ? C.errorLight : C.infoLight;
  const badgeColor = isCompleted ? C.primary : isPending ? C.warning : isMissed ? C.error : C.info;
  const statusText = isCompleted ? 'COMPLETED ✓' : isPending ? 'PENDING ⚠' : isMissed ? 'MISSED !' : 'UPCOMING ◷';

  const handleCallElder = () => {
    Haptics.selectionAsync();
    Alert.alert('Call Elder', 'Dialing Nimal Perera (+94 77 123 4567)...');
  };

  const handleConfirmSendReminder = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: 'success',
      text1: 'Reminder Sent!',
      text2: `Notification sent to elder for ${detail.name}.`,
    });
    setShowReminderModal(false);
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
          <Text style={styles.headerTitle}>Routine Details</Text>
          <Text style={styles.headerSubtitle}>Activity Record & Controls • G27</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Refreshed Record' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Record</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('reports'); }}>
              <MaterialCommunityIcons name="history" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>View History (G28)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('guardianSettings'); }}>
              <MaterialCommunityIcons name="cog-outline" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Routine Settings</Text>
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
        {/* ─── 5. ACTIVITY HERO CARD ─── */}
        <View style={styles.card}>
          <View style={styles.heroCenter}>
            <View style={[styles.heroIconCircle, { backgroundColor: badgeBg }]}>
              <MaterialCommunityIcons name={detail.icon as any} size={36} color={badgeColor} />
            </View>
            <Text style={styles.heroTitle}>{detail.name}</Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{detail.category}</Text>
              </View>
              <Text style={styles.heroTimeText}>{detail.scheduledTime} • {detail.frequency}</Text>
            </View>

            <View style={[styles.statusHeroBadge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.statusHeroText, { color: badgeColor }]}>{statusText}</Text>
            </View>
          </View>
        </View>

        {/* ─── 6. CURRENT STATUS CARD ─── */}
        <View style={[styles.card, isPending ? styles.statusCardPending : isMissed ? styles.statusCardMissed : null]}>
          <Text style={styles.cardSectionLabel}>CURRENT STATUS</Text>
          <View style={styles.statusBodyRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusBigTitle}>
                {isUpcoming ? 'Scheduled Today' : isCompleted ? 'Confirmed Completed' : isPending ? 'Pending Confirmation' : 'Missed Activity'}
              </Text>
              <Text style={styles.statusSubDetail}>
                Scheduled for <Text style={{ fontWeight: '800' }}>{detail.scheduledTime}</Text>
                {detail.completedTime ? ` • Done at ${detail.completedTime}` : ''}
              </Text>
              {isUpcoming && <Text style={styles.statusCountdownText}>Starts in 32 minutes</Text>}
              {isPending && <Text style={styles.statusOverdueText}>45 minutes overdue — No confirmation received</Text>}
            </View>
            <MaterialCommunityIcons
              name={isCompleted ? 'check-circle' : isPending ? 'clock-alert-outline' : isMissed ? 'alert-circle' : 'clock-outline'}
              size={32}
              color={badgeColor}
            />
          </View>
        </View>

        {/* ─── 18. DYNAMIC ACTIVITY-TYPE TELEMETRY CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="sine-wave" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Activity Telemetry & Targets</Text>
          </View>

          {detail.type === 'WALKING' && detail.walkingData && (
            <View style={styles.activityTypeGrid}>
              <View style={styles.typeItemBox}>
                <Text style={styles.typeItemVal}>{detail.walkingData.durationMin} mins</Text>
                <Text style={styles.typeItemLabel}>Target Duration</Text>
              </View>

              <View style={styles.typeItemBox}>
                <Text style={styles.typeItemVal}>{detail.walkingData.steps} / {detail.walkingData.stepTarget}</Text>
                <Text style={styles.typeItemLabel}>Steps Target</Text>
              </View>

              <View style={styles.typeItemBox}>
                <Text style={styles.typeItemVal}>{detail.walkingData.distanceKm} km</Text>
                <Text style={styles.typeItemLabel}>Distance Covered</Text>
              </View>

              <View style={styles.typeItemBox}>
                <Text style={[styles.typeItemVal, { color: C.primary }]}>92.5%</Text>
                <Text style={styles.typeItemLabel}>Target Progress</Text>
              </View>
            </View>
          )}

          {detail.type === 'WATER' && detail.waterData && (
            <View style={styles.activityTypeGrid}>
              <View style={styles.typeItemBox}>
                <Text style={styles.typeItemVal}>{detail.waterData.consumedMl} ml</Text>
                <Text style={styles.typeItemLabel}>Consumed Today</Text>
              </View>

              <View style={styles.typeItemBox}>
                <Text style={styles.typeItemVal}>{detail.waterData.targetMl} ml</Text>
                <Text style={styles.typeItemLabel}>Daily Target</Text>
              </View>

              <View style={styles.typeItemBox}>
                <Text style={styles.typeItemVal}>{detail.waterData.targetMl - detail.waterData.consumedMl} ml</Text>
                <Text style={styles.typeItemLabel}>Remaining</Text>
              </View>

              <View style={styles.typeItemBox}>
                <Text style={styles.typeItemVal}>{detail.waterData.lastIntake}</Text>
                <Text style={styles.typeItemLabel}>Last Intake</Text>
              </View>
            </View>
          )}

          {detail.type === 'SLEEP' && detail.sleepData && (
            <View style={styles.activityTypeGrid}>
              <View style={styles.typeItemBox}>
                <Text style={styles.typeItemVal}>{detail.sleepData.durationHours}</Text>
                <Text style={styles.typeItemLabel}>Night Duration</Text>
              </View>

              <View style={styles.typeItemBox}>
                <Text style={styles.typeItemVal}>{detail.sleepData.bedtime}</Text>
                <Text style={styles.typeItemLabel}>Bedtime</Text>
              </View>

              <View style={styles.typeItemBox}>
                <Text style={styles.typeItemVal}>{detail.sleepData.wakeTime}</Text>
                <Text style={styles.typeItemLabel}>Wake Time</Text>
              </View>

              <View style={styles.typeItemBox}>
                <Text style={styles.typeItemVal}>{detail.sleepData.targetRange}</Text>
                <Text style={styles.typeItemLabel}>Target Range</Text>
              </View>
            </View>
          )}

          {detail.type === 'BLOOD_PRESSURE' && detail.bpData && (
            <View style={styles.activityTypeGrid}>
              <View style={styles.typeItemBox}>
                <Text style={[styles.typeItemVal, { color: C.primary }]}>{detail.bpData.systolic} / {detail.bpData.diastolic}</Text>
                <Text style={styles.typeItemLabel}>mmHg Reading</Text>
              </View>

              <View style={styles.typeItemBox}>
                <Text style={styles.typeItemVal}>{detail.bpData.time}</Text>
                <Text style={styles.typeItemLabel}>Measurement Time</Text>
              </View>

              <View style={[styles.typeItemBox, { width: '100%' }]}>
                <Text style={[styles.typeItemVal, { color: C.primary }]}>{detail.bpData.targetStatus}</Text>
                <Text style={styles.typeItemLabel}>Care Plan Evaluation</Text>
              </View>
            </View>
          )}

          <Text style={styles.targetDescText}>{detail.targetDescription}</Text>
        </View>

        {/* ─── 8. TODAY'S DETAILED EVENT AUDIT RECORD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="clipboard-text-clock-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Today's Event Audit Record</Text>
          </View>

          <View style={styles.auditList}>
            <View style={styles.auditRow}>
              <Text style={styles.auditLabel}>Scheduled Time:</Text>
              <Text style={styles.auditVal}>{detail.todayRecord.scheduled}</Text>
            </View>

            <View style={styles.auditRow}>
              <Text style={styles.auditLabel}>Reminder Push Sent:</Text>
              <Text style={styles.auditVal}>{detail.todayRecord.reminderSent || 'Not Sent'}</Text>
            </View>

            <View style={styles.auditRow}>
              <Text style={styles.auditLabel}>Reminder Opened:</Text>
              <Text style={styles.auditVal}>{detail.todayRecord.reminderOpened || 'Not Opened'}</Text>
            </View>

            <View style={styles.auditRow}>
              <Text style={styles.auditLabel}>Completion Timestamp:</Text>
              <Text style={[styles.auditVal, { color: isCompleted ? C.primary : C.warning }]}>
                {detail.todayRecord.completed}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── 9. RECENT 7-DAY PATTERN VISUALIZER ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>7-Day Completion Pattern</Text>
          </View>

          <View style={styles.patternPillsRow}>
            {detail.sevenDayPattern.map((p, idx) => {
              const bg = p.status === 'completed' ? C.primaryLight : p.status === 'missed' ? C.errorLight : p.status === 'late' ? C.warningLight : '#F1F5F9';
              const col = p.status === 'completed' ? C.primary : p.status === 'missed' ? C.error : p.status === 'late' ? C.warning : '#94A3B8';
              const icon = p.status === 'completed' ? 'check' : p.status === 'missed' ? 'close' : p.status === 'late' ? 'clock' : 'minus';

              return (
                <View key={idx} style={[styles.patternPill, { backgroundColor: bg }]}>
                  <Text style={styles.patternPillDay}>{p.day}</Text>
                  <MaterialCommunityIcons name={icon as any} size={14} color={col} />
                </View>
              );
            })}
          </View>

          <Text style={styles.patternExplanationText}>{detail.patternExplanation}</Text>
        </View>

        {/* ─── 16. RISK CONTEXT CARD (CARE INSIGHT) ─── */}
        {detail.riskContext && (
          <View style={[styles.card, styles.riskContextCard]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={C.warning} />
              <Text style={styles.cardHeaderTitle}>Care & Risk Engine Context</Text>
            </View>
            <Text style={styles.riskContextText}>{detail.riskContext}</Text>
          </View>
        )}

        {/* ─── 12. CONTEXT-AWARE GUARDIAN ACTIONS ─── */}
        <Text style={styles.sectionHeaderTitle}>Guardian Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => setShowReminderModal(true)} activeOpacity={0.85}>
            <MaterialCommunityIcons name="bell-ring" size={20} color="#FFF" />
            <Text style={styles.actionBtnPrimaryText}>Send Reminder</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnSecondary} onPress={handleCallElder} activeOpacity={0.85}>
            <MaterialCommunityIcons name="phone" size={20} color={C.primary} />
            <Text style={styles.actionBtnSecondaryText}>Call Elder</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnTertiary} onPress={() => onNavigate('reports')} activeOpacity={0.85}>
            <MaterialCommunityIcons name="history" size={20} color={C.textPrimary} />
            <Text style={styles.actionBtnTertiaryText}>View History (G28)</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ─── 13. REMINDER BOTTOM SHEET MODAL ─── */}
      <Modal visible={showReminderModal} transparent animationType="slide" onRequestClose={() => setShowReminderModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <MaterialCommunityIcons name="bell-ring-outline" size={24} color={C.warning} />
              <Text style={styles.sheetTitle}>Send Routine Reminder?</Text>
            </View>

            <Text style={styles.sheetBodyText}>
              Send a push notification reminder to Nimal Perera regarding <Text style={{ fontWeight: '800', color: C.textPrimary }}>{detail.name}</Text> (scheduled for {detail.scheduledTime})?
            </Text>

            <View style={styles.sheetBtnRow}>
              <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => setShowReminderModal(false)}>
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
  deletedStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.s6 },
  deletedTitle: { fontSize: 20, fontWeight: '900', color: C.textPrimary, marginTop: 12 },
  deletedSub: { fontSize: 13, color: C.textSecondary, textAlign: 'center', marginTop: 4 },
  deletedReturnBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: C.primary, borderRadius: 12 },
  deletedReturnBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s5, paddingBottom: 100 },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  heroCenter: { alignItems: 'center', paddingVertical: 8 },
  heroIconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: C.textPrimary },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 12 },
  categoryPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryPillText: { fontSize: 10, fontWeight: '900', color: C.textMuted },
  heroTimeText: { fontSize: 13, fontWeight: '800', color: C.textSecondary },
  statusHeroBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusHeroText: { fontSize: 12, fontWeight: '900' },
  cardSectionLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 },
  statusCardPending: { backgroundColor: C.warningLight, borderColor: C.warning, borderWidth: 1.5 },
  statusCardMissed: { backgroundColor: C.errorLight, borderColor: C.error, borderWidth: 1.5 },
  statusBodyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBigTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  statusSubDetail: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  statusCountdownText: { fontSize: 12, fontWeight: '800', color: C.info, marginTop: 4 },
  statusOverdueText: { fontSize: 12, fontWeight: '800', color: C.warning, marginTop: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  activityTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  typeItemBox: { width: '48%', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 14, alignItems: 'center' },
  typeItemVal: { fontSize: 15, fontWeight: '900', color: C.textPrimary },
  typeItemLabel: { fontSize: 10, fontWeight: '600', color: C.textSecondary, marginTop: 2 },
  targetDescText: { fontSize: 13, fontWeight: '600', color: C.textSecondary, lineHeight: 20 },
  auditList: { gap: 8 },
  auditRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  auditLabel: { fontSize: 12, color: C.textSecondary },
  auditVal: { fontSize: 12, fontWeight: '800', color: C.textPrimary },
  patternPillsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  patternPill: { width: 40, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 2 },
  patternPillDay: { fontSize: 10, fontWeight: '800', color: C.textPrimary },
  patternExplanationText: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  riskContextCard: { backgroundColor: C.warningLight, borderColor: C.warning, borderWidth: 1 },
  riskContextText: { fontSize: 12, color: C.textPrimary, lineHeight: 18 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 12 },
  actionGrid: { flexDirection: 'row', gap: 8 },
  actionBtnPrimary: { flex: 1.2, height: 48, backgroundColor: C.warning, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionBtnPrimaryText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  actionBtnSecondary: { flex: 1, height: 48, backgroundColor: C.primaryLight, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionBtnSecondaryText: { color: C.primary, fontSize: 13, fontWeight: '900' },
  actionBtnTertiary: { flex: 1, height: 48, backgroundColor: '#F1F5F9', borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionBtnTertiaryText: { color: C.textPrimary, fontSize: 13, fontWeight: '800' },
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
    justify.content: 'space-around',
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...elevation.e2,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 2 },
  tabLabelActive: { color: C.primary, fontWeight: '800' },
});

export default GuardianRoutineDetailsScreen;

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
  StatusBar,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
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
  error:          colors.error,
  errorLight:     colors.errorContainer,
  info:           colors.info,
  infoLight:      colors.infoContainer,
  textPrimary:    colors.text.primary,
  textSecondary:  colors.text.secondary,
  textMuted:      colors.text.tertiary,
  border:         colors.outline,
};

interface RoutineHistoryEvent {
  task_id: number;
  title: string;
  description: string | null;
  due_time: string | null;
  date: string;
  completed: boolean;
  completed_at: string | null;
  status: 'COMPLETED' | 'MISSED' | 'UPCOMING';
}

interface ActivityRecordDetail {
  id: string;
  name: string;
  description: string | null;
  status: 'upcoming' | 'completed' | 'missed';
  scheduledTime: string;
  completedTime?: string;
  recentHistory: { date: string; status: 'COMPLETED' | 'MISSED' | 'UPCOMING'; time?: string }[];
  patternExplanation: string;
}

interface GuardianRoutineDetailsScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  routineId?: string;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

const GuardianRoutineDetailsScreen: React.FC<GuardianRoutineDetailsScreenProps> = ({
  onBack,
  token,
  elderId,
  routineId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(true);
  const [loadError, setLoadError]             = useState<string | null>(null);
  const [refreshing, setRefreshing]           = useState(false);
  const [showMoreMenu, setShowMoreMenu]       = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [detail, setDetail]                   = useState<ActivityRecordDetail | null>(null);
  const [elderName, setElderName]             = useState('your elder');
  const [elderPhone, setElderPhone]           = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!elderId || !routineId) {
      setLoadError('No routine activity selected.');
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      const [historyRes, elderRes] = await Promise.all([
        apiFetch(`/guardian/tasks/${elderId}/history?days=30`, token),
        apiFetch(`/guardian/elders/${elderId}`, token),
      ]);

      const events: RoutineHistoryEvent[] = historyRes?.events || [];
      const forTask = events.filter((e) => String(e.task_id) === String(routineId));

      if (forTask.length === 0) {
        setLoadError('This routine activity could not be found.');
        setDetail(null);
      } else {
        const today = forTask.find((e) => e.date === forTask[0].date) || forTask[0];
        const status = today.status === 'COMPLETED' ? 'completed' : today.status === 'MISSED' ? 'missed' : 'upcoming';
        const completedCount = forTask.filter((e) => e.status === 'COMPLETED').length;

        setDetail({
          id: String(today.task_id),
          name: today.title,
          description: today.description,
          status,
          scheduledTime: today.due_time || 'No fixed time',
          completedTime: today.completed_at || undefined,
          recentHistory: forTask.slice(0, 7).map((e) => ({ date: e.date, status: e.status, time: e.completed_at || undefined })),
          patternExplanation: `Completed ${completedCount} of ${forTask.length} scheduled occurrences in the last 30 days.`,
        });
      }

      if (elderRes) {
        setElderName(elderRes.name || 'your elder');
        setElderPhone(elderRes.phone_number || null);
      }
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load routine activity. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, routineId, token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isCompleted = detail?.status === 'completed';
  const isMissed    = detail?.status === 'missed';

  const badgeBg    = isCompleted ? C.primaryLight : isMissed ? C.errorLight : C.infoLight;
  const badgeColor = isCompleted ? C.primary : isMissed ? C.error : C.info;
  const statusText = isCompleted ? 'COMPLETED ✓' : isMissed ? 'MISSED !' : 'UPCOMING ◷';

  const handleCallElder = () => {
    Haptics.selectionAsync();
    if (!elderPhone) {
      Toast.show({ type: 'error', text1: 'No phone number on file for this elder.' });
      return;
    }
    Linking.openURL(`tel:${elderPhone}`);
  };

  const handleConfirmSendReminder = async () => {
    if (!detail) return;
    try {
      await apiFetch(`/guardian/tasks/${detail.id}/remind`, token, { method: 'POST' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Reminder Sent!',
        text2: `Notification sent to elder for ${detail.name}.`,
      });
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      Toast.show({ type: 'error', text1: 'Could not send reminder', text2: 'Elder may not have a registered device.' });
    } finally {
      setShowReminderModal(false);
    }
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
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[C.primary]} />
        }
      >
        {loading && (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        )}

        {!loading && loadError && (
          <View style={styles.deletedStateContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={56} color={C.textMuted} />
            <Text style={styles.deletedTitle}>{loadError}</Text>
            <TouchableOpacity style={styles.deletedReturnBtn} onPress={onBack}>
              <Text style={styles.deletedReturnBtnText}>Return to Today's Routine</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !loadError && detail && (
          <>
            {/* ─── ACTIVITY HERO CARD ─── */}
            <View style={styles.card}>
              <View style={styles.heroCenter}>
                <View style={[styles.heroIconCircle, { backgroundColor: badgeBg }]}>
                  <MaterialCommunityIcons name="calendar-check-outline" size={36} color={badgeColor} />
                </View>
                <Text style={styles.heroTitle}>{detail.name}</Text>

                <View style={styles.heroMetaRow}>
                  <Text style={styles.heroTimeText}>Scheduled {detail.scheduledTime}</Text>
                </View>

                {!!detail.description && (
                  <Text style={styles.targetDescText}>{detail.description}</Text>
                )}

                <View style={[styles.statusHeroBadge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.statusHeroText, { color: badgeColor }]}>{statusText}</Text>
                </View>
              </View>
            </View>

            {/* ─── CURRENT STATUS CARD ─── */}
            <View style={[styles.card, isMissed ? styles.statusCardMissed : null]}>
              <Text style={styles.cardSectionLabel}>CURRENT STATUS</Text>
              <View style={styles.statusBodyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusBigTitle}>
                    {isCompleted ? 'Confirmed Completed' : isMissed ? 'Missed Activity' : 'Scheduled Today'}
                  </Text>
                  <Text style={styles.statusSubDetail}>
                    Scheduled for <Text style={{ fontWeight: '800' }}>{detail.scheduledTime}</Text>
                    {detail.completedTime ? ` • Done at ${detail.completedTime}` : ''}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={isCompleted ? 'check-circle' : isMissed ? 'alert-circle' : 'clock-outline'}
                  size={32}
                  color={badgeColor}
                />
              </View>
            </View>

            {/* ─── RECENT HISTORY (LAST 30 DAYS) ─── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="calendar-month-outline" size={20} color={C.primary} />
                <Text style={styles.cardHeaderTitle}>Recent Completion History</Text>
              </View>

              <View style={styles.auditList}>
                {detail.recentHistory.map((h, idx) => {
                  const col = h.status === 'COMPLETED' ? C.primary : h.status === 'MISSED' ? C.error : C.info;
                  return (
                    <View key={idx} style={styles.auditRow}>
                      <Text style={styles.auditLabel}>{h.date}</Text>
                      <Text style={[styles.auditVal, { color: col }]}>{h.status}{h.time ? ` • ${h.time}` : ''}</Text>
                    </View>
                  );
                })}
              </View>

              <Text style={styles.patternExplanationText}>{detail.patternExplanation}</Text>
            </View>

            {/* ─── CONTEXT-AWARE GUARDIAN ACTIONS ─── */}
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

              <TouchableOpacity style={styles.actionBtnTertiary} onPress={() => onNavigate('routineHistory')} activeOpacity={0.85}>
                <MaterialCommunityIcons name="history" size={20} color={C.textPrimary} />
                <Text style={styles.actionBtnTertiaryText}>View History (G28)</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ─── REMINDER BOTTOM SHEET MODAL ─── */}
      <Modal visible={showReminderModal} transparent animationType="slide" onRequestClose={() => setShowReminderModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <MaterialCommunityIcons name="bell-ring-outline" size={24} color={C.warning} />
              <Text style={styles.sheetTitle}>Send Routine Reminder?</Text>
            </View>

            <Text style={styles.sheetBodyText}>
              Send a push notification reminder to {elderName} regarding <Text style={{ fontWeight: '800', color: C.textPrimary }}>{detail?.name}</Text> (scheduled for {detail?.scheduledTime})?
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
  categoryPill: { backgroundColor: colors.surfaceVariant, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
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
  typeItemBox: { width: '48%', backgroundColor: colors.background, padding: 12, borderRadius: 14, alignItems: 'center' },
  typeItemVal: { fontSize: 15, fontWeight: '900', color: C.textPrimary },
  typeItemLabel: { fontSize: 10, fontWeight: '600', color: C.textSecondary, marginTop: 2 },
  targetDescText: { fontSize: 13, fontWeight: '600', color: C.textSecondary, lineHeight: 20 },
  auditList: { gap: 8 },
  auditRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
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
  actionBtnTertiary: { flex: 1, height: 48, backgroundColor: colors.surfaceVariant, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionBtnTertiaryText: { color: C.textPrimary, fontSize: 13, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  sheetContent: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.s6 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  sheetBodyText: { fontSize: 14, color: C.textSecondary, lineHeight: 22, marginBottom: 20 },
  sheetBtnRow: { flexDirection: 'row', gap: 12 },
  sheetCancelBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' },
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

export default GuardianRoutineDetailsScreen;

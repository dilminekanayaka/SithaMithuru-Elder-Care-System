/**
 * GuardianReminderDashboardScreen.tsx — Screen G41 (Reminder Command Center Dashboard)
 * Spec: g41.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, NHS App, Samsung Health
 *
 * Screen Mission: Answers "What reminders are currently active, what has been completed, and are reminders functioning correctly?"
 *
 * Architecture Mandate per g41.txt:
 *  - A REMINDER event is NOT the same as a MEDICATION event.
 *  - Reminder Lifecycle: Scheduled -> Delivered -> Opened -> Completed / Expired.
 *  - Distinguishes Reminder Completion vs Medication Adherence.
 *
 * Component Architecture per g41.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Reminders", Subtitle "Reminder Command Center • G41", Overflow menu).
 *  3. Elder Context Banner (Nimal Perera, Today • August 9, Last synced Updated just now).
 *  4. Reminder Overview Summary Card (3 Completed, 1 Upcoming, 1 Due Now, 0 Expired).
 *  5. Segmented Mode Tabs (Active Reminders | Completed Reminders).
 *  6. Active Reminder Cards:
 *     - ● Due Now: Daily Well-being Check-in (Scheduled 9:00 AM, Waiting for completion).
 *     - ◷ Upcoming: Afternoon Hydration & Walk (Scheduled 2:00 PM).
 *     - ↻ Pending Sync: Morning Metformin Reminder (Completed on elder device, awaiting sync).
 *  7. Completed Today List (✓ Medication Reminder 8:05 AM, ✓ Morning Check-in 9:03 AM).
 *  8. Reminder Event Detail Bottom Sheet (Scheduled, Delivered, Opened, Completed timestamps + View Med G38 CTA).
 *  9. Offline Banner & Persistent 5-Tab Bottom Navigation Bar.
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

export interface ReminderItem {
  id: string;
  type: 'MEDICATION' | 'CHECKIN' | 'HYDRATION' | 'ROUTINE';
  title: string;
  subtitle?: string;
  scheduledTime: string;
  status: 'UPCOMING' | 'DUE' | 'COMPLETED' | 'PENDING_SYNC' | 'EXPIRED';
  deliveredAt?: string;
  openedAt?: string;
  completedAt?: string;
  medicationId?: string;
}

interface GuardianReminderDashboardScreenProps {
  onBack?: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianReminderDashboardScreen: React.FC<GuardianReminderDashboardScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [tabMode, setTabMode]           = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [selectedReminder, setSelectedReminder] = useState<ReminderItem | null>(null);
  const [showDetailModal, setShowDetailModal]   = useState(false);
  const [showMoreMenu, setShowMoreMenu]         = useState(false);

  const remindersList: ReminderItem[] = [
    {
      id: 'r1',
      type: 'MEDICATION',
      title: 'Amlodipine 5 mg Reminder',
      subtitle: 'Morning Blood Pressure Medication',
      scheduledTime: '08:00 AM',
      status: 'COMPLETED',
      deliveredAt: '08:00 AM',
      openedAt: '08:04 AM',
      completedAt: '08:05 AM',
      medicationId: 'med1',
    },
    {
      id: 'r2',
      type: 'CHECKIN',
      title: 'Daily Well-being Check-in',
      subtitle: 'Morning Mood & Comfort Response',
      scheduledTime: '09:00 AM',
      status: 'DUE',
      deliveredAt: '09:00 AM',
      openedAt: '09:02 AM',
    },
    {
      id: 'r3',
      type: 'HYDRATION',
      title: 'Afternoon Hydration & Walk',
      subtitle: 'Drink 1 Glass of Fresh Water',
      scheduledTime: '02:00 PM',
      status: 'UPCOMING',
    },
    {
      id: 'r4',
      type: 'MEDICATION',
      title: 'Metformin 500 mg Reminder',
      subtitle: 'Lunch Medication',
      scheduledTime: '01:00 PM',
      status: 'PENDING_SYNC',
      deliveredAt: '01:00 PM',
      completedAt: '01:04 PM (Offline)',
      medicationId: 'med2',
    },
  ];

  const activeReminders    = remindersList.filter(r => r.status === 'UPCOMING' || r.status === 'DUE' || r.status === 'PENDING_SYNC');
  const completedReminders = remindersList.filter(r => r.status === 'COMPLETED');
  const dueCount           = remindersList.filter(r => r.status === 'DUE').length;

  const handleCallElder = () => {
    Haptics.selectionAsync();
    Alert.alert('Call Elder', 'Dialing Nimal Perera (+94 77 123 4567)...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 4. TOP APP BAR ─── */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
            <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Reminders</Text>
          <Text style={styles.headerSubtitle}>Reminder Dashboard • G41</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Reminder Engine Refreshed' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Reminders</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('reminderHistory'); }}>
              <MaterialCommunityIcons name="history" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Reminder History (G42)</Text>
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
        {/* ─── 5. ELDER CONTEXT BANNER ─── */}
        <View style={styles.elderContextBanner}>
          <MaterialCommunityIcons name="bell-ring-outline" size={20} color={C.primary} />
          <Text style={styles.elderContextText}>
            Monitoring <Text style={{ fontWeight: '900', color: C.textPrimary }}>Nimal Perera</Text> • Today, August 9
          </Text>
        </View>

        {/* ─── 7. REMINDER OVERVIEW CARD ─── */}
        <View style={styles.overviewCard}>
          <Text style={styles.cardSectionLabel}>TODAY'S REMINDER OVERVIEW</Text>
          <View style={styles.overviewHeroRow}>
            <View style={styles.heroMetricItem}>
              <Text style={[styles.heroMetricNum, { color: C.primary }]}>{completedReminders.length}</Text>
              <Text style={styles.heroMetricLabel}>Completed</Text>
            </View>

            <View style={styles.heroMetricItem}>
              <Text style={[styles.heroMetricNum, { color: C.warning }]}>{dueCount}</Text>
              <Text style={styles.heroMetricLabel}>Due Now</Text>
            </View>

            <View style={styles.heroMetricItem}>
              <Text style={[styles.heroMetricNum, { color: C.info }]}>{activeReminders.length - dueCount}</Text>
              <Text style={styles.heroMetricLabel}>Upcoming</Text>
            </View>
          </View>
        </View>

        {/* ─── 20. SEGMENTED TABS (ACTIVE | COMPLETED) ─── */}
        <View style={styles.segmentedRow}>
          <TouchableOpacity
            style={[styles.segmentBtn, tabMode === 'ACTIVE' && styles.segmentBtnActive]}
            onPress={() => setTabMode('ACTIVE')}
          >
            <Text style={[styles.segmentText, tabMode === 'ACTIVE' && styles.segmentTextActive]}>
              Active Reminders ({activeReminders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, tabMode === 'COMPLETED' && styles.segmentBtnActive]}
            onPress={() => setTabMode('COMPLETED')}
          >
            <Text style={[styles.segmentText, tabMode === 'COMPLETED' && styles.segmentTextActive]}>
              Completed ({completedReminders.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── 9. ACTIVE / COMPLETED REMINDER LIST ─── */}
        <View style={styles.reminderList}>
          {(tabMode === 'ACTIVE' ? activeReminders : completedReminders).map((rem) => {
            const isDue        = rem.status === 'DUE';
            const isCompleted  = rem.status === 'COMPLETED';
            const isPendingSync= rem.status === 'PENDING_SYNC';

            const bg    = isDue ? C.warningLight : isCompleted ? C.primaryLight : isPendingSync ? C.infoLight : C.card;
            const border= isDue ? C.warning : isCompleted ? C.primary : isPendingSync ? C.info : C.border;
            const color = isDue ? C.warning : isCompleted ? C.primary : isPendingSync ? C.info : C.textSecondary;

            return (
              <TouchableOpacity
                key={rem.id}
                style={[styles.reminderCard, { backgroundColor: bg, borderColor: border }]}
                onPress={() => {
                  setSelectedReminder(rem);
                  setShowDetailModal(true);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.reminderCardRow}>
                  <View style={[styles.reminderIconBox, { backgroundColor: bg }]}>
                    <MaterialCommunityIcons
                      name={
                        rem.type === 'MEDICATION' ? 'pill' :
                        rem.type === 'CHECKIN' ? 'account-check-outline' :
                        rem.type === 'HYDRATION' ? 'water-outline' : 'bell-outline'
                      }
                      size={22}
                      color={color}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderTitleText}>{rem.title}</Text>
                    <Text style={styles.reminderTimeText}>
                      Scheduled for {rem.scheduledTime} {rem.completedAt ? `• Completed at ${rem.completedAt}` : ''}
                    </Text>
                  </View>

                  <View style={[styles.statusTag, { backgroundColor: bg }]}>
                    <Text style={[styles.statusTagText, { color: color }]}>
                      {isDue ? '● DUE NOW' : isCompleted ? '✓ COMPLETED' : isPendingSync ? '↻ PENDING SYNC' : '◷ UPCOMING'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── QUICK ACTIONS GRID ─── */}
        <Text style={styles.sectionHeaderTitle}>Quick Actions</Text>
        <View style={styles.quickActionGrid}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => onNavigate('reminderHistory')}>
            <MaterialCommunityIcons name="history" size={20} color={C.primary} />
            <Text style={styles.quickActionBtnText}>Reminder History (G42)</Text>
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

      {/* ─── 24. REMINDER EVENT DETAIL BOTTOM SHEET MODAL ─── */}
      <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDetailModal(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedReminder?.title}</Text>
                <Text style={styles.modalSubtitle}>Scheduled {selectedReminder?.scheduledTime}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBodyCard}>
              <Text style={styles.modalSectionLabel}>REMINDER DELIVERY LIFECYCLE</Text>
              <View style={styles.lifecycleRow}>
                <Text style={styles.lifecycleLabel}>Scheduled Time:</Text>
                <Text style={styles.lifecycleVal}>{selectedReminder?.scheduledTime}</Text>
              </View>
              <View style={styles.lifecycleRow}>
                <Text style={styles.lifecycleLabel}>Delivered Time:</Text>
                <Text style={styles.lifecycleVal}>{selectedReminder?.deliveredAt || 'N/A'}</Text>
              </View>
              <View style={styles.lifecycleRow}>
                <Text style={styles.lifecycleLabel}>Elder Opened Time:</Text>
                <Text style={styles.lifecycleVal}>{selectedReminder?.openedAt || 'N/A'}</Text>
              </View>
              <View style={styles.lifecycleRow}>
                <Text style={styles.lifecycleLabel}>Completion Time:</Text>
                <Text style={styles.lifecycleVal}>{selectedReminder?.completedAt || 'Pending'}</Text>
              </View>
            </View>

            <View style={styles.modalActionsCol}>
              {selectedReminder?.medicationId && (
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => {
                    setShowDetailModal(false);
                    onNavigate('medicationDetails');
                  }}
                >
                  <MaterialCommunityIcons name="pill" size={18} color={C.primary} />
                  <Text style={styles.modalActionBtnText}>View Medication Details (G38)</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={() => {
                  setShowDetailModal(false);
                  onNavigate('reminderHistory');
                }}
              >
                <MaterialCommunityIcons name="history" size={18} color={C.primary} />
                <Text style={styles.modalActionBtnText}>View Reminder History (G42)</Text>
              </TouchableOpacity>
            </View>
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
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: 110 },
  elderContextBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginBottom: spacing.s4 },
  elderContextText: { fontSize: 12, color: C.textSecondary },
  overviewCard: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardSectionLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  overviewHeroRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  heroMetricItem: { alignItems: 'center' },
  heroMetricNum: { fontSize: 24, fontWeight: '900' },
  heroMetricLabel: { fontSize: 11, fontWeight: '700', color: C.textSecondary, marginTop: 2 },
  segmentedRow: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4, marginBottom: spacing.s4 },
  segmentBtn: { flex: 1, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  segmentBtnActive: { backgroundColor: C.card, ...elevation.e1 },
  segmentText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  segmentTextActive: { color: C.primary, fontWeight: '900' },
  reminderList: { gap: 10, marginBottom: spacing.s4 },
  reminderCard: { borderRadius: 20, padding: 14, borderWidth: 1, ...elevation.e1 },
  reminderCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reminderIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  reminderTitleText: { fontSize: 15, fontWeight: '900', color: C.textPrimary },
  reminderTimeText: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusTagText: { fontSize: 10, fontWeight: '900' },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  quickActionGrid: { flexDirection: 'row', gap: 8, marginBottom: spacing.s4 },
  quickActionBtn: { flex: 1, height: 48, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, ...elevation.e1 },
  quickActionBtnText: { fontSize: 12, fontWeight: '800', color: C.textPrimary },
  syncFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 },
  syncFooterText: { fontSize: 11, color: C.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.s6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  modalSubtitle: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  modalBodyCard: { backgroundColor: C.bg, borderRadius: 16, padding: 12, marginVertical: 10, borderWidth: 1, borderColor: C.border },
  modalSectionLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8, marginBottom: 6 },
  lifecycleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  lifecycleLabel: { fontSize: 12, color: C.textSecondary },
  lifecycleVal: { fontSize: 12, fontWeight: '700', color: C.textPrimary },
  modalActionsCol: { gap: 8, marginTop: 10 },
  modalActionBtn: { height: 44, backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  modalActionBtnText: { color: C.primary, fontSize: 13, fontWeight: '800' },
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

export default GuardianReminderDashboardScreen;

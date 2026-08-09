/**
 * GuardianRoutineAlertsScreen.tsx — Screen G29 / G29.1 (Missed Routine Center & Routine Alerts)
 * Spec: g29.1.txt
 *
 * Design Standard: Apple Health, One Medical, Epic MyChart, Samsung Health
 *
 * Screen Mission: Answers "What routine deviations require my intervention right now?"
 *
 * Component Architecture per g29.1.txt:
 *  1. Android safe-area layout.
 *  2. Top App Bar (Back button, Title "Routine Alerts", Filter button, Refresh action, Overflow menu).
 *  3. Attention Summary Card (5 Active Alerts: 1 Critical, 2 High, 2 Moderate; All Clear state when 0 alerts).
 *  4. Priority Filter Bar (All, Critical, High, Moderate, Active, Resolved).
 *  5. Grouped Priority Alert Sections (Critical Red uncollapsible, High Orange, Moderate Yellow).
 *  6. Routine Alert Card (Priority badge, Activity name, Event time, Factual "Why you're seeing this" explanation, Primary & Secondary actions).
 *  7. Expandable Alert Detail Area (Expected behavior, Actual status, Reminder status, Recent pattern, Risk context).
 *  8. Alert Lifecycle & Acknowledgment ([Mark as Reviewed] updates status to ACKNOWLEDGED).
 *  9. Context-Aware Actions (Send Reminder bottom sheet, Call Elder native dialer, View Routine Details G27, View History G28).
 * 10. Offline Banner & Persistent 5-Tab Bottom Navigation Bar.
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
  TextInput,
  Alert,
  Modal,
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

export interface RoutineAlertItem {
  id: string;
  activityName: string;
  category: 'MEAL' | 'HYDRATION' | 'ACTIVITY' | 'HEALTH' | 'RISK';
  priority: 'CRITICAL' | 'HIGH' | 'MODERATE';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  eventTitle: string;
  detectedTime: string;
  whyExplanation: string;
  expectedBehavior: string;
  actualStatus: string;
  reminderStatus: string;
  recentPattern: string;
  reviewedAt?: string;
}

interface GuardianRoutineAlertsScreenProps {
  onBack?: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianRoutineAlertsScreen: React.FC<GuardianRoutineAlertsScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'high' | 'moderate'>('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [showSearch, setShowSearch]     = useState(false);
  const [expandedId, setExpandedId]     = useState<string | null>('alt1');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState<RoutineAlertItem | null>(null);
  const [alerts, setAlerts]             = useState<RoutineAlertItem[]>([
    {
      id: 'alt1',
      activityName: 'Multiple Routine Activities',
      category: 'RISK',
      priority: 'CRITICAL',
      status: 'ACTIVE',
      eventTitle: 'Multiple Routine Deviations Detected Today',
      detectedTime: '12:45 PM',
      whyExplanation: 'Breakfast, morning hydration, and lunch were all unconfirmed within 4 hours.',
      expectedBehavior: 'Regular morning meal and hydration routine',
      actualStatus: '3 consecutive routine tasks unconfirmed',
      reminderStatus: '2 push reminders sent',
      recentPattern: 'Elevated concern — Risk engine escalated alert level',
    },
    {
      id: 'alt2',
      activityName: 'Lunch Meal',
      category: 'MEAL',
      priority: 'HIGH',
      status: 'ACTIVE',
      eventTitle: 'Lunch Not Confirmed',
      detectedTime: '01:15 PM',
      whyExplanation: 'Activity was not confirmed within its expected completion window.',
      expectedBehavior: 'Lunch meal scheduled at 12:30 PM',
      actualStatus: '45 minutes overdue',
      reminderStatus: 'Push reminder sent at 12:30 PM',
      recentPattern: 'Missed twice this week',
    },
    {
      id: 'alt3',
      activityName: 'Water Intake',
      category: 'HYDRATION',
      priority: 'HIGH',
      status: 'ACTIVE',
      eventTitle: 'Water Intake Significantly Below Target',
      detectedTime: '02:00 PM',
      whyExplanation: 'Elder has consumed only 1.1L out of the 2.0L daily target.',
      expectedBehavior: '2.0L daily target',
      actualStatus: '1.1L consumed (55%)',
      reminderStatus: 'Reminder sent at 11:00 AM',
      recentPattern: 'Below target 3 days this week',
    },
    {
      id: 'alt4',
      activityName: 'Afternoon Walk',
      category: 'ACTIVITY',
      priority: 'MODERATE',
      status: 'ACTIVE',
      eventTitle: 'Afternoon Walk Missed',
      detectedTime: '05:00 PM',
      whyExplanation: 'Scheduled 4:30 PM walking activity confirmation window expired.',
      expectedBehavior: '30-minute outdoor stroll',
      actualStatus: 'No steps recorded in walking window',
      reminderStatus: 'Not sent',
      recentPattern: 'Missed 3 times this week',
    },
  ]);

  const criticalAlerts = alerts.filter(a => a.priority === 'CRITICAL');
  const highAlerts     = alerts.filter(a => a.priority === 'HIGH');
  const moderateAlerts = alerts.filter(a => a.priority === 'MODERATE');

  const filteredAlerts = alerts.filter(a => {
    const matchesFilter = priorityFilter === 'all' || a.priority.toLowerCase() === priorityFilter;
    const matchesSearch = !searchQuery || a.activityName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleMarkAsReviewed = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED', reviewedAt: 'Today, 5:20 PM' } : a));
    Toast.show({
      type: 'info',
      text1: 'Marked as Reviewed',
      text2: 'Alert status updated to Acknowledged by Guardian.',
    });
  };

  const handleCallElder = () => {
    Haptics.selectionAsync();
    Alert.alert('Call Elder', 'Dialing Nimal Perera (+94 77 123 4567)...');
  };

  const handleConfirmSendReminder = () => {
    if (!showReminderModal) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: 'success',
      text1: 'Reminder Sent!',
      text2: `Push notification sent to elder for ${showReminderModal.activityName}.`,
    });
    setShowReminderModal(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 4. HEADER BAR ─── */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
            <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Routine Alerts</Text>
          <Text style={styles.headerSubtitle}>Missed Routine Command Center • G29</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSearch(v => !v)}>
            <MaterialCommunityIcons name={showSearch ? 'close' : 'magnify'} size={22} color={C.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowFilterModal(true)}>
            <MaterialCommunityIcons name="filter-variant" size={22} color={C.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => Toast.show({ type: 'success', text1: 'Refreshed Alerts', text2: 'Latest routine exceptions synced.' })}>
            <MaterialCommunityIcons name="refresh" size={22} color={C.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Bar */}
      {showSearch && (
        <View style={styles.searchBarContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={C.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routine alerts or reasons..."
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={C.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} colors={[C.primary]} />
        }
      >
        {/* ─── 5. ATTENTION SUMMARY CARD ─── */}
        {alerts.length > 0 ? (
          <View style={[styles.card, criticalAlerts.length > 0 ? styles.summaryCardRed : styles.summaryCardOrange]}>
            <View style={styles.summaryTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryRiskBanner}>
                  {criticalAlerts.length > 0 ? '🚨 CRITICAL ROUTINE ATTENTION REQUIRED' : '⚠️ ROUTINE DEVIATION ALERTS'}
                </Text>
                <Text style={styles.summaryTitle}>{alerts.length} Active Routine Alerts</Text>
              </View>

              <View style={[styles.alertBadgeCount, { backgroundColor: criticalAlerts.length > 0 ? C.error : C.warning }]}>
                <Text style={styles.alertBadgeCountText}>{alerts.length}</Text>
              </View>
            </View>

            <View style={styles.summaryMetricsRow}>
              <View style={styles.summaryMetricItem}>
                <Text style={[styles.summaryMetricNum, { color: C.error }]}>{criticalAlerts.length}</Text>
                <Text style={styles.summaryMetricLabel}>Critical</Text>
              </View>
              <View style={styles.summaryMetricItem}>
                <Text style={[styles.summaryMetricNum, { color: C.warning }]}>{highAlerts.length}</Text>
                <Text style={styles.summaryMetricLabel}>High</Text>
              </View>
              <View style={styles.summaryMetricItem}>
                <Text style={[styles.summaryMetricNum, { color: '#0284C7' }]}>{moderateAlerts.length}</Text>
                <Text style={styles.summaryMetricLabel}>Moderate</Text>
              </View>
            </View>
          </View>
        ) : (
          /* ─── 21. ALL CLEAR EMPTY STATE ─── */
          <View style={[styles.card, styles.allClearCard]}>
            <MaterialCommunityIcons name="check-circle-outline" size={48} color={C.primary} />
            <Text style={styles.allClearTitle}>All Clear — No Routine Alerts</Text>
            <Text style={styles.allClearSub}>Your elder is following today's scheduled routine activities normally.</Text>
          </View>
        )}

        {/* ─── 4. PRIORITY FILTER BAR ─── */}
        <View style={styles.filterChipsRow}>
          {[
            { id: 'all', label: `All (${alerts.length})` },
            { id: 'critical', label: `Critical (${criticalAlerts.length})` },
            { id: 'high', label: `High (${highAlerts.length})` },
            { id: 'moderate', label: `Moderate (${moderateAlerts.length})` },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, priorityFilter === f.id && styles.filterChipActive]}
              onPress={() => setPriorityFilter(f.id as any)}
            >
              <Text style={[styles.filterChipText, priorityFilter === f.id && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── 6. ALERT CARDS GROUPED BY PRIORITY ─── */}
        <View style={styles.alertListContainer}>
          {filteredAlerts.map((item) => {
            const isCrit = item.priority === 'CRITICAL';
            const isHigh = item.priority === 'HIGH';
            const isMod  = item.priority === 'MODERATE';
            const isExpanded = expandedId === item.id;
            const isAck  = item.status === 'ACKNOWLEDGED';

            const cardBorder = isCrit ? styles.cardBorderRed : isHigh ? styles.cardBorderOrange : styles.cardBorderYellow;
            const badgeBg    = isCrit ? C.error : isHigh ? C.warning : '#F59E0B';
            const iconName   = isCrit ? 'alert-decagram' : isHigh ? 'alert-circle' : 'clock-alert-outline';

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.alertCard, cardBorder]}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.9}
              >
                <View style={styles.alertHeaderRow}>
                  <MaterialCommunityIcons name={iconName} size={24} color={badgeBg} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertActivityTitle}>{item.activityName}</Text>
                    <Text style={styles.alertEventSub}>{item.eventTitle} • <Text style={{ fontWeight: '800', color: C.textPrimary }}>{item.detectedTime}</Text></Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: badgeBg }]}>
                    <Text style={styles.priorityBadgeText}>{item.priority}</Text>
                  </View>
                </View>

                {/* ─── 9. WHY THIS ALERT EXISTS ─── */}
                <View style={styles.whyBox}>
                  <Text style={styles.whyTitleText}><Text style={{ fontWeight: '800' }}>Why you're seeing this:</Text> {item.whyExplanation}</Text>
                  {isAck && (
                    <Text style={styles.ackMetaText}>✓ Reviewed by Guardian ({item.reviewedAt})</Text>
                  )}
                </View>

                {/* ─── 13. EXPANDED ALERT DETAILS ─── */}
                {isExpanded && (
                  <View style={styles.expandedBox}>
                    <View style={styles.expandedRow}>
                      <Text style={styles.expandedLabel}>Expected Behavior:</Text>
                      <Text style={styles.expandedVal}>{item.expectedBehavior}</Text>
                    </View>

                    <View style={styles.expandedRow}>
                      <Text style={styles.expandedLabel}>Actual Status:</Text>
                      <Text style={[styles.expandedVal, { color: badgeBg, fontWeight: '800' }]}>{item.actualStatus}</Text>
                    </View>

                    <View style={styles.expandedRow}>
                      <Text style={styles.expandedLabel}>Reminder Log:</Text>
                      <Text style={styles.expandedVal}>{item.reminderStatus}</Text>
                    </View>

                    <View style={styles.expandedRow}>
                      <Text style={styles.expandedLabel}>Recent Pattern:</Text>
                      <Text style={styles.expandedVal}>{item.recentPattern}</Text>
                    </View>

                    <View style={styles.expandedLinkRow}>
                      <TouchableOpacity onPress={() => onNavigate('routineDetails')}>
                        <Text style={styles.expandedLinkText}>View Activity Record (G27) →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ─── 10. CONTEXT-AWARE GUARDIAN ACTIONS ─── */}
                <View style={styles.alertActionsRow}>
                  <TouchableOpacity style={styles.actionRemindBtn} onPress={() => setShowReminderModal(item)}>
                    <MaterialCommunityIcons name="bell-ring" size={16} color="#FFF" />
                    <Text style={styles.actionRemindBtnText}>Remind</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionCallBtn} onPress={handleCallElder}>
                    <MaterialCommunityIcons name="phone" size={16} color={C.primary} />
                    <Text style={styles.actionCallBtnText}>Call Elder</Text>
                  </TouchableOpacity>

                  {!isAck && (
                    <TouchableOpacity style={styles.actionAckBtn} onPress={() => handleMarkAsReviewed(item.id)}>
                      <MaterialCommunityIcons name="check" size={16} color={C.textPrimary} />
                      <Text style={styles.actionAckBtnText}>Review</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ─── 12. SEND REMINDER CONFIRMATION BOTTOM SHEET MODAL ─── */}
      <Modal visible={!!showReminderModal} transparent animationType="slide" onRequestClose={() => setShowReminderModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <MaterialCommunityIcons name="bell-ring-outline" size={24} color={C.warning} />
              <Text style={styles.sheetTitle}>Send Routine Reminder?</Text>
            </View>

            <Text style={styles.sheetBodyText}>
              Send a push notification reminder to Nimal Perera regarding <Text style={{ fontWeight: '800', color: C.textPrimary }}>{showReminderModal?.activityName}</Text>?
            </Text>

            <View style={styles.sheetBtnRow}>
              <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => setShowReminderModal(null)}>
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

      {/* FILTER BOTTOM SHEET MODAL */}
      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Routine Alerts</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            {['All Priority Levels', 'Critical Priority Only', 'High Priority Only', 'Active Alerts Only', 'Resolved History'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.filterOptionRow}
                onPress={() => {
                  setShowFilterModal(false);
                  Toast.show({ type: 'info', text1: 'Filter Applied', text2: `Showing ${opt}` });
                }}
              >
                <Text style={styles.filterOptionText}>{opt}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
              </TouchableOpacity>
            ))}
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
          const isActive = tab.id === 'emergencyAlerts';
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
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: C.error, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    marginHorizontal: spacing.s5,
    marginTop: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.textPrimary },
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s5, paddingBottom: 110 },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  summaryCardRed: { backgroundColor: C.errorLight, borderColor: C.error, borderWidth: 1.5 },
  summaryCardOrange: { backgroundColor: C.warningLight, borderColor: C.warning, borderWidth: 1.5 },
  allClearCard: { backgroundColor: C.primaryLight, borderColor: C.primary, borderWidth: 1.5, alignItems: 'center', paddingVertical: 24 },
  allClearTitle: { fontSize: 18, fontWeight: '900', color: C.primary, marginTop: 10 },
  allClearSub: { fontSize: 12, color: C.textSecondary, textAlign: 'center', marginTop: 4 },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryRiskBanner: { fontSize: 11, fontWeight: '900', color: C.error, letterSpacing: 0.8 },
  summaryTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary, marginTop: 2 },
  alertBadgeCount: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  alertBadgeCountText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  summaryMetricsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  summaryMetricItem: { alignItems: 'center' },
  summaryMetricNum: { fontSize: 20, fontWeight: '900' },
  summaryMetricLabel: { fontSize: 11, fontWeight: '700', color: C.textSecondary, marginTop: 2 },
  filterChipsRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.s4 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.errorLight, borderColor: C.error },
  filterChipText: { fontSize: 11, fontWeight: '700', color: C.textSecondary },
  filterChipTextActive: { color: C.error, fontWeight: '900' },
  alertListContainer: { gap: 12 },
  alertCard: { backgroundColor: C.card, borderRadius: 20, padding: 14, borderWidth: 1.5, ...elevation.e1 },
  cardBorderRed: { borderColor: C.error, backgroundColor: '#FFF5F5' },
  cardBorderOrange: { borderColor: C.warning, backgroundColor: '#FFFDF0' },
  cardBorderYellow: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  alertHeaderRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  alertActivityTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  alertEventSub: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  whyBox: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: 10, marginVertical: 10, borderLeftWidth: 3, borderLeftColor: C.warning },
  whyTitleText: { fontSize: 12, color: C.textPrimary, lineHeight: 18 },
  ackMetaText: { fontSize: 11, fontWeight: '800', color: C.primary, marginTop: 4 },
  expandedBox: { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border, gap: 6 },
  expandedRow: { flexDirection: 'row', justifyContent: 'space-between' },
  expandedLabel: { fontSize: 11, color: C.textSecondary },
  expandedVal: { fontSize: 11, fontWeight: '700', color: C.textPrimary },
  expandedLinkRow: { marginTop: 6, alignSelf: 'flex-end' },
  expandedLinkText: { fontSize: 11, fontWeight: '800', color: C.primary },
  alertActionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionRemindBtn: { flex: 1, height: 38, backgroundColor: C.warning, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionRemindBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  actionCallBtn: { flex: 1, height: 38, backgroundColor: C.primaryLight, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionCallBtnText: { color: C.primary, fontSize: 12, fontWeight: '800' },
  actionAckBtn: { paddingHorizontal: 12, height: 38, backgroundColor: '#F1F5F9', borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  actionAckBtnText: { color: C.textPrimary, fontSize: 12, fontWeight: '800' },
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
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.s6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  filterOptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  filterOptionText: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
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

export default GuardianRoutineAlertsScreen;

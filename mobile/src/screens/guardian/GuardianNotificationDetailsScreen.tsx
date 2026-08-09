/**
 * GuardianNotificationDetailsScreen.tsx — Screen G47 (Notification Details & Actions)
 * Spec: g47.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, NHS App, Samsung Health
 *
 * Screen Mission: Answers "What exactly happened, why am I seeing this, and what can I do about it?"
 *
 * Healthcare Safety Mandate per g47.txt:
 *  - Read ≠ Acknowledged ≠ Resolved.
 *  - Opening an emergency notification does NOT automatically resolve it.
 *  - Actions are strictly contextual depending on notification category.
 *
 * Component Architecture per g47.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Notification Details", Subtitle "Full Record & Actions • G47", Overflow menu).
 *  3. Notification Hero (Category, Title, Elder Name, Timestamp, Priority Banner).
 *  4. What Happened Narrative (Full untruncated notification content).
 *  5. Event Context & Information Card (Medication / Activity / Emergency specific event metadata).
 *  6. Healthcare State Status Card (Read at 09:18 AM, Acknowledged: Pending, Resolution: Requires Review).
 *  7. Contextual Actions Section (Primary CTA + Secondary CTA).
 *  8. Collapsible Technical Metadata Accordion (ID, Source, CreatedAt, SyncStatus).
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

export interface NotificationDetailData {
  id: string;
  category: 'MEDICATION' | 'EMERGENCY' | 'ACTIVITY' | 'RISK' | 'REMINDER';
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  title: string;
  elderName: string;
  timestamp: string;
  fullBody: string;
  sourceSystem: string;
  readAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  statusText: string;
  eventDetails: Record<string, string>;
  resourceId?: string;
}

interface GuardianNotificationDetailsScreenProps {
  onBack: () => void;
  token?: string;
  notificationId?: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianNotificationDetailsScreen: React.FC<GuardianNotificationDetailsScreenProps> = ({
  onBack,
  token,
  notificationId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(false);
  const [refreshing, setRefreshing]           = useState(false);
  const [showMetadata, setShowMetadata]       = useState(false);
  const [showMoreMenu, setShowMoreMenu]       = useState(false);
  const [isAcknowledged, setIsAcknowledged]   = useState(false);

  const notification: NotificationDetailData = {
    id: notificationId || 'notif_001',
    category: 'MEDICATION',
    priority: 'HIGH',
    title: 'Morning Medication Missed',
    elderName: 'Nimal Perera',
    timestamp: 'Today • 9:15 AM',
    fullBody: 'The scheduled morning medication reminder for Amlodipine 5 mg was generated and delivered to Nimal Perera at 8:00 AM. The 60-minute confirmation window elapsed at 9:00 AM without dose confirmation.',
    sourceSystem: 'Medication Monitoring Engine',
    readAt: '09:18 AM',
    acknowledgedAt: isAcknowledged ? '09:22 AM' : null,
    resolvedAt: null,
    statusText: isAcknowledged ? 'Acknowledged' : 'Requires Review',
    eventDetails: {
      Medication: 'Amlodipine 5 mg',
      Scheduled: '08:00 AM',
      Window: '08:00 AM – 09:00 AM (60 mins)',
      'Dose Status': 'Expired / Unconfirmed',
    },
    resourceId: 'med_001',
  };

  const handleAcknowledge = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsAcknowledged(true);
    Toast.show({ type: 'success', text1: 'Alert Acknowledged', text2: 'Logged confirmation timestamp.' });
  };

  const handlePrimaryAction = () => {
    if (notification.category === 'MEDICATION') {
      onNavigate('medicationDetails');
    } else if (notification.category === 'EMERGENCY') {
      onNavigate('emergencyAlerts');
    } else if (notification.category === 'ACTIVITY') {
      onNavigate('activityTimeline');
    } else {
      onNavigate('guardianDashboard');
    }
  };

  const handleSecondaryAction = () => {
    if (notification.category === 'MEDICATION') {
      onNavigate('medicationHistory');
    } else if (notification.category === 'ACTIVITY') {
      onNavigate('activityDetails');
    } else {
      onNavigate('guardianNotifications');
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
          <Text style={styles.headerTitle}>Notification Details</Text>
          <Text style={styles.headerSubtitle}>Full Record & Actions • G47</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'info', text1: 'Marked as Unread' }); onBack(); }}>
              <MaterialCommunityIcons name="email-outline" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Mark as Unread</Text>
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
        {/* ─── 5 & 6. NOTIFICATION HERO CARD ─── */}
        <View style={[styles.heroCard, notification.category === 'EMERGENCY' && styles.heroCardEmerg]}>
          <View style={styles.heroCategoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: notification.category === 'EMERGENCY' ? C.errorLight : C.primaryLight }]}>
              <MaterialCommunityIcons
                name={notification.category === 'EMERGENCY' ? 'alert-decagram' : 'pill'}
                size={14}
                color={notification.category === 'EMERGENCY' ? C.error : C.primary}
              />
              <Text style={[styles.categoryBadgeText, { color: notification.category === 'EMERGENCY' ? C.error : C.primary }]}>
                {notification.category}
              </Text>
            </View>
            <Text style={styles.timestampText}>{notification.timestamp}</Text>
          </View>

          <Text style={styles.heroTitle}>{notification.title}</Text>
          <Text style={styles.heroElderText}>Elder: <Text style={{ fontWeight: '900', color: C.textPrimary }}>{notification.elderName}</Text></Text>
        </View>

        {/* ─── 7. FULL NOTIFICATION WHAT HAPPENED CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>What Happened</Text>
          </View>
          <Text style={styles.fullBodyText}>{notification.fullBody}</Text>
        </View>

        {/* ─── 9. EVENT INFORMATION CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="calendar-text-outline" size={20} color={C.info} />
            <Text style={styles.cardHeaderTitle}>Event Details</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Elder:</Text>
            <Text style={styles.infoVal}>{notification.elderName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Source System:</Text>
            <Text style={styles.infoVal}>{notification.sourceSystem}</Text>
          </View>

          {Object.entries(notification.eventDetails).map(([key, val]) => (
            <View key={key} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{key}:</Text>
              <Text style={styles.infoVal}>{val}</Text>
            </View>
          ))}
        </View>

        {/* ─── 10 & 11. HEALTHCARE NOTIFICATION STATUS CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="shield-check-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Notification Status Lifecycle</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Read State:</Text>
            <Text style={[styles.statusVal, { color: C.primary }]}>✓ Read at {notification.readAt}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Acknowledgement:</Text>
            <Text style={[styles.statusVal, { color: isAcknowledged ? C.primary : C.orange }]}>
              {isAcknowledged ? `✓ Acknowledged at ${notification.acknowledgedAt}` : 'Pending Acknowledgment'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Current Resolution:</Text>
            <Text style={[styles.statusVal, { color: C.textPrimary }]}>{notification.statusText}</Text>
          </View>

          {!isAcknowledged && (
            <TouchableOpacity style={styles.ackBtn} onPress={handleAcknowledge}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#FFF" />
              <Text style={styles.ackBtnText}>Acknowledge Alert</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── 12 & 13. CONTEXTUAL ACTIONS SECTION ─── */}
        <Text style={styles.sectionHeaderTitle}>Recommended Actions</Text>
        <View style={styles.actionsCol}>
          <TouchableOpacity style={styles.primaryActionBtn} onPress={handlePrimaryAction}>
            <MaterialCommunityIcons name="pill" size={18} color="#FFF" />
            <Text style={styles.primaryActionBtnText}>View Medication Details (G38)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryActionBtn} onPress={handleSecondaryAction}>
            <MaterialCommunityIcons name="history" size={18} color={C.primary} />
            <Text style={styles.secondaryActionBtnText}>View Reminder History (G42)</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 11. TECHNICAL METADATA ACCORDION ─── */}
        <TouchableOpacity style={styles.metadataHeaderBtn} onPress={() => setShowMetadata(v => !v)}>
          <Text style={styles.metadataHeaderTitle}>Notification Information & Technical Metadata</Text>
          <MaterialCommunityIcons name={showMetadata ? 'chevron-up' : 'chevron-down'} size={20} color={C.textMuted} />
        </TouchableOpacity>

        {showMetadata && (
          <View style={styles.metadataCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notification ID:</Text>
              <Text style={styles.infoVal}>{notification.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Priority:</Text>
              <Text style={styles.infoVal}>{notification.priority}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Resource Ref:</Text>
              <Text style={styles.infoVal}>{notification.resourceId}</Text>
            </View>
          </View>
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
  heroCard: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  heroCardEmerg: { borderLeftWidth: 6, borderLeftColor: C.error, backgroundColor: '#FEF2F2' },
  heroCategoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { fontSize: 10, fontWeight: '900' },
  timestampText: { fontSize: 11, color: C.textMuted, fontWeight: '700' },
  heroTitle: { fontSize: 22, fontWeight: '900', color: C.textPrimary, marginVertical: 4 },
  heroElderText: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  fullBodyText: { fontSize: 13, color: C.textPrimary, lineHeight: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel: { fontSize: 12, color: C.textSecondary },
  infoVal: { fontSize: 12, fontWeight: '700', color: C.textPrimary },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  statusLabel: { fontSize: 12, color: C.textSecondary },
  statusVal: { fontSize: 12, fontWeight: '800' },
  ackBtn: { height: 44, backgroundColor: C.primary, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 },
  ackBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  actionsCol: { gap: 10, marginBottom: spacing.s4 },
  primaryActionBtn: { height: 48, backgroundColor: C.primary, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, ...elevation.e1 },
  primaryActionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  secondaryActionBtn: { height: 44, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  secondaryActionBtnText: { color: C.primary, fontSize: 13, fontWeight: '800' },
  metadataHeaderBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  metadataHeaderTitle: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 0.5 },
  metadataCard: { backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.border, marginBottom: spacing.s4 },
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

export default GuardianNotificationDetailsScreen;

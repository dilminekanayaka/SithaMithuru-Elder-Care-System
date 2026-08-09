/**
 * GuardianNotificationsScreen.tsx — Screen G46 (Healthcare Notification Center)
 * Spec: g46.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, NHS App, Samsung Health
 *
 * Screen Mission: Provide one reliable place where the guardian can review all important system notifications related to connected elders.
 *
 * Healthcare State Rule per g46.txt:
 *  - Read ≠ Acknowledged ≠ Resolved.
 *  - Offline state says: "Unable to verify new notifications offline" (Never says "No new alerts" offline).
 *
 * Component Architecture per g46.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Notifications", Subtitle "Healthcare Inbox • G46", Mark All Read button).
 *  3. Unread Summary Indicator (e.g., "3 unread" or "You're all caught up").
 *  4. Filter Segmented Control ([All] vs [Unread]).
 *  5. Grouped SectionList Timeline (TODAY, YESTERDAY, EARLIER):
 *     - Emergency Alert (Critical visual priority, red badge, NEW).
 *     - Medication Missed (High priority, NEW).
 *     - Activity Inactivity (Normal priority).
 *     - Reminder Completed (Read).
 *  6. Category Badges (Emergency, Risk, Medication, Activity, Reminder, Device, System).
 *  7. Tap -> Navigates to G47 Notification Details (or Emergency Alert Details).
 *  8. Data Synchronization Footer & Persistent 5-Tab Bottom Navigation Bar.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  SectionList,
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

export interface NotificationItem {
  id: string;
  category: 'EMERGENCY' | 'RISK' | 'MEDICATION' | 'ACTIVITY' | 'REMINDER' | 'DEVICE' | 'SYSTEM';
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  title: string;
  elderName: string;
  message: string;
  time: string;
  read: boolean;
  actionType: string;
}

export interface NotificationSection {
  title: string;
  data: NotificationItem[];
}

interface GuardianNotificationsScreenProps {
  onBack: () => void;
  token?: string;
  guardianId?: string;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianNotificationsScreen: React.FC<GuardianNotificationsScreenProps> = ({
  onBack,
  token,
  guardianId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [filterMode, setFilterMode]   = useState<'ALL' | 'UNREAD'>('ALL');
  const [isOffline, setIsOffline]     = useState(false);

  const [rawSections, setRawSections] = useState<NotificationSection[]>([
    {
      title: 'TODAY',
      data: [
        {
          id: 'n1',
          category: 'EMERGENCY',
          priority: 'CRITICAL',
          title: 'Emergency Alert Detected',
          elderName: 'Nimal Perera',
          message: 'Emergency keyword detected on elder voice interface.',
          time: '10:42 AM',
          read: false,
          actionType: 'EMERGENCY',
        },
        {
          id: 'n2',
          category: 'MEDICATION',
          priority: 'HIGH',
          title: 'Morning Medication Missed',
          elderName: 'Nimal Perera',
          message: 'Amlodipine 5 mg reminder window expired without confirmation.',
          time: '09:15 AM',
          read: false,
          actionType: 'MEDICATION',
        },
        {
          id: 'n3',
          category: 'ACTIVITY',
          priority: 'NORMAL',
          title: 'Prolonged Inactivity',
          elderName: 'Nimal Perera',
          message: '2 hours 15 minutes elapsed without recorded movement.',
          time: '08:40 AM',
          read: false,
          actionType: 'ACTIVITY',
        },
      ],
    },
    {
      title: 'YESTERDAY',
      data: [
        {
          id: 'n4',
          category: 'REMINDER',
          priority: 'NORMAL',
          title: 'Evening Reminder Completed',
          elderName: 'Nimal Perera',
          message: 'Check-in reminder successfully acknowledged.',
          time: '07:20 PM',
          read: true,
          actionType: 'REMINDER',
        },
        {
          id: 'n5',
          category: 'RISK',
          priority: 'HIGH',
          title: 'Risk Level Assessment Changed',
          elderName: 'Nimal Perera',
          message: 'Overall risk score updated to Moderate (Yellow).',
          time: '04:15 PM',
          read: true,
          actionType: 'RISK',
        },
      ],
    },
  ]);

  const allNotifications = rawSections.flatMap(s => s.data);
  const unreadCount = allNotifications.filter(n => !n.read).length;

  const filteredSections = rawSections.map(sec => ({
    ...sec,
    data: sec.data.filter(item => {
      if (filterMode === 'UNREAD') return !item.read;
      return true;
    }),
  })).filter(sec => sec.data.length > 0);

  const handleMarkAllAsRead = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRawSections(prev => prev.map(sec => ({
      ...sec,
      data: sec.data.map(item => ({ ...item, read: true })),
    })));
    Toast.show({ type: 'success', text1: 'All Notifications Marked as Read' });
  };

  const handleNotificationPress = (item: NotificationItem) => {
    // Mark as read locally
    setRawSections(prev => prev.map(sec => ({
      ...sec,
      data: sec.data.map(n => n.id === item.id ? { ...n, read: true } : n),
    })));

    // Navigate to G47 Notification Details (or emergency alerts)
    if (item.category === 'EMERGENCY') {
      onNavigate('emergencyAlerts');
    } else {
      onNavigate('notificationDetails');
    }
  };

  const renderSectionHeader = ({ section }: { section: NotificationSection }) => (
    <View style={styles.sectionHeaderCard}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const isEmerg   = item.category === 'EMERGENCY';
    const isUnread  = !item.read;

    const categoryIcon =
      item.category === 'EMERGENCY' ? 'alert-decagram' :
      item.category === 'MEDICATION' ? 'pill' :
      item.category === 'ACTIVITY' ? 'walk' :
      item.category === 'RISK' ? 'chart-line-variant' :
      item.category === 'REMINDER' ? 'bell-ring-outline' :
      item.category === 'DEVICE' ? 'cellphone' : 'information-outline';

    const categoryBg =
      isEmerg ? C.errorLight :
      item.category === 'MEDICATION' ? C.primaryLight :
      item.category === 'ACTIVITY' ? C.infoLight :
      item.category === 'RISK' ? C.orangeLight : C.bg;

    const categoryColor =
      isEmerg ? C.error :
      item.category === 'MEDICATION' ? C.primary :
      item.category === 'ACTIVITY' ? C.info :
      item.category === 'RISK' ? C.orange : C.textSecondary;

    return (
      <TouchableOpacity
        style={[
          styles.notifCard,
          isEmerg && styles.emergCard,
          isUnread && styles.unreadCard,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.notifRow}>
          <View style={[styles.iconBox, { backgroundColor: categoryBg }]}>
            <MaterialCommunityIcons name={categoryIcon as any} size={22} color={categoryColor} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.cardHeaderTop}>
              <Text style={[styles.notifTitle, isUnread && styles.unreadTitleText]}>{item.title}</Text>
              {isUnread && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>

            <Text style={styles.elderNameText}>Elder: {item.elderName}</Text>
            <Text style={styles.messageText} numberOfLines={2}>{item.message}</Text>

            <View style={styles.footerRow}>
              <Text style={styles.timeText}>{item.time}</Text>
              <Text style={[styles.categoryTag, { color: categoryColor }]}>{item.category}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
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
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Healthcare Inbox • G46</Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllAsRead}>
            <MaterialCommunityIcons name="check-all" size={18} color={C.primary} />
            <Text style={styles.markReadBtnText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* OFFLINE WARNING BANNER */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <MaterialCommunityIcons name="wifi-off" size={14} color="#FFF" />
          <Text style={styles.offlineBannerText}>Offline — Unable to verify new notifications offline. Last synced 8:42 AM.</Text>
        </View>
      )}

      {/* ─── 5. UNREAD SUMMARY & FILTER BAR ─── */}
      <View style={styles.topControlCard}>
        <View style={styles.unreadSummaryRow}>
          <Text style={styles.unreadCountText}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : "You're all caught up"}
          </Text>
        </View>

        <View style={styles.segmentedRow}>
          <TouchableOpacity
            style={[styles.segmentBtn, filterMode === 'ALL' && styles.segmentBtnActive]}
            onPress={() => setFilterMode('ALL')}
          >
            <Text style={[styles.segmentBtnText, filterMode === 'ALL' && styles.segmentBtnTextActive]}>All ({allNotifications.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, filterMode === 'UNREAD' && styles.segmentBtnActive]}
            onPress={() => setFilterMode('UNREAD')}
          >
            <Text style={[styles.segmentBtnText, filterMode === 'UNREAD' && styles.segmentBtnTextActive]}>Unread ({unreadCount})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── 12. GROUPED NOTIFICATIONS SECTIONLIST ─── */}
      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} colors={[C.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-sleep-outline" size={56} color={C.textMuted} />
            <Text style={styles.emptyTitle}>
              {filterMode === 'UNREAD' ? 'No Unread Notifications' : "You're All Caught Up"}
            </Text>
            <Text style={styles.emptySub}>
              {filterMode === 'UNREAD'
                ? "You've reviewed all unread healthcare notifications."
                : 'There are no active notifications to display.'}
            </Text>
          </View>
        }
      />

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
  markReadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: C.primaryLight },
  markReadBtnText: { fontSize: 11, fontWeight: '900', color: C.primary },
  offlineBanner: { backgroundColor: '#475569', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 16 },
  offlineBannerText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  topControlCard: { backgroundColor: C.card, paddingHorizontal: spacing.s5, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  unreadSummaryRow: { marginBottom: 8 },
  unreadCountText: { fontSize: 13, fontWeight: '800', color: C.textSecondary },
  segmentedRow: { flexDirection: 'row', gap: 8, backgroundColor: C.bg, padding: 4, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  segmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: C.card, ...elevation.e1 },
  segmentBtnText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  segmentBtnTextActive: { color: C.primary, fontWeight: '900' },
  listContent: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: 110 },
  sectionHeaderCard: { backgroundColor: C.bg, paddingTop: 10, paddingBottom: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: C.textMuted, letterSpacing: 0.8 },
  notifCard: { backgroundColor: C.card, borderRadius: 20, padding: 14, marginTop: 8, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: C.primary, backgroundColor: '#F0FDF4' },
  emergCard: { borderLeftWidth: 4, borderLeftColor: C.error, backgroundColor: '#FEF2F2' },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: 15, fontWeight: '800', color: C.textPrimary, flex: 1 },
  unreadTitleText: { fontWeight: '900', color: C.textPrimary },
  newBadge: { backgroundColor: C.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  newBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  elderNameText: { fontSize: 11, fontWeight: '700', color: C.textSecondary, marginTop: 2 },
  messageText: { fontSize: 12, color: C.textSecondary, marginTop: 4, lineHeight: 18 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  timeText: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  categoryTag: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  emptyContainer: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginTop: 10 },
  emptySub: { fontSize: 12, color: C.textSecondary, marginTop: 4, textAlign: 'center' },
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

export default GuardianNotificationsScreen;

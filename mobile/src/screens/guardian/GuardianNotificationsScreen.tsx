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
  StatusBar,
  SectionList,
  RefreshControl,
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

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

export interface NotificationSection {
  title: string;
  data: NotificationItem[];
}

interface GuardianNotificationsScreenProps {
  onBack: () => void;
  token?: string;
  guardianId?: string;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

const categoryForType = (type: string): 'EMERGENCY' | 'MEDICATION' | 'SYSTEM' => {
  if (type === 'sos') return 'EMERGENCY';
  if (type === 'medication') return 'MEDICATION';
  return 'SYSTEM';
};

const GuardianNotificationsScreen: React.FC<GuardianNotificationsScreenProps> = ({
  onBack,
  token,
  guardianId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState<string | null>(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [filterMode, setFilterMode]   = useState<'ALL' | 'UNREAD'>('ALL');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await apiFetch(`/guardian/notifications`, token);
      const list: NotificationItem[] = (res || []).map((n: any) => ({
        id: String(n.id),
        type: n.type || 'system',
        title: n.title,
        message: n.message,
        created_at: n.created_at,
        read: !!n.read,
      }));
      setNotifications(list);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load notifications. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  const rawSections: NotificationSection[] = [
    { title: 'TODAY', data: notifications.filter(n => n.created_at?.slice(0, 10) === todayStr) },
    { title: 'YESTERDAY', data: notifications.filter(n => n.created_at?.slice(0, 10) === yesterdayStr) },
    { title: 'EARLIER', data: notifications.filter(n => {
      const d = n.created_at?.slice(0, 10);
      return d !== todayStr && d !== yesterdayStr;
    }) },
  ];

  const filteredSections = rawSections.map(sec => ({
    ...sec,
    data: sec.data.filter(item => {
      if (filterMode === 'UNREAD') return !item.read;
      return true;
    }),
  })).filter(sec => sec.data.length > 0);

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read && !n.id.startsWith('sos-') && !n.id.startsWith('med-'));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotifications(prev => prev.map(item => ({ ...item, read: true })));
    try {
      await Promise.all(unread.map(n => apiFetch(`/guardian/notifications/${n.id}/read`, token, { method: 'PUT' })));
      Toast.show({ type: 'success', text1: 'All Notifications Marked as Read' });
    } catch {
      Toast.show({ type: 'error', text1: 'Some notifications could not be marked as read' });
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    if (!item.id.startsWith('sos-') && !item.id.startsWith('med-')) {
      apiFetch(`/guardian/notifications/${item.id}/read`, token, { method: 'PUT' }).catch(() => {});
    }

    if (categoryForType(item.type) === 'EMERGENCY') {
      onNavigate('emergencyAlerts');
    } else {
      onNavigate('notificationDetails', item);
    }
  };

  const renderSectionHeader = ({ section }: { section: NotificationSection }) => (
    <View style={styles.sectionHeaderCard}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const category  = categoryForType(item.type);
    const isEmerg    = category === 'EMERGENCY';
    const isUnread   = !item.read;

    const categoryIcon =
      category === 'EMERGENCY' ? 'alert-decagram' :
      category === 'MEDICATION' ? 'pill' : 'information-outline';

    const categoryBg =
      isEmerg ? C.errorLight :
      category === 'MEDICATION' ? C.primaryLight : C.bg;

    const categoryColor =
      isEmerg ? C.error :
      category === 'MEDICATION' ? C.primary : C.textSecondary;

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

            <Text style={styles.messageText} numberOfLines={2}>{item.message}</Text>

            <View style={styles.footerRow}>
              <Text style={styles.timeText}>{new Date(item.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={[styles.categoryTag, { color: categoryColor }]}>{category}</Text>
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

      {/* ─── UNREAD SUMMARY & FILTER BAR ─── */}
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
            <Text style={[styles.segmentBtnText, filterMode === 'ALL' && styles.segmentBtnTextActive]}>All ({notifications.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, filterMode === 'UNREAD' && styles.segmentBtnActive]}
            onPress={() => setFilterMode('UNREAD')}
          >
            <Text style={[styles.segmentBtnText, filterMode === 'UNREAD' && styles.segmentBtnTextActive]}>Unread ({unreadCount})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : loadError ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={56} color={C.textMuted} />
          <Text style={styles.emptyTitle}>{loadError}</Text>
        </View>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[C.primary]} />
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
      )}

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
  markReadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: C.primaryLight },
  markReadBtnText: { fontSize: 11, fontWeight: '900', color: C.primary },
  offlineBanner: { backgroundColor: colors.text.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 16 },
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
  emergCard: { borderLeftWidth: 4, borderLeftColor: C.error, backgroundColor: colors.errorContainer },
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
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...elevation.e2,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 2 },
  tabLabelActive: { color: C.primary, fontWeight: '800' },
});

export default GuardianNotificationsScreen;

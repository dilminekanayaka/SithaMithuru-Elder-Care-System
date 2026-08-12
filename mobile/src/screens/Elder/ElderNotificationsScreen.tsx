/**
 * ElderNotificationsScreen.tsx — Screen ELDER-S10 (Notification Center Screen)
 *
 * Backed by GET /api/v1/notifications, which returns real persisted rows for
 * this user, or — since nothing currently writes to that table for Elders —
 * synthesizes real alerts from their own emergency/medication/task data
 * (see notificationController.getNotifications). Grouped into TODAY/EARLIER
 * by `created_at`. Tapping an item marks it read via PUT /:id/read and opens
 * NotificationDetailsScreen with the real row.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { colors, spacing, radius, elevation } from '../../theme';
import { apiFetch } from '../../services/api';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  time: string;
  group: 'TODAY' | 'EARLIER';
  read: boolean;
  targetScreen: string;
  actionLabel: string;
}

interface ElderNotificationsProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  elderId?: string;
  token?: string;
  onViewNotification?: (notification: NotificationItem) => void;
}

const CATEGORY_META: Record<string, { targetScreen: string; actionLabel: string }> = {
  EMERGENCY: { targetScreen: 'emergencyHistory', actionLabel: 'View' },
  MEDICATION: { targetScreen: 'medicines', actionLabel: 'View Medicine' },
  TASK: { targetScreen: 'tasks', actionLabel: 'View Task' },
  MOOD: { targetScreen: 'mood', actionLabel: 'Check Mood' },
  SUGGESTION: { targetScreen: 'memories', actionLabel: 'View Memories' },
  SAFETY: { targetScreen: 'medicines', actionLabel: 'View' },
};

const isToday = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const ElderNotificationsScreen: React.FC<ElderNotificationsProps> = ({
  onBack,
  onNavigate = (_screen: string) => {},
  elderId,
  token,
  onViewNotification,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!elderId || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/notifications', token);
      const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const formatted: NotificationItem[] = rows.map((n: any) => {
        const meta = CATEGORY_META[n.type] || { targetScreen: 'elderDashboard', actionLabel: 'View' };
        return {
          id: String(n.id),
          type: n.type || 'GENERAL',
          title: n.title || 'Notification',
          body: n.message || '',
          time: n.created_at
            ? isToday(n.created_at)
              ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date(n.created_at).toLocaleDateString()
            : '',
          group: n.created_at && isToday(n.created_at) ? 'TODAY' : 'EARLIER',
          read: !!n.is_read,
          targetScreen: meta.targetScreen,
          actionLabel: meta.actionLabel,
        };
      });
      setNotifications(formatted);
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [elderId, token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllAsRead = async () => {
    setShowMenu(false);
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    if (token) {
      await Promise.all(
        unread.map((n) => apiFetch(`/notifications/${n.id}/read`, token, { method: 'PUT' }).catch(() => {}))
      );
    }
    Toast.show({ type: 'success', text1: 'Notifications Updated', text2: 'All notifications marked as read.', position: 'top' });
  };

  const handleItemPress = (item: NotificationItem) => {
    setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    if (token) {
      apiFetch(`/notifications/${item.id}/read`, token, { method: 'PUT' }).catch(() => {});
    }
    if (onViewNotification) onViewNotification(item);
    onNavigate('notificationDetails');
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'MEDICATION':
        return { icon: 'pill', color: colors.category.medicine.accent, bg: colors.category.medicine.bg };
      case 'TASK':
        return { icon: 'check-circle-outline', color: colors.category.tasks.accent, bg: colors.category.tasks.bg };
      case 'MOOD':
        return { icon: 'emoticon-happy-outline', color: colors.category.mood.accent, bg: colors.category.mood.bg };
      case 'SUGGESTION':
        return { icon: 'image-multiple-outline', color: colors.category.journal.accent, bg: colors.category.journal.bg };
      case 'SAFETY':
      case 'EMERGENCY':
        return { icon: 'shield-alert-outline', color: colors.category.sos.accent, bg: colors.category.sos.bg };
      default:
        return { icon: 'bell-outline', color: colors.text.secondary, bg: colors.surfaceVariant };
    }
  };

  const todayItems = notifications.filter((n) => n.group === 'TODAY');
  const earlierItems = notifications.filter((n) => n.group === 'EARLIER');

  const renderCard = (item: NotificationItem) => {
    const styleInfo = getCategoryIcon(item.type);
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.card, !item.read && styles.cardUnread]}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeaderRow}>
          {!item.read && <View style={styles.unreadDot} />}
          <View style={[styles.iconCircle, { backgroundColor: styleInfo.bg }]}>
            <MaterialCommunityIcons name={styleInfo.icon as any} size={22} color={styleInfo.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
          </View>
        </View>

        <View style={styles.cardFooterRow}>
          <Text style={styles.timeText}>{item.time}</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleItemPress(item)}>
            <Text style={styles.actionBtnText}>{item.actionLabel} →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessible accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <TouchableOpacity style={styles.menuBtn} onPress={() => setShowMenu(true)} accessible accessibilityLabel="More options">
          <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={styles.menuBox}>
            <TouchableOpacity style={styles.menuItem} onPress={handleMarkAllAsRead}>
              <MaterialCommunityIcons name="check-all" size={20} color={colors.primary} />
              <Text style={styles.menuItemText}>Mark all as read</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="bell-ring-outline" size={48} color={colors.text.tertiary} />
            </View>
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptySubtitle}>There are no new notifications right now.</Text>
          </View>
        ) : (
          <>
            {todayItems.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.groupLabel}>TODAY</Text>
                {todayItems.map(renderCard)}
              </View>
            )}

            {earlierItems.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.groupLabel}>EARLIER</Text>
                {earlierItems.map(renderCard)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menuBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 8,
    width: 180,
    ...elevation.e3,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s8,
  },
  groupSection: {
    marginBottom: spacing.s5,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.s4,
    marginBottom: spacing.s3,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  cardUnread: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  cardTitleUnread: {
    fontWeight: '800',
    color: colors.onPrimaryContainer,
  },
  cardBody: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.outlineVariant,
  },
  timeText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.onPrimaryContainer,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default ElderNotificationsScreen;

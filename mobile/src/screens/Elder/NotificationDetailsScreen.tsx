/**
 * NotificationDetailsScreen.tsx — Screen ELDER-S62 (Notification Details Screen)
 *
 * Renders whichever real notification the user tapped in
 * ElderNotificationsScreen (passed through via ElderNavigator's
 * selectedNotification state) — no fallback fake alert.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

export interface NotificationDetailData {
  id: string;
  type: string;
  title: string;
  body: string;
  timeStr: string;
  statusText?: string;
  targetScreen?: string;
  actionLabel?: string;
}

interface NotificationDetailsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  notificationData?: NotificationDetailData | null;
}

const getCategoryMeta = (type: string) => {
  switch (type) {
    case 'EMERGENCY':
    case 'SAFETY':
      return { icon: 'shield-alert-outline', color: colors.category.sos.accent, bg: colors.category.sos.bg };
    case 'MEDICATION':
      return { icon: 'pill', color: colors.category.medicine.accent, bg: colors.category.medicine.bg };
    case 'WELLBEING':
    case 'MOOD':
      return { icon: 'heart-pulse', color: colors.category.mood.accent, bg: colors.category.mood.bg };
    case 'INACTIVITY':
      return { icon: 'clock-alert-outline', color: colors.warning, bg: colors.warningContainer };
    case 'GUARDIAN':
      return { icon: 'account-heart-outline', color: colors.category.guardian.accent, bg: colors.category.guardian.bg };
    case 'TASK':
      return { icon: 'check-circle-outline', color: colors.category.tasks.accent, bg: colors.category.tasks.bg };
    case 'SUGGESTION':
      return { icon: 'image-multiple-outline', color: colors.category.journal.accent, bg: colors.category.journal.bg };
    default:
      return { icon: 'information-outline', color: colors.text.secondary, bg: colors.surfaceVariant };
  }
};

const NotificationDetailsScreen: React.FC<NotificationDetailsProps> = ({
  onBack,
  onNavigate,
  notificationData,
}) => {
  if (!notificationData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bell-alert-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyStateText}>This notification couldn't be loaded.</Text>
          <TouchableOpacity style={styles.emptyStateBtn} onPress={onBack}>
            <Text style={styles.emptyStateBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryMeta = getCategoryMeta(notificationData.type);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      <ScreenHeader title="Notification Details" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={[styles.iconCircle, { backgroundColor: categoryMeta.bg }]}>
            <MaterialCommunityIcons name={categoryMeta.icon as any} size={50} color={categoryMeta.color} />
          </View>

          <Text style={styles.titleText}>{notificationData.title}</Text>
          <Text style={styles.timeText}>{notificationData.timeStr}</Text>
        </View>

        <View style={styles.messageCard}>
          <Text style={styles.bodyText}>{notificationData.body}</Text>
        </View>

        {notificationData.statusText ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>STATUS</Text>
            <Text style={[styles.infoCardValue, { color: colors.success }]}>{notificationData.statusText}</Text>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>TIME</Text>
          <Text style={styles.infoCardValue}>{notificationData.timeStr}</Text>
        </View>

        <View style={styles.reassuranceCard}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.reassuranceText}>
            This notification is part of your safety support system.
          </Text>
        </View>

        {notificationData.targetScreen && notificationData.actionLabel ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onNavigate(notificationData.targetScreen!)}
            activeOpacity={0.85}
            accessible={true}
            accessibilityLabel={notificationData.actionLabel}
          >
            <Text style={styles.actionBtnText}>{notificationData.actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <BottomNavBar activeTab="home" onNavigate={onNavigate} />
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
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s5,
    paddingBottom: 110,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s3,
    paddingHorizontal: spacing.s6,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyStateBtn: {
    marginTop: spacing.s2,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  emptyStateBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.s4,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...elevation.e1,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  messageCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.s4,
    marginBottom: spacing.s3,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  bodyText: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.s4,
    marginBottom: spacing.s3,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  infoCardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  reassuranceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 8,
    marginBottom: 16,
  },
  reassuranceText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 18,
  },
  actionBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e2,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
});

export default NotificationDetailsScreen;

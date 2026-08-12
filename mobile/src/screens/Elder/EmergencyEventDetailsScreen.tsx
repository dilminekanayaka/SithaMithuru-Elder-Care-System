/**
 * EmergencyEventDetailsScreen.tsx — Screen ELDER-S51 (Emergency Event Details Screen)
 *
 * Shows the real emergency_logs row the user tapped in EmergencyHistoryScreen
 * (passed through ElderNavigator's selectedEmergencyEvent state). The
 * timeline only shows steps backed by real timestamps (`created_at`,
 * `resolved_at`) — no fake fixed 4-step sequence, since the backend doesn't
 * record per-step event timestamps.
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
import type { EmergencyEventRecord } from './EmergencyHistoryScreen';
import ScreenHeader from '../../components/ScreenHeader';

interface EmergencyEventDetailsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  eventData?: EmergencyEventRecord | null;
}

const EmergencyEventDetailsScreen: React.FC<EmergencyEventDetailsProps> = ({
  onBack,
  onNavigate,
  eventData,
}) => {
  if (!eventData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="shield-search-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyStateText}>This event couldn't be loaded.</Text>
          <TouchableOpacity style={styles.emptyStateBtn} onPress={onBack}>
            <Text style={styles.emptyStateBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const heroColor =
    eventData.type === 'CANCELLED' ? colors.warning : eventData.type === 'TRIGGERED' ? colors.success : colors.text.secondary;
  const heroBg =
    eventData.type === 'CANCELLED' ? colors.warningContainer : eventData.type === 'TRIGGERED' ? colors.successContainer : colors.surfaceVariant;

  const timeline: { timeStr: string; label: string }[] = [];
  if (eventData.createdAt) {
    timeline.push({
      timeStr: new Date(eventData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      label: 'Emergency event recorded',
    });
  }
  if (eventData.resolvedAt) {
    timeline.push({
      timeStr: new Date(eventData.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      label: eventData.type === 'CANCELLED' ? 'Cancelled by you' : 'Marked resolved',
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      <ScreenHeader title="Emergency Details" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={[styles.heroIconCircle, { backgroundColor: heroBg }]}>
            <MaterialCommunityIcons
              name={eventData.type === 'CANCELLED' ? 'check-circle-outline' : 'shield-alert-outline'}
              size={54}
              color={heroColor}
            />
          </View>

          <Text style={styles.heroTitleText}>{eventData.title}</Text>
          <Text style={styles.heroDateText}>
            {eventData.dateStr} • {eventData.timeStr}
          </Text>

          <View style={[styles.statusBadge, { backgroundColor: heroBg }]}>
            <Text style={[styles.statusBadgeText, { color: heroColor }]}>{eventData.statusText}</Text>
          </View>
        </View>

        {timeline.length > 0 && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardLabelText}>EVENT TIMELINE</Text>
            <View style={styles.timelineContainer}>
              {timeline.map((item, idx) => (
                <View key={idx} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineDot} />
                    {idx < timeline.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTimeText}>{item.timeStr}</Text>
                    <Text style={styles.timelineLabelText}>{item.label}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {eventData.resolutionNotes ? (
          <View style={styles.detailsCard}>
            <Text style={styles.cardLabelText}>NOTES</Text>
            <Text style={styles.cardMainText}>{eventData.resolutionNotes}</Text>
          </View>
        ) : null}

        <View style={styles.detailsCard}>
          <Text style={styles.cardLabelText}>GUARDIAN NOTIFICATION</Text>
          <Text style={styles.cardMainText}>
            {eventData.type === 'PENDING' ? 'Waiting for connection' : 'Sent'}
          </Text>
        </View>

        <View style={styles.reassuranceBox}>
          <MaterialCommunityIcons name="cellphone-check" size={22} color={colors.info} />
          <Text style={styles.reassuranceText}>Emergency detection worked on your device.</Text>
        </View>
      </ScrollView>

      <BottomNavBar activeTab="sos" onNavigate={onNavigate} />
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
    marginBottom: spacing.s5,
  },
  heroIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitleText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  heroDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.s4,
    marginBottom: spacing.s4,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  cardLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  cardMainText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  timelineContainer: {
    paddingVertical: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.outline,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
  },
  timelineTimeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
  },
  timelineLabelText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  reassuranceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoContainer,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.status.rescheduled.border,
  },
  reassuranceText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.infoDark,
  },
});

export default EmergencyEventDetailsScreen;

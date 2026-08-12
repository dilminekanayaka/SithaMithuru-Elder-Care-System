/**
 * OnboardingCompleteScreen.tsx — Screen ELDER-S08 (Onboarding Complete Screen)
 * Spec: es8.txt
 *
 * Requirements (es8.txt):
 *  • Step 08 in Onboarding sequence (Splash -> Welcome -> Language -> Profile -> Permissions Intro -> Mic -> Notification -> Onboarding Complete -> Elder Home)
 *  • Warm, calm, positive final setup confirmation
 *  • Dynamic Setup Readiness Summary:
 *      - Profile: ✓ Profile ready
 *      - Emergency: ✓ Emergency support ready (if mic granted) OR ! Emergency support needs attention (if mic denied)
 *      - Reminders: ✓ Reminders ready (if notification granted) OR ! Reminder notifications are off (if notification denied)
 *  • Primary Action: GO TO HOME (56dp CTA button)
 *  • Saves `sithamithuru_onboarding_status = 'COMPLETED'` in local storage
 *  • 100% Offline-First: No network blocking
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, elevation } from '../../theme';

export const ONBOARDING_STATUS_KEY = 'sithamithuru_onboarding_status';

interface OnboardingCompleteScreenProps {
  onGoToHome: () => void;
  micGranted?: boolean;
  notificationGranted?: boolean;
  userName?: string;
}

const OnboardingCompleteScreen: React.FC<OnboardingCompleteScreenProps> = ({
  onGoToHome,
  micGranted = true,
  notificationGranted = true,
  userName,
}) => {
  // Subtle checkmark scale/fade animation (300-500ms per es8.txt Section 21)
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Persist completion state locally (es8.txt Section 14 & 15)
    AsyncStorage.setItem(ONBOARDING_STATUS_KEY, 'COMPLETED').catch((err) =>
      console.warn('Failed to save onboarding completion status:', err)
    );

    AccessibilityInfo.announceForAccessibility(
      "Setup complete! You're all set. SithaMithuru is ready to support you in your daily life."
    );
  }, [opacityAnim, scaleAnim]);

  // CTA Tap -> Finalize onboarding & transition to Elder Home Dashboard (es8.txt Section 14)
  const handleGoToHome = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STATUS_KEY, 'COMPLETED');
    } catch (err) {
      console.warn('Error setting onboarding status:', err);
    }
    onGoToHome();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SUCCESS ICON WITH ANIMATION (es8.txt Section 5 & 21) */}
        <Animated.View
          style={[
            styles.heroCircle,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <MaterialCommunityIcons name="check-bold" size={56} color={colors.success} />
        </Animated.View>

        {/* HEADLINE & SUBTEXT (es8.txt Section 6 & 7) */}
        <Text style={styles.headline}>You're all set!</Text>
        <Text style={styles.supportingText}>
          {userName ? `Welcome, ${userName}! ` : ''}SithaMithuru is ready to support you in your daily life.
        </Text>

        {/* DYNAMIC SETUP SUMMARY CARD (es8.txt Section 8, 9, 10, 12) */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardHeader}>SETUP SUMMARY</Text>

          {/* ITEM 1: PROFILE STATUS */}
          <View style={styles.summaryRow}>
            <View style={[styles.statusIconCircle, { backgroundColor: colors.successContainer }]}>
              <MaterialCommunityIcons name="check" size={18} color={colors.success} />
            </View>
            <Text style={styles.summaryRowText}>Profile ready</Text>
          </View>

          <View style={styles.divider} />

          {/* ITEM 2: EMERGENCY SUPPORT STATUS (DYNAMIC) */}
          <View style={styles.summaryRow}>
            {micGranted ? (
              <>
                <View style={[styles.statusIconCircle, { backgroundColor: colors.successContainer }]}>
                  <MaterialCommunityIcons name="check" size={18} color={colors.success} />
                </View>
                <Text style={styles.summaryRowText}>Emergency support ready</Text>
              </>
            ) : (
              <>
                <View style={[styles.statusIconCircle, { backgroundColor: colors.warningContainer }]}>
                  <MaterialCommunityIcons name="alert" size={18} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.summaryRowText, { color: colors.warningDark }]}>
                    Emergency support needs attention
                  </Text>
                  <Text style={styles.warningSubtext}>Can be enabled later in Settings</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.divider} />

          {/* ITEM 3: REMINDERS STATUS (DYNAMIC) */}
          <View style={styles.summaryRow}>
            {notificationGranted ? (
              <>
                <View style={[styles.statusIconCircle, { backgroundColor: colors.successContainer }]}>
                  <MaterialCommunityIcons name="check" size={18} color={colors.success} />
                </View>
                <Text style={styles.summaryRowText}>Reminders ready</Text>
              </>
            ) : (
              <>
                <View style={[styles.statusIconCircle, { backgroundColor: colors.warningContainer }]}>
                  <MaterialCommunityIcons name="bell-off-outline" size={18} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.summaryRowText, { color: colors.warningDark }]}>
                    Reminder notifications are off
                  </Text>
                  <Text style={styles.warningSubtext}>Schedules remain saved locally</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* OFFLINE STATUS NOTIFICATION (es8.txt Section 18) */}
        <View style={styles.offlineFooterNote}>
          <MaterialCommunityIcons name="shield-check-outline" size={16} color={colors.success} style={{ marginRight: 6 }} />
          <Text style={styles.offlineFooterText}>Saved securely on this device</Text>
        </View>
      </ScrollView>

      {/* PRIMARY CTA BUTTON (es8.txt Section 13) */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleGoToHome}
          activeOpacity={0.85}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go to Home Dashboard"
        >
          <Text style={styles.ctaButtonText}>GO TO HOME</Text>
          <MaterialCommunityIcons name="arrow-right" size={22} color={colors.onPrimary} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s6 || 32,
    paddingBottom: spacing.s8 || 32,
    alignItems: 'center',
  },
  heroCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.successContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.status.taken.border,
    marginBottom: spacing.s5 || 20,
    ...elevation.e2,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  supportingText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 380,
    marginBottom: spacing.s6 || 28,
  },
  summaryCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
    marginBottom: spacing.s5 || 20,
  },
  summaryCardHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: spacing.s4 || 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statusIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  summaryRowText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  warningSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.warning,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: spacing.s3 || 12,
  },
  offlineFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.s2 || 8,
  },
  offlineFooterText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.success,
  },
  footer: {
    paddingHorizontal: spacing.s5 || 20,
    paddingVertical: spacing.s4 || 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    maxWidth: 420,
    height: 56,
    borderRadius: radius.lg || 16,
    backgroundColor: colors.primary || colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.primary || colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  ctaButtonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});

export default OnboardingCompleteScreen;

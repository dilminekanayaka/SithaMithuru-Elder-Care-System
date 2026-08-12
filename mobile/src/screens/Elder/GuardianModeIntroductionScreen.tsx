/**
 * GuardianModeIntroductionScreen.tsx — Screen GUARDIAN-S86 (Guardian Mode Introduction Screen)
 * Spec: es86.txt
 *
 * Requirements (es86.txt):
 *  1. Hero Identity (es86.txt Section 2):
 *     - User / Guardian Icon Badge (👤)
 *     - Title "Guardian Mode"
 *     - Subtitle "Stay informed about important safety information and support your loved one when needed."
 *  2. Guardian Mode Helps You Section (es86.txt Section 4 & 5):
 *     - ✓ See important safety alerts
 *     - ✓ Understand relevant risks
 *     - ✓ Monitor medication concerns
 *     - ✓ Respond to emergency alerts
 *  3. Privacy Limitation Notice (es86.txt Section 6):
 *     - "Guardian Mode does not show everything stored on the Elder's device."
 *  4. Primary CTA (es86.txt Section 9):
 *     - [ CONTINUE TO GUARDIAN MODE ] button -> Navigates to Guardian Dashboard (`guardianDashboard` / `guardianNotifications`)
 *  5. 100% Offline-First (es86.txt Section 20 & 22)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius, elevation } from '../../theme';

interface GuardianModeIntroProps {
  onContinue: () => void;
}

const GuardianModeIntroductionScreen: React.FC<GuardianModeIntroProps> = ({
  onContinue,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── HERO AVATAR & TITLE (es86.txt Section 2) ─── */}
        <View style={styles.avatarCircle}>
          <MaterialCommunityIcons name="account-heart-outline" size={54} color={colors.primary} />
        </View>

        <Text style={styles.titleText}>Guardian Mode</Text>

        <Text style={styles.subtitleText}>
          Stay informed about important safety information and support your loved one when needed.
        </Text>

        {/* ─── GUARDIAN MODE HELPS YOU LIST (es86.txt Section 4 & 5) ─── */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Guardian Mode helps you:</Text>

          <View style={styles.featureRow}>
            <MaterialCommunityIcons name="check" size={20} color={colors.success} />
            <Text style={styles.featureText}>See important safety alerts</Text>
          </View>

          <View style={styles.featureRow}>
            <MaterialCommunityIcons name="check" size={20} color={colors.success} />
            <Text style={styles.featureText}>Understand relevant risks</Text>
          </View>

          <View style={styles.featureRow}>
            <MaterialCommunityIcons name="check" size={20} color={colors.success} />
            <Text style={styles.featureText}>Monitor medication concerns</Text>
          </View>

          <View style={styles.featureRow}>
            <MaterialCommunityIcons name="check" size={20} color={colors.success} />
            <Text style={styles.featureText}>Respond to emergency alerts</Text>
          </View>
        </View>

        {/* ─── PRIVACY LIMITATION NOTICE (es86.txt Section 6) ─── */}
        <View style={styles.privacyNoticeCard}>
          <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.primaryDark} />
          <Text style={styles.privacyNoticeText}>
            Guardian Mode does not show everything stored on the Elder's device.
          </Text>
        </View>

        {/* ─── PRIMARY CTA (es86.txt Section 9) ─── */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={onContinue}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Continue to Guardian Mode"
        >
          <Text style={styles.continueBtnText}>CONTINUE TO GUARDIAN MODE</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingTop: 48,
    paddingBottom: 40,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
    ...elevation.e2,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    width: '100%',
    ...elevation.e1,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 6,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  privacyNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xxl || 24,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    marginBottom: 28,
    width: '100%',
  },
  privacyNoticeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    lineHeight: 20,
  },
  continueBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e2,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
});

export default GuardianModeIntroductionScreen;

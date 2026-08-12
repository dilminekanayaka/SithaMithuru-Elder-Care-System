/**
 * EmergencyHelpScreen.tsx — Screen ELDER-S82 (Emergency Help Screen)
 * Spec: es82.txt
 *
 * Requirements (es82.txt):
 *  1. Header: Back arrow (←), Title "Emergency Help".
 *  2. Guidance Text (es82.txt Section 2):
 *     - "SithaMithuru can detect selected emergency words and start the emergency support process."
 *  3. HOW EMERGENCY SUPPORT WORKS Section (es82.txt Section 2 & 3):
 *     - 01 Emergency word detected
 *     - 02 An emergency alert starts and a countdown may appear.
 *     - 03 Confirm or cancel the alert when the screen appears.
 *     - 04 When an emergency is confirmed, your Guardian can be notified.
 *  4. WITHOUT INTERNET Section (es82.txt Section 4):
 *     - "Emergency keyword detection is designed to work on the device even when you are offline."
 *  5. IMPORTANT Safety Notice (es82.txt Section 20):
 *     - "If you are in immediate danger, use the emergency options available to you and contact appropriate emergency services when possible."
 *  6. 100% Offline-First (es82.txt Section 4 & 28)
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
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface EmergencyHelpProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const EmergencyHelpScreen: React.FC<EmergencyHelpProps> = ({
  onBack,
  onNavigate,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es82.txt Section 1) ─── */}
      <ScreenHeader title="Emergency Help" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es82.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          SithaMithuru can detect selected emergency words and start the emergency support process.
        </Text>

        {/* ─── HOW EMERGENCY SUPPORT WORKS SECTION (es82.txt Section 2 & 3) ─── */}
        <Text style={styles.sectionHeaderTitle}>HOW EMERGENCY SUPPORT WORKS</Text>

        <View style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>01</Text>
            </View>
            <Text style={styles.stepText}>Emergency word detected</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>02</Text>
            </View>
            <Text style={styles.stepText}>
              An emergency alert starts and a countdown may appear.
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>03</Text>
            </View>
            <Text style={styles.stepText}>
              Confirm or cancel the alert when the screen appears.
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>04</Text>
            </View>
            <Text style={styles.stepText}>
              When an emergency is confirmed, your Guardian can be notified.
            </Text>
          </View>
        </View>

        {/* ─── WITHOUT INTERNET SECTION (es82.txt Section 4) ─── */}
        <Text style={styles.sectionHeaderTitle}>WITHOUT INTERNET</Text>

        <View style={styles.card}>
          <Text style={styles.bodyText}>
            Emergency keyword detection is designed to work on the device even when you are offline.
          </Text>
        </View>

        {/* ─── IMPORTANT SAFETY NOTICE (es82.txt Section 20) ─── */}
        <Text style={styles.sectionHeaderTitle}>IMPORTANT</Text>

        <View style={styles.safetyCard}>
          <MaterialCommunityIcons name="shield-alert-outline" size={22} color={colors.warningDark} />
          <Text style={styles.safetyCardText}>
            If you are in immediate danger, use the emergency options available to you and contact appropriate emergency services when possible.
          </Text>
        </View>
      </ScrollView>

      <BottomNavBar activeTab="settings" onNavigate={onNavigate} />
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
    paddingHorizontal: spacing.s4 || 16,
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
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s4 || 16,
    paddingBottom: 110,
  },
  guidanceText: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.error,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 12,
  },
  bodyText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 22,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningContainer,
    borderRadius: radius.xxl || 24,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.status.upcoming.border,
    marginBottom: 20,
  },
  safetyCardText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.warningDark,
    lineHeight: 20,
  },
});

export default EmergencyHelpScreen;

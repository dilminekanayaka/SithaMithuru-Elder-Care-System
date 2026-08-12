/**
 * GuardianHelpScreen.tsx — Screen ELDER-S83 (Guardian Help Screen)
 * Spec: es83.txt
 *
 * Requirements (es83.txt):
 *  1. Header: Back arrow (←), Title "Guardian Help".
 *  2. Guidance Text (es83.txt Section 2):
 *     - "Your Guardian can receive important information when your support or safety may be needed."
 *  3. WHAT DOES A GUARDIAN DO? Section (es83.txt Section 4):
 *     - "Your Guardian can receive relevant alerts and support you when needed."
 *  4. HOW GUARDIAN ALERTS WORK Section (es83.txt Section 2 & 3):
 *     - 01 The application observes relevant activity and safety events.
 *     - 02 The application evaluates whether there is a meaningful risk.
 *     - 03 When Guardian support is needed, an alert can be sent to your Guardian.
 *  5. WHAT CAN YOUR GUARDIAN RECEIVE? Section (es83.txt Section 7-9):
 *     - Medication-related alerts
 *     - Safety-related alerts
 *     - Emergency alerts
 *  6. YOUR PRIVACY Section (es83.txt Section 17):
 *     - "Your Guardian does not have access to all information on your device."
 *  7. 100% Offline-First (es83.txt Section 12 & 31)
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

interface GuardianHelpProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const GuardianHelpScreen: React.FC<GuardianHelpProps> = ({
  onBack,
  onNavigate,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es83.txt Section 1) ─── */}
      <ScreenHeader title="Guardian Help" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es83.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          Your Guardian can receive important information when your support or safety may be needed.
        </Text>

        {/* ─── WHAT DOES A GUARDIAN DO? SECTION (es83.txt Section 4) ─── */}
        <Text style={styles.sectionHeaderTitle}>WHAT DOES A GUARDIAN DO?</Text>
        <View style={styles.card}>
          <Text style={styles.bodyText}>
            Your Guardian can receive relevant alerts and support you when needed.
          </Text>
        </View>

        {/* ─── HOW GUARDIAN ALERTS WORK SECTION (es83.txt Section 2 & 3) ─── */}
        <Text style={styles.sectionHeaderTitle}>HOW GUARDIAN ALERTS WORK</Text>
        <View style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>01</Text>
            </View>
            <Text style={styles.stepText}>
              The application observes relevant activity and safety events.
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>02</Text>
            </View>
            <Text style={styles.stepText}>
              The application evaluates whether there is a meaningful risk.
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>03</Text>
            </View>
            <Text style={styles.stepText}>
              When Guardian support is needed, an alert can be sent to your Guardian.
            </Text>
          </View>
        </View>

        {/* ─── WHAT CAN YOUR GUARDIAN RECEIVE? SECTION (es83.txt Section 7-9) ─── */}
        <Text style={styles.sectionHeaderTitle}>WHAT CAN YOUR GUARDIAN RECEIVE?</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => onNavigate('guardianDataSharing')}
            activeOpacity={0.7}
          >
            <Text style={styles.navTitle}>Medication-related alerts</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => onNavigate('guardianDataSharing')}
            activeOpacity={0.7}
          >
            <Text style={styles.navTitle}>Safety-related alerts</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => onNavigate('guardianDataSharing')}
            activeOpacity={0.7}
          >
            <Text style={styles.navTitle}>Emergency alerts</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* ─── YOUR PRIVACY SECTION (es83.txt Section 17) ─── */}
        <Text style={styles.sectionHeaderTitle}>YOUR PRIVACY</Text>
        <View style={styles.privacyCard}>
          <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.primaryDark} />
          <Text style={styles.privacyCardText}>
            Your Guardian does not have access to all information on your device.
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
  bodyText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 22,
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
    backgroundColor: colors.successContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.success,
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xxl || 24,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    marginBottom: 20,
  },
  privacyCardText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    lineHeight: 20,
  },
});

export default GuardianHelpScreen;

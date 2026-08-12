/**
 * HowToUseSithaMithuruScreen.tsx — Screen ELDER-S80 (How to Use SithaMithuru Screen)
 * Spec: es80.txt
 *
 * Requirements (es80.txt):
 *  1. Header: Back arrow (←), Title "How to Use SithaMithuru".
 *  2. Guidance Text (es80.txt Section 2):
 *     - "Learn how the main features of SithaMithuru help you."
 *  3. Core Sections (es80.txt Section 3-8, 372-424):
 *     - 01 MEDICATION: Medication Reminders ("Get reminders when it is time to take your medicine.") -> navigates to medicines
 *     - 02 SAFETY: Emergency Support ("Get help when an emergency is detected.") -> navigates to emergencySafetyGuide
 *     - 03 GUARDIAN: Guardian Support ("Your Guardian can receive important safety alerts.") -> navigates to guardianInfo
 *     - 04 NOTIFICATIONS: Notifications ("See important reminders and safety information.") -> navigates to notifications
 *     - 05 SETTINGS: Settings ("Change language, reminders and accessibility options.") -> navigates to settings
 *  4. Task-Oriented Reference Layout: Clean, step-numbered cards without forced wizard buttons.
 *  5. 100% Offline-First (es80.txt Section 19 & 308)
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

interface HowToUseProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const HowToUseSithaMithuruScreen: React.FC<HowToUseProps> = ({
  onBack,
  onNavigate,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es80.txt Section 1) ─── */}
      <ScreenHeader title="How to Use SithaMithuru" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es80.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          Learn how the main features of SithaMithuru help you.
        </Text>

        {/* ─── 01. MEDICATION (es80.txt Section 4) ─── */}
        <Text style={styles.sectionHeaderTitle}>MEDICATION</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => onNavigate('medicines')}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="01 Medication Reminders"
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>01</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Medication Reminders</Text>
              <Text style={styles.cardSubtitle}>
                Get reminders when it is time to take your medicine.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </View>
        </TouchableOpacity>

        {/* ─── 02. SAFETY (es80.txt Section 5) ─── */}
        <Text style={styles.sectionHeaderTitle}>SAFETY</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => onNavigate('emergencySafetyGuide')}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="02 Emergency Support"
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>02</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Emergency Support</Text>
              <Text style={styles.cardSubtitle}>
                Get help when an emergency is detected.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </View>
        </TouchableOpacity>

        {/* ─── 03. GUARDIAN (es80.txt Section 6) ─── */}
        <Text style={styles.sectionHeaderTitle}>GUARDIAN</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => onNavigate('guardianInfo')}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="03 Guardian Support"
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>03</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Guardian Support</Text>
              <Text style={styles.cardSubtitle}>
                Your Guardian can receive important safety alerts.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </View>
        </TouchableOpacity>

        {/* ─── 04. NOTIFICATIONS (es80.txt Section 7) ─── */}
        <Text style={styles.sectionHeaderTitle}>NOTIFICATIONS</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => onNavigate('notifications')}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="04 Notifications"
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>04</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Notifications</Text>
              <Text style={styles.cardSubtitle}>
                See important reminders and safety information.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </View>
        </TouchableOpacity>

        {/* ─── 05. SETTINGS (es80.txt Section 8) ─── */}
        <Text style={styles.sectionHeaderTitle}>SETTINGS</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => onNavigate('settings')}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="05 Settings"
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>05</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Settings</Text>
              <Text style={styles.cardSubtitle}>
                Change language, reminders and accessibility options.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </View>
        </TouchableOpacity>
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
    fontSize: 18,
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryContainer,
  },
  stepBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 18,
  },
});

export default HowToUseSithaMithuruScreen;

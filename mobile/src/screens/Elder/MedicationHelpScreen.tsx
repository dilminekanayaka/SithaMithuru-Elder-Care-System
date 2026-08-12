/**
 * MedicationHelpScreen.tsx — Screen ELDER-S81 (Medication Help Screen)
 * Spec: es81.txt
 *
 * Requirements (es81.txt):
 *  1. Header: Back arrow (←), Title "Medication Help".
 *  2. Guidance Text (es81.txt Section 2):
 *     - "SithaMithuru can remind you when it is time to take your medicine."
 *  3. HOW REMINDERS WORK Section (es81.txt Section 2 & 3):
 *     - 01 Your medication schedule is saved on your device.
 *     - 02 A reminder appears when it is time to take your medicine.
 *     - 03 Follow the reminder and confirm it when applicable.
 *  4. IF YOU MISS A REMINDER Section (es81.txt Section 11):
 *     - "The application can record the missed reminder and use it as part of safety monitoring."
 *  5. IMPORTANT Medical Disclaimer (es81.txt Section 21):
 *     - "Medication reminders support your routine. They do not replace advice from your doctor or healthcare provider."
 *  6. 100% Offline-First (es81.txt Section 4 & 29)
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

interface MedicationHelpProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const MedicationHelpScreen: React.FC<MedicationHelpProps> = ({
  onBack,
  onNavigate,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es81.txt Section 1) ─── */}
      <ScreenHeader title="Medication Help" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es81.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          SithaMithuru can remind you when it is time to take your medicine.
        </Text>

        {/* ─── HOW REMINDERS WORK SECTION (es81.txt Section 2 & 3) ─── */}
        <Text style={styles.sectionHeaderTitle}>HOW REMINDERS WORK</Text>

        <View style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>01</Text>
            </View>
            <Text style={styles.stepText}>
              Your medication schedule is saved on your device.
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>02</Text>
            </View>
            <Text style={styles.stepText}>
              A reminder appears when it is time to take your medicine.
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>03</Text>
            </View>
            <Text style={styles.stepText}>
              Follow the reminder and confirm it when applicable.
            </Text>
          </View>
        </View>

        {/* ─── IF YOU MISS A REMINDER SECTION (es81.txt Section 11) ─── */}
        <Text style={styles.sectionHeaderTitle}>IF YOU MISS A REMINDER</Text>

        <View style={styles.card}>
          <Text style={styles.bodyText}>
            The application can record the missed reminder and use it as part of safety monitoring.
          </Text>
        </View>

        {/* ─── IMPORTANT DISCLAIMER (es81.txt Section 21) ─── */}
        <Text style={styles.sectionHeaderTitle}>IMPORTANT</Text>

        <View style={styles.disclaimerCard}>
          <MaterialCommunityIcons name="information-outline" size={22} color={colors.primaryDark} />
          <Text style={styles.disclaimerText}>
            Medication reminders support your routine. They do not replace advice from your doctor or healthcare provider.
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
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
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
  disclaimerCard: {
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
  disclaimerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    lineHeight: 20,
  },
});

export default MedicationHelpScreen;

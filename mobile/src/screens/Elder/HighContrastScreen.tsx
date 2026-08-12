/**
 * HighContrastScreen.tsx — Screen ELDER-S69 (High Contrast Screen)
 * Spec: es69.txt
 *
 * Requirements (es69.txt):
 *  1. Header: Back arrow (←), Title "High Contrast".
 *  2. Guidance Text (es69.txt Section 2):
 *     - "Make text and important interface elements easier to see."
 *  3. Main Toggle (es69.txt Section 3):
 *     - High Contrast [ Switch ON/OFF ] (Default: ON)
 *  4. Live Preview Card (es69.txt Section 2 & 7):
 *     - Dynamic preview displaying "Medication Reminder: Take your medicine at 8:00 AM. ✓ Reminder Active [ VIEW MEDICATION ]"
 *     - High contrast state displays bold solid borders and high contrast colors immediately when toggled.
 *  5. Reassurance Note (es69.txt Section 2 & 5):
 *     - "High contrast improves visibility without changing your language or text size."
 *  6. 100% Offline-First (es69.txt Section 26)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Switch,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface HighContrastProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const HighContrastScreen: React.FC<HighContrastProps> = ({
  onBack,
  onNavigate,
}) => {
  const [enabled, setEnabled] = useState(true);

  const handleToggle = (val: boolean) => {
    setEnabled(val);
    Toast.show({
      type: 'info',
      text1: 'Contrast Preference Updated',
      text2: val ? 'High contrast enabled.' : 'High contrast disabled.',
      position: 'top',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es69.txt Section 1) ─── */}
      <ScreenHeader title="High Contrast" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es69.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          Make text and important interface elements easier to see.
        </Text>

        {/* ─── MAIN TOGGLE (es69.txt Section 3) ─── */}
        <Text style={styles.sectionHeaderTitle}>HIGH CONTRAST</Text>

        <View style={[styles.card, enabled && styles.highContrastCardBorder]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingTitle, enabled && styles.highContrastTitle]}>High Contrast</Text>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.outline, true: colors.primaryContainer }}
              thumbColor={enabled ? colors.primary : colors.text.tertiary}
            />
          </View>
        </View>

        {/* ─── LIVE PREVIEW CARD (es69.txt Section 7) ─── */}
        <Text style={styles.sectionHeaderTitle}>PREVIEW</Text>

        <View style={[styles.previewBox, enabled ? styles.previewBoxHighContrast : styles.previewBoxNormal]}>
          <Text style={[styles.previewTitleText, enabled && styles.previewTitleTextHC]}>
            Medication Reminder
          </Text>
          <Text style={[styles.previewBodyText, enabled && styles.previewBodyTextHC]}>
            Take your medicine at 8:00 AM.
          </Text>

          <View style={[styles.activeStatusPill, enabled && styles.activeStatusPillHC]}>
            <MaterialCommunityIcons name="check" size={16} color={enabled ? '#000000' : colors.success} />
            <Text style={[styles.activeStatusText, enabled && styles.activeStatusTextHC]}>
              Reminder Active
            </Text>
          </View>

          <View style={[styles.previewButtonMock, enabled && styles.previewButtonMockHC]}>
            <Text style={[styles.previewButtonMockText, enabled && styles.previewButtonMockTextHC]}>
              VIEW MEDICATION
            </Text>
          </View>
        </View>

        {/* ─── REASSURANCE NOTE (es69.txt Section 2 & 5) ─── */}
        <Text style={styles.footerNoteText}>
          High contrast improves visibility without changing your language or text size.
        </Text>
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
    marginTop: 8,
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
  highContrastCardBorder: {
    borderWidth: 3,
    borderColor: '#000000',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  highContrastTitle: {
    color: '#000000',
    fontWeight: '900',
  },
  previewBox: {
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s4 || 16,
  },
  previewBoxNormal: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  previewBoxHighContrast: {
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: '#000000',
    ...elevation.e3,
  },
  previewTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  previewTitleTextHC: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
  },
  previewBodyText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 12,
  },
  previewBodyTextHC: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.status.taken.border,
  },
  activeStatusPillHC: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: '#000000',
  },
  activeStatusText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.success,
  },
  activeStatusTextHC: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
  previewButtonMock: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewButtonMockHC: {
    backgroundColor: '#000000',
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
  },
  previewButtonMockText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  previewButtonMockTextHC: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.onPrimary,
    letterSpacing: 0.8,
  },
  footerNoteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 8,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default HighContrastScreen;

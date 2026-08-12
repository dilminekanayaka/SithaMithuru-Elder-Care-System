/**
 * LargerTouchTargetsScreen.tsx — Screen ELDER-S70 (Larger Touch Targets Screen)
 * Spec: es70.txt
 *
 * Requirements (es70.txt):
 *  1. Header: Back arrow (←), Title "Larger Touch Targets".
 *  2. Guidance Text (es70.txt Section 2):
 *     - "Make buttons and controls easier to tap."
 *  3. Main Toggle (es70.txt Section 3 & 4):
 *     - Larger Touch Targets [ Switch ON/OFF ] (Default: ON)
 *     - Minimum baseline: 48dp (OFF) vs 56dp+ (ON).
 *  4. Live Preview Card (es70.txt Section 8):
 *     - Dynamic preview card demonstrating visual button target size expansion (48dp vs 60dp height).
 *  5. Reassurance Note (es70.txt Section 2):
 *     - "Larger controls make it easier to select buttons and settings."
 *  6. 100% Offline-First (es70.txt Section 28)
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

interface LargerTouchTargetsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const LargerTouchTargetsScreen: React.FC<LargerTouchTargetsProps> = ({
  onBack,
  onNavigate,
}) => {
  const [enabled, setEnabled] = useState(true);

  const handleToggle = (val: boolean) => {
    setEnabled(val);
    Toast.show({
      type: 'info',
      text1: 'Touch Targets Updated',
      text2: val ? 'Larger touch targets enabled.' : 'Standard touch targets restored.',
      position: 'top',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es70.txt Section 1) ─── */}
      <ScreenHeader title="Larger Touch Targets" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es70.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          Make buttons and controls easier to tap.
        </Text>

        {/* ─── MAIN TOGGLE (es70.txt Section 3) ─── */}
        <Text style={styles.sectionHeaderTitle}>LARGER TOUCH TARGETS</Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingTitle}>Larger Touch Targets</Text>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.outline, true: colors.primaryContainer }}
              thumbColor={enabled ? colors.primary : colors.text.tertiary}
            />
          </View>
        </View>

        {/* ─── LIVE PREVIEW CARD (es70.txt Section 8) ─── */}
        <Text style={styles.sectionHeaderTitle}>PREVIEW</Text>

        <View style={styles.previewBox}>
          <Text style={styles.previewTitleText}>Medication Reminder</Text>
          <Text style={styles.previewBodyText}>Take your medicine at 8:00 AM.</Text>

          <View style={[styles.previewButtonMock, enabled ? styles.previewButtonMockLarge : styles.previewButtonMockNormal]}>
            <Text style={styles.previewButtonMockText}>VIEW MEDICATION</Text>
          </View>
        </View>

        {/* ─── REASSURANCE NOTE (es70.txt Section 2) ─── */}
        <Text style={styles.footerNoteText}>
          Larger controls make it easier to select buttons and settings.
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
  previewBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  previewTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  previewBodyText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 16,
  },
  previewButtonMock: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewButtonMockNormal: {
    height: 48,
  },
  previewButtonMockLarge: {
    height: 64,
  },
  previewButtonMockText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
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

export default LargerTouchTargetsScreen;

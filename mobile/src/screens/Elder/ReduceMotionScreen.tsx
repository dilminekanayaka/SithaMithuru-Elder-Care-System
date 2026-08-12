/**
 * ReduceMotionScreen.tsx — Screen ELDER-S71 (Reduce Motion Screen)
 * Spec: es71.txt
 *
 * Requirements (es71.txt):
 *  1. Header: Back arrow (←), Title "Reduce Motion".
 *  2. Guidance Text (es71.txt Section 2):
 *     - "Reduce non-essential animations and movement throughout the app."
 *  3. Main Toggle (es71.txt Section 3):
 *     - Reduce Motion [ Switch ON/OFF ] (Default: OFF)
 *  4. Live Preview Card (es71.txt Section 20):
 *     - Dynamic preview card explaining "Screen Transition: With Reduce Motion, content changes directly without unnecessary animation."
 *  5. Reassurance Note (es71.txt Section 2 & 5):
 *     - "Important safety information remains visible when motion is reduced."
 *  6. 100% Offline-First (es71.txt Section 26)
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

interface ReduceMotionProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const ReduceMotionScreen: React.FC<ReduceMotionProps> = ({
  onBack,
  onNavigate,
}) => {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = (val: boolean) => {
    setEnabled(val);
    Toast.show({
      type: 'info',
      text1: 'Reduce Motion Updated',
      text2: val ? 'Non-essential animations reduced.' : 'Standard motion restored.',
      position: 'top',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es71.txt Section 1) ─── */}
      <ScreenHeader title="Reduce Motion" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es71.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          Reduce non-essential animations and movement throughout the app.
        </Text>

        {/* ─── MAIN TOGGLE (es71.txt Section 3) ─── */}
        <Text style={styles.sectionHeaderTitle}>REDUCE MOTION</Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingTitle}>Reduce Motion</Text>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.outline, true: colors.primaryContainer }}
              thumbColor={enabled ? colors.primary : colors.text.tertiary}
            />
          </View>
        </View>

        {/* ─── LIVE PREVIEW CARD (es71.txt Section 20) ─── */}
        <Text style={styles.sectionHeaderTitle}>PREVIEW</Text>

        <View style={styles.previewBox}>
          <Text style={styles.previewTitleText}>Screen Transition</Text>
          <Text style={styles.previewBodyText}>
            {enabled
              ? 'With Reduce Motion ON, content changes directly with minimal movement.'
              : 'Standard mode uses subtle smooth transitions between screens.'}
          </Text>
        </View>

        {/* ─── REASSURANCE NOTE (es71.txt Section 2 & 5) ─── */}
        <Text style={styles.footerNoteText}>
          Important safety information remains visible when motion is reduced.
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
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  previewBodyText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 22,
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

export default ReduceMotionScreen;

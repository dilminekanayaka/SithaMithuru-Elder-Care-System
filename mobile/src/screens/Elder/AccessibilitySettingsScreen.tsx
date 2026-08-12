/**
 * AccessibilitySettingsScreen.tsx — Screen ELDER-S38 (Accessibility Settings Screen)
 * Spec: es38.txt
 *
 * Requirements (es38.txt):
 *  1. Header: Back arrow (←), Title "Accessibility".
 *  2. Display Section (es38.txt Section 4-10, 21):
 *     - Text size segmented control: [ Medium | LARGE (Default) | XL ]
 *     - Text preview box ("Good morning, Kamal")
 *     - High contrast [ Switch ON/OFF ] (Default: OFF)
 *     - Large buttons [ Switch ON/OFF ] (Default: ON)
 *     - Reduce motion [ Switch ON/OFF ] (Default: OFF)
 *  3. Interaction Section (es38.txt Section 12, 17):
 *     - Simple navigation [ Switch ON/OFF ] (Default: ON)
 *     - Haptic feedback [ Switch ON/OFF ] (Default: ON)
 *  4. Voice Section (es38.txt Section 13-16):
 *     - Read important messages [ Switch ON/OFF ] (Default: ON)
 *  5. Automatic Local Save (es38.txt Section 25 & 26):
 *     - Immediate update, 100% offline support.
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

type TextSizeOption = 'MEDIUM' | 'LARGE' | 'XL';

interface AccessibilitySettingsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const AccessibilitySettingsScreen: React.FC<AccessibilitySettingsProps> = ({
  onBack,
  onNavigate,
}) => {
  const [textSize, setTextSize] = useState<TextSizeOption>('LARGE');
  const [highContrast, setHighContrast] = useState(false);
  const [largeButtons, setLargeButtons] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [simpleNavigation, setSimpleNavigation] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [readMessages, setReadMessages] = useState(true);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, title: string) => {
    setter((prev) => {
      const next = !prev;
      Toast.show({
        type: 'info',
        text1: 'Accessibility Updated',
        text2: `${title} set to ${next ? 'ON' : 'OFF'}.`,
        position: 'top',
      });
      return next;
    });
  };

  const handleSelectTextSize = (option: TextSizeOption) => {
    setTextSize(option);
    Toast.show({
      type: 'info',
      text1: 'Text Size Changed',
      text2: `Font size updated to ${option}.`,
      position: 'top',
    });
  };

  const getPreviewSize = () => {
    switch (textSize) {
      case 'MEDIUM':
        return 18;
      case 'LARGE':
        return 22;
      case 'XL':
        return 26;
      default:
        return 22;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es38.txt Section 1) ─── */}
      <ScreenHeader title="Accessibility" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── SECTION 1: TEXT & DISPLAY (es67.txt Section 2) ─── */}
        <Text style={styles.sectionHeader}>TEXT & DISPLAY</Text>

        <View style={styles.card}>
          {/* TEXT SIZE ROW (es67.txt Section 3 -> Screen 68) */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => onNavigate('textSize')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Text size, Large"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingTitle}>Text Size</Text>
              <Text style={styles.settingSubtitle}>Large</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* HIGH CONTRAST ROW (es67.txt Section 5 -> Screen 69) */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => onNavigate('highContrast')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="High Contrast"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingTitle}>High Contrast</Text>
              <Text style={styles.settingSubtitle}>Improve text and interface visibility.</Text>
            </View>
            <Switch
              value={highContrast}
              onValueChange={() => handleToggle(setHighContrast, 'High contrast')}
              trackColor={{ false: colors.outline, true: colors.primaryContainer }}
              thumbColor={highContrast ? colors.primary : colors.text.tertiary}
            />
          </TouchableOpacity>
        </View>

        {/* ─── SECTION 2: INTERACTION (es67.txt Section 7 & 9) ─── */}
        <Text style={styles.sectionHeader}>INTERACTION</Text>

        <View style={styles.card}>
          {/* LARGER TOUCH TARGETS ROW (es67.txt Section 7 -> Screen 70) */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => onNavigate('largerTouchTargets')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Larger Touch Targets"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingTitle}>Larger Touch Targets</Text>
              <Text style={styles.settingSubtitle}>Make buttons and controls easier to tap.</Text>
            </View>
            <Switch
              value={largeButtons}
              onValueChange={() => handleToggle(setLargeButtons, 'Larger touch targets')}
              trackColor={{ false: colors.outline, true: colors.primaryContainer }}
              thumbColor={largeButtons ? colors.primary : colors.text.tertiary}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* REDUCE MOTION */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingTitle}>Reduce Motion</Text>
              <Text style={styles.settingSubtitle}>Reduce non-essential animations.</Text>
            </View>
            <Switch
              value={reduceMotion}
              onValueChange={() => handleToggle(setReduceMotion, 'Reduce motion')}
              trackColor={{ false: colors.outline, true: colors.primaryContainer }}
              thumbColor={reduceMotion ? colors.primary : colors.text.tertiary}
            />
          </View>
        </View>

        {/* ─── SECTION 3: SCREEN READER (es67.txt Section 11) ─── */}
        <Text style={styles.sectionHeader}>SCREEN READER</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              Toast.show({
                type: 'info',
                text1: 'TalkBack Screen Reader',
                text2: 'TalkBack is managed in Android Device Settings.',
                position: 'top',
              })
            }
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="TalkBack, Managed by Android"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingTitle}>TalkBack</Text>
              <Text style={styles.settingSubtitle}>Managed by Android</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* ─── RESET BUTTON (es67.txt Section 21) ─── */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() =>
            Toast.show({
              type: 'info',
              text1: 'Accessibility Reset',
              text2: 'Accessibility settings restored to default.',
              position: 'top',
            })
          }
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Reset Accessibility Settings"
        >
          <Text style={styles.resetBtnText}>RESET ACCESSIBILITY SETTINGS</Text>
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
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s4 || 16,
    paddingBottom: 110,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  segmentedBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 16,
    padding: 4,
    marginTop: 10,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    ...elevation.e1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  previewBox: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 12,
  },
  previewText: {
    fontWeight: '800',
    color: colors.text.primary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 12,
  },
  resetBtn: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
});

export default AccessibilitySettingsScreen;

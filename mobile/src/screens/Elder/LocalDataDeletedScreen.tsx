/**
 * LocalDataDeletedScreen.tsx — Screen ELDER-S78 (Local Data Deleted Screen)
 * Spec: es78.txt
 *
 * Requirements (es78.txt):
 *  1. Terminal Deletion Success State Layout (es78.txt Section 2 & 3):
 *     - Success Checkmark Circle (✓)
 *     - Title "Local Data Deleted"
 *     - Subtitle "The selected local information has been removed from this device."
 *     - Preference Reset Note "Some application preferences may have been restored to their default values."
 *  2. Primary Action (es78.txt Section 14 & 15):
 *     - [ DONE ] CTA button -> returns to Screen 76 (localData)
 *  3. Calm & Clear Aesthetics: Calm confirmation, no celebratory confetti.
 *  4. 100% Offline-First (es78.txt Section 28 & 390)
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

interface LocalDataDeletedProps {
  onNavigate: (screen: string) => void;
}

const LocalDataDeletedScreen: React.FC<LocalDataDeletedProps> = ({
  onNavigate,
}) => {
  const handleDone = () => {
    onNavigate('localData');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── SUCCESS CHECKMARK & TITLE (es78.txt Section 2, 4, 6) ─── */}
        <View style={styles.successCircle}>
          <MaterialCommunityIcons name="check" size={54} color={colors.onPrimary} />
        </View>

        <Text style={styles.titleText}>Local Data Deleted</Text>
        <Text style={styles.subtitleText}>
          The selected local information has been removed from this device.
        </Text>

        {/* ─── PREFERENCE RESET REASSURANCE CARD (es78.txt Section 8) ─── */}
        <View style={styles.resetInfoCard}>
          <MaterialCommunityIcons name="information-outline" size={22} color={colors.text.secondary} />
          <Text style={styles.resetInfoText}>
            Some application preferences may have been restored to their default values.
          </Text>
        </View>

        {/* ─── PRIMARY ACTION (es78.txt Section 14 & 15) ─── */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={handleDone}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Done, return to Local Data"
        >
          <Text style={styles.doneBtnText}>DONE</Text>
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
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: 56,
    paddingBottom: 110,
    alignItems: 'center',
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...elevation.e2,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  resetInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 32,
    width: '100%',
    ...elevation.e1,
  },
  resetInfoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  doneBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e2,
  },
  doneBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
});

export default LocalDataDeletedScreen;

/**
 * GuardianConnectionRemovedScreen.tsx — Screen ELDER-S60 (Guardian Connection Removed Screen)
 * Spec: es60.txt
 *
 * Requirements (es60.txt):
 *  1. Terminal Disconnection Success State Layout (es60.txt Section 2, 3, 4, 5, 428-453):
 *     - Green Checkmark Circle (✓)
 *     - Title "Guardian Disconnected"
 *     - Main Message: "The Guardian connection has been removed successfully."
 *     - Safety Reassurance: "Your Emergency Detection remains available on this device."
 *     - Guardian Card State: "Guardian: No Guardian Connected"
 *  2. Actions (es60.txt Section 7 & 8):
 *     - Primary CTA: [ DONE ] button -> navigates to Screen 52 (guardianInfo) showing No Guardian Connected
 *     - Secondary Action: CONNECT NEW GUARDIAN -> navigates to Screen 54 (connectGuardian)
 *  3. Trustworthy & Calm Aesthetics: Clear confirmation, no scary risk alerts or emergency triggers.
 *  4. 100% Offline-First: Cached local relationship disconnection confirmation.
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

interface GuardianConnectionRemovedProps {
  onNavigate: (screen: string) => void;
}

const GuardianConnectionRemovedScreen: React.FC<GuardianConnectionRemovedProps> = ({
  onNavigate,
}) => {
  const handleDone = () => {
    onNavigate('guardianInfo');
  };

  const handleConnectNew = () => {
    onNavigate('connectGuardian');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── SUCCESS CHECKMARK & TITLE (es60.txt Section 3) ─── */}
        <View style={styles.successCircle}>
          <MaterialCommunityIcons name="check" size={54} color={colors.onPrimary} />
        </View>

        <Text style={styles.titleText}>Guardian Disconnected</Text>
        <Text style={styles.subtitleText}>The Guardian connection has been removed successfully.</Text>

        {/* ─── SAFETY REASSURANCE CARD (es60.txt Section 5) ─── */}
        <View style={styles.safetyCard}>
          <MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.primary} />
          <Text style={styles.safetyCardText}>
            Your Emergency Detection remains available on this device.
          </Text>
        </View>

        {/* ─── CURRENT STATE SUMMARY (es60.txt Section 6) ─── */}
        <View style={styles.stateSummaryBox}>
          <Text style={styles.stateLabelText}>GUARDIAN</Text>
          <Text style={styles.stateValueText}>No Guardian Connected</Text>
        </View>

        {/* ─── ACTIONS (es60.txt Section 7 & 8) ─── */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={handleDone}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Done, return to Guardian Information"
        >
          <Text style={styles.doneBtnText}>DONE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.connectNewBtn}
          onPress={handleConnectNew}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Connect New Guardian"
        >
          <Text style={styles.connectNewBtnText}>CONNECT NEW GUARDIAN</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNavBar activeTab="profile" onNavigate={onNavigate} />
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
    paddingTop: 44,
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
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xxl || 24,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    marginBottom: 20,
    width: '100%',
  },
  safetyCardText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    lineHeight: 20,
  },
  stateSummaryBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: 16,
    marginBottom: 28,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  stateLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  stateValueText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.secondary,
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
  connectNewBtn: {
    width: '100%',
    height: 52,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  connectNewBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
});

export default GuardianConnectionRemovedScreen;

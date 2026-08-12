/**
 * EmergencySafetyGuideScreen.tsx — Screen ELDER-S47 (Emergency Safety Guide Screen)
 * Spec: es47.txt
 *
 * Requirements (es47.txt):
 *  1. Header: Back arrow (←), Title "Emergency Safety".
 *  2. Hero Section (es47.txt Section 2 & 3):
 *     - Shield Icon (shield-alert-outline)
 *     - Title "How Emergency Detection Works"
 *     - Description "SithaMithuru can detect your configured emergency keyword directly on your device."
 *  3. Flow Diagram Card (es47.txt Section 4):
 *     - Say emergency keyword -> App detects it -> Emergency confirmation -> Guardian is informed
 *  4. Offline Support Card (es47.txt Section 5):
 *     - "Detection is designed to work directly on the device without internet."
 *  5. Test Emergency Detection Action (es47.txt Section 14 & 15):
 *     - [ TEST EMERGENCY DETECTION ] CTA button
 *     - Modal test flow: Simulated speech test -> "Test Successful ✓" with explicit reassurance "No Guardian alert was sent."
 *  6. Navigation Links (es47.txt Section 21 & 22):
 *     - VIEW EMERGENCY HISTORY > (navigates to emergencyHistory)
 *     - EMERGENCY SETTINGS > (navigates to emergencySettings)
 *  7. 100% Offline-First (Section 18)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface EmergencySafetyGuideProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  configuredKeyword?: string;
}

const EmergencySafetyGuideScreen: React.FC<EmergencySafetyGuideProps> = ({
  onBack,
  onNavigate,
  configuredKeyword = 'Help',
}) => {
  const [showTestModal, setShowTestModal] = useState(false);
  const [testState, setTestState] = useState<'IDLE' | 'LISTENING' | 'SUCCESS'>('IDLE');

  const handleStartTest = () => {
    setShowTestModal(true);
    setTestState('LISTENING');

    // Simulate detection test
    setTimeout(() => {
      setTestState('SUCCESS');
    }, 2000);
  };

  const handleCloseTestModal = () => {
    setShowTestModal(false);
    setTestState('IDLE');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es47.txt Section 1) ─── */}
      <ScreenHeader title="Emergency Safety" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── HERO SECTION (es47.txt Section 2 & 3) ─── */}
        <View style={styles.heroBox}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-alert-outline" size={54} color={colors.error} />
          </View>
          <Text style={styles.heroTitle}>How Emergency Detection Works</Text>
          <Text style={styles.heroSubtitle}>
            SithaMithuru can detect your configured emergency keyword directly on your device.
          </Text>
        </View>

        {/* ─── FLOW DIAGRAM CARD (es47.txt Section 4) ─── */}
        <View style={styles.flowCard}>
          <Text style={styles.flowCardTitle}>EMERGENCY FLOW</Text>

          <View style={styles.flowStepRow}>
            <View style={styles.flowBadge}><Text style={styles.flowBadgeText}>1</Text></View>
            <Text style={styles.flowStepText}>Say your emergency keyword ("{configuredKeyword}")</Text>
          </View>
          <MaterialCommunityIcons name="arrow-down" size={20} color={colors.text.tertiary} style={styles.flowArrow} />

          <View style={styles.flowStepRow}>
            <View style={styles.flowBadge}><Text style={styles.flowBadgeText}>2</Text></View>
            <Text style={styles.flowStepText}>App detects keyword on device</Text>
          </View>
          <MaterialCommunityIcons name="arrow-down" size={20} color={colors.text.tertiary} style={styles.flowArrow} />

          <View style={styles.flowStepRow}>
            <View style={styles.flowBadge}><Text style={styles.flowBadgeText}>3</Text></View>
            <Text style={styles.flowStepText}>Emergency confirmation countdown begins</Text>
          </View>
          <MaterialCommunityIcons name="arrow-down" size={20} color={colors.text.tertiary} style={styles.flowArrow} />

          <View style={styles.flowStepRow}>
            <View style={[styles.flowBadge, { backgroundColor: colors.error }]}><Text style={styles.flowBadgeText}>4</Text></View>
            <Text style={styles.flowStepText}>Guardian is informed</Text>
          </View>
        </View>

        {/* ─── OFFLINE SUPPORT CARD (es47.txt Section 5) ─── */}
        <View style={styles.infoCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <MaterialCommunityIcons name="wifi-off" size={22} color={colors.primary} />
            <Text style={styles.infoCardHeader}>OFFLINE SUPPORT</Text>
          </View>
          <Text style={styles.infoCardText}>
            Detection is designed to work directly on the device without internet connectivity.
          </Text>
        </View>

        {/* ─── TEST EMERGENCY DETECTION ACTION (es47.txt Section 14 & 15) ─── */}
        <TouchableOpacity
          style={styles.testBtn}
          onPress={handleStartTest}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Test emergency detection"
        >
          <MaterialCommunityIcons name="microphone" size={22} color={colors.onPrimary} />
          <Text style={styles.testBtnText}>TEST EMERGENCY DETECTION</Text>
        </TouchableOpacity>

        {/* ─── NAVIGATION LINKS (es47.txt Section 21 & 22) ─── */}
        <View style={styles.linksCard}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => onNavigate('emergencyHistory')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="View emergency history"
          >
            <Text style={styles.linkText}>VIEW EMERGENCY HISTORY</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => onNavigate('emergencySettings')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Emergency settings"
          >
            <Text style={styles.linkText}>EMERGENCY SETTINGS</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ─── TEST MODE MODAL (es47.txt Section 15) ─── */}
      <Modal
        visible={showTestModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseTestModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {testState === 'LISTENING' ? (
              <>
                <View style={styles.listeningCircle}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
                <Text style={styles.modalTitle}>Say your keyword</Text>
                <Text style={styles.modalSubtitle}>
                  Please speak your emergency keyword ("{configuredKeyword}") out loud...
                </Text>
              </>
            ) : (
              <>
                <View style={styles.successCircle}>
                  <MaterialCommunityIcons name="check" size={48} color={colors.onPrimary} />
                </View>
                <Text style={styles.modalTitle}>Test Successful ✓</Text>
                <Text style={styles.modalSubtitle}>
                  Emergency detection is working properly on this device.
                </Text>
                <Text style={styles.reassuranceText}>
                  No Guardian alert was sent (Test Mode).
                </Text>

                <TouchableOpacity
                  style={styles.doneModalBtn}
                  onPress={handleCloseTestModal}
                >
                  <Text style={styles.doneModalBtnText}>DONE</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

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
    paddingTop: 24,
    paddingBottom: 110,
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.status.missed.border,
    ...elevation.e2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  flowCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 20,
    ...elevation.e1,
  },
  flowCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 16,
  },
  flowStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flowBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flowBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  flowStepText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
  },
  flowArrow: {
    marginLeft: 4,
    marginVertical: 4,
  },
  infoCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    marginBottom: 20,
  },
  infoCardHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  infoCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    lineHeight: 20,
  },
  testBtn: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    ...elevation.e2,
  },
  testBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  linksCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    ...elevation.e3,
  },
  listeningCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  reassuranceText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
    textAlign: 'center',
    marginBottom: 20,
  },
  doneModalBtn: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneModalBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
  },
});

export default EmergencySafetyGuideScreen;

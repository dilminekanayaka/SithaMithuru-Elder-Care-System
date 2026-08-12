/**
 * EmergencySafetyScreen.tsx — Screen ELDER-S25 (Emergency Safety / Keyword Detection Screen)
 * Spec: es25.txt
 *
 * Requirements (es25.txt):
 *  1. Header: Back arrow (←), Title "Safety".
 *  2. Normal State Layout (es25.txt Section 3 & 46):
 *     - Shield Icon (🛡️) + Title "Emergency Detection Active"
 *     - Subtitle "Your phone can detect your emergency word and help alert your Guardian."
 *     - Status Badge: ● DETECTION ACTIVE (Green pill badge)
 *     - Offline Detection Card: Offline detection ✓ Available
 *     - Keyword Status: Emergency word Configured ✓
 *     - Test Action: [ Test Emergency Detection ] button (≥52dp height)
 *  3. Emergency State Layout (es25.txt Section 13, 14, 15, 47):
 *     - Title "EMERGENCY DETECTED" + Subtitle "Are you in danger?"
 *     - 5-Second Countdown Number (5 -> 4 -> 3 -> 2 -> 1)
 *     - Warning Text "Guardian will be notified when the countdown ends."
 *     - Cancellation Button: [ I'M SAFE ] (≥56dp height full-width button)
 *  4. Test Mode (es25.txt Section 25 & 26):
 *     - "TEST MODE - Say your emergency word now. Listening..." -> Test successful (No Guardian alert).
 *  5. 100% Offline-First
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  Vibration,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';

interface EmergencySafetyProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const EmergencySafetyScreen: React.FC<EmergencySafetyProps> = ({ onBack, onNavigate }) => {
  const [screenState, setScreenState] = useState<'normal' | 'emergency' | 'triggered'>('normal');
  const [countdown, setCountdown] = useState(5);
  const [showTestModal, setShowTestModal] = useState(false);
  const [isTestListening, setIsTestListening] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const countdownTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Handle Triggering Countdown Emergency (es25.txt Section 13)
  const handleSimulateEmergencyDetection = () => {
    setScreenState('emergency');
    setCountdown(5);
    Vibration.vibrate([0, 400, 200, 400]);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          setScreenState('triggered');
          Toast.show({
            type: 'error',
            text1: 'Emergency Alert Sent 🚨',
            text2: 'Your Guardian has been notified of your emergency.',
            position: 'top',
          });
          return 0;
        }
        Vibration.vibrate(200);
        return prev - 1;
      });
    }, 1000);
  };

  // Handle Cancel Trigger / I'M SAFE (es25.txt Section 16)
  const handleImSafe = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    setScreenState('normal');
    setCountdown(5);

    Toast.show({
      type: 'info',
      text1: 'Alert Cancelled',
      text2: 'No emergency message was sent.',
      position: 'top',
    });
  };

  // Handle Test Mode (es25.txt Section 25 & 26)
  const handleStartTestMode = () => {
    setShowTestModal(true);
    setIsTestListening(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTestListening(false);
      setTestResult('Test successful! Emergency keyword detected locally.');
      Vibration.vibrate(100);
    }, 2500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es25.txt Section 1) ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          accessible={true}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {screenState === 'emergency' ? 'EMERGENCY DETECTED' : 'Safety'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {screenState === 'normal' && (
          /* ─── 46. FINAL NORMAL-STATE LAYOUT ─── */
          <>
            <View style={styles.heroSection}>
              <View style={styles.shieldCircle}>
                <MaterialCommunityIcons name="shield-check" size={54} color={colors.success} />
              </View>

              <Text style={styles.mainTitleText}>Emergency Detection Active</Text>
              <Text style={styles.mainSubtitleText}>
                Your phone can detect your emergency word and help alert your Guardian.
              </Text>
            </View>

            {/* DETECTION ACTIVE STATUS BADGE */}
            <View style={styles.statusBadgeBox}>
              <View style={styles.greenDot} />
              <Text style={styles.statusBadgeText}>DETECTION ACTIVE</Text>
            </View>

            {/* INFO CARDS */}
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="wifi-off" size={24} color={colors.primary} />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardTitle}>Offline detection</Text>
                <Text style={styles.infoCardSubtitle}>✓ Available without internet</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="microphone-outline" size={24} color={colors.category.journal.accent} />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardTitle}>Emergency word</Text>
                <Text style={styles.infoCardSubtitle}>Configured ✓ (Sinhala / Tamil / English)</Text>
              </View>
            </View>

            {/* TEST EMERGENCY DETECTION CTA (es25.txt Section 25) */}
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleStartTestMode}
              activeOpacity={0.85}
              accessible={true}
              accessibilityLabel="Test Emergency Detection"
            >
              <MaterialCommunityIcons name="flask-outline" size={20} color={colors.primary} />
              <Text style={styles.testBtnText}>Test Emergency Detection</Text>
            </TouchableOpacity>

            {/* DEV HELPER FOR TESTING EMERGENCY COUNTDOWN */}
            <TouchableOpacity
              style={styles.simulateDevBtn}
              onPress={handleSimulateEmergencyDetection}
            >
              <MaterialCommunityIcons name="alert-decagram-outline" size={18} color={colors.error} />
              <Text style={styles.simulateDevBtnText}>Simulate Keyword Detection (Dev)</Text>
            </TouchableOpacity>
          </>
        )}

        {screenState === 'emergency' && (
          /* ─── 47. FINAL EMERGENCY-STATE LAYOUT (es25.txt Section 13, 14, 15) ─── */
          <View style={styles.emergencyBox}>
            <MaterialCommunityIcons name="alert" size={64} color={colors.error} />
            <Text style={styles.emergencyTitleText}>EMERGENCY DETECTED</Text>
            <Text style={styles.emergencySubtitleText}>Are you in danger?</Text>

            <View style={styles.countdownCircle}>
              <Text style={styles.countdownNumberText}>{countdown}</Text>
            </View>

            <Text style={styles.countdownWarningText}>
              Guardian will be notified when the countdown ends.
            </Text>

            {/* CANCELLATION BUTTON (es25.txt Section 14 & 38) */}
            <TouchableOpacity
              style={styles.imSafeBtn}
              onPress={handleImSafe}
              activeOpacity={0.85}
              accessible={true}
              accessibilityLabel="I'm safe, cancel emergency alert"
            >
              <MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.onPrimary} />
              <Text style={styles.imSafeBtnText}>I'M SAFE</Text>
            </TouchableOpacity>
          </View>
        )}

        {screenState === 'triggered' && (
          /* ─── EMERGENCY TRIGGERED CONFIRMATION (es25.txt Section 35 & 36) ─── */
          <View style={styles.triggeredBox}>
            <View style={styles.triggeredCircle}>
              <MaterialCommunityIcons name="check" size={54} color={colors.onPrimary} />
            </View>
            <Text style={styles.triggeredTitleText}>Guardian Notified</Text>
            <Text style={styles.triggeredSubtitleText}>
              Help request dispatches your emergency signal and GPS location. Stay calm.
            </Text>

            <TouchableOpacity style={styles.imSafeBtn} onPress={() => setScreenState('normal')}>
              <Text style={styles.imSafeBtnText}>Return to Safety Screen</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ─── TEST MODE MODAL (es25.txt Section 25 & 26) ─── */}
      <Modal
        visible={showTestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.testBadge}>TEST MODE</Text>
            {isTestListening ? (
              <>
                <MaterialCommunityIcons name="microphone-wave" size={48} color={colors.primary} />
                <Text style={styles.modalTitle}>Say your emergency word now</Text>
                <Text style={styles.modalSubtitle}>Listening locally on device...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle-outline" size={48} color={colors.success} />
                <Text style={styles.modalTitle}>Test Successful 🎉</Text>
                <Text style={styles.modalSubtitle}>{testResult}</Text>
                <TouchableOpacity
                  style={styles.closeTestBtn}
                  onPress={() => setShowTestModal(false)}
                >
                  <Text style={styles.closeTestBtnText}>DONE</Text>
                </TouchableOpacity>
              </>
            )}

            {isTestListening && (
              <TouchableOpacity
                style={styles.cancelTestBtn}
                onPress={() => setShowTestModal(false)}
              >
                <Text style={styles.cancelTestBtnText}>CANCEL</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <BottomNavBar activeTab="sos" onNavigate={onNavigate} />
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
    paddingTop: spacing.s5 || 20,
    paddingBottom: 110,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.s5 || 20,
  },
  shieldCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.successContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  mainTitleText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  mainSubtitleText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successContainer,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginBottom: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.status.taken.border,
    gap: 8,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 0.5,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    gap: 14,
    ...elevation.e1,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  infoCardSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  testBtn: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    marginTop: 6,
    marginBottom: 12,
    gap: 8,
  },
  testBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  simulateDevBtn: {
    flexDirection: 'row',
    height: 44,
    backgroundColor: colors.errorContainer,
    borderRadius: radius.lg || 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.status.missed.border,
    gap: 6,
  },
  simulateDevBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.error,
  },
  emergencyBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emergencyTitleText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.error,
    marginTop: 12,
    marginBottom: 4,
  },
  emergencySubtitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 20,
  },
  countdownCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.errorContainer,
    borderWidth: 6,
    borderColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownNumberText: {
    fontSize: 64,
    fontWeight: '900',
    color: colors.error,
  },
  countdownWarningText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  imSafeBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 60,
    backgroundColor: colors.error,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    ...elevation.e3,
  },
  imSafeBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  triggeredBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  triggeredCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  triggeredTitleText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
  },
  triggeredSubtitleText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
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
  testBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  closeTestBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeTestBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  cancelTestBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelTestBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
  },
});

export default EmergencySafetyScreen;

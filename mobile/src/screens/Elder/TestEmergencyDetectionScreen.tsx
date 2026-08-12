/**
 * TestEmergencyDetectionScreen.tsx — Screen ELDER-S48 (Test Emergency Detection Screen)
 * Spec: es48.txt
 *
 * Requirements (es48.txt):
 *  1. Header: Back arrow (←), Title "Test Emergency Detection".
 *  2. Safety Isolation Rule (es48.txt Section 2 & 22):
 *     - NEVER sends Guardian alert, NEVER creates real emergency history entry, NEVER plays emergency alarm.
 *  3. Four Screen States (es48.txt Section 3, 8, 11, 13, 601-688):
 *     - IDLE: Shows "THIS IS A TEST. No Guardian alert will be sent.", configured keyword box, and [ START TEST ] button.
 *     - LISTENING: Animated microphone indicator, "Listening... Say your emergency keyword now: [KEYWORD]", and [ STOP TEST ] button.
 *     - SUCCESS: Green checkmark badge, "Test Successful. Your emergency keyword was detected successfully on this device. No Guardian alert was sent.", and [ DONE ] button.
 *     - FAILURE: Warning badge, "Test Not Detected. The emergency keyword was not detected this time.", and [ TRY AGAIN ] / [ DONE ] buttons.
 *  4. 100% Offline-First (Section 24)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';
import { voiceDetector } from '../../services/voiceKeywordDetector';

interface TestEmergencyDetectionProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  configuredKeyword?: string;
}

type TestState = 'IDLE' | 'LISTENING' | 'SUCCESS' | 'FAILURE';

const TEST_TIMEOUT_MS = 15000; // Give the elder time to actually speak

const TestEmergencyDetectionScreen: React.FC<TestEmergencyDetectionProps> = ({
  onBack,
  onNavigate,
  configuredKeyword = 'Help',
}) => {
  const [testState, setTestState] = useState<TestState>('IDLE');
  const [testError, setTestError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real end-to-end test: starts the actual microphone + Vosk pipeline
  // (voiceKeywordDetector.ts) and waits for a genuine keyword detection —
  // it does NOT simulate anything. Safety isolation (es48.txt Section 2 &
  // 22) is preserved because this screen never calls the SOS trigger /
  // emergency API regardless of outcome; it only reflects local
  // onKeywordDetected callbacks into UI state.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      voiceDetector.stopListening();
    };
  }, []);

  const handleStartTest = async () => {
    setTestError(null);
    setTestState('LISTENING');

    await voiceDetector.startListening({
      onKeywordDetected: () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        voiceDetector.stopListening();
        setTestState('SUCCESS');
      },
      onError: (error) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setTestError(error);
        setTestState('FAILURE');
      },
    });

    timeoutRef.current = setTimeout(() => {
      voiceDetector.stopListening();
      setTestState((current) => (current === 'LISTENING' ? 'FAILURE' : current));
    }, TEST_TIMEOUT_MS);
  };

  const handleStopTest = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    voiceDetector.stopListening();
    setTestState('FAILURE');
  };

  const handleReset = () => {
    setTestError(null);
    setTestState('IDLE');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es48.txt Section 1) ─── */}
      <ScreenHeader title="Test Emergency Detection" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── STATE 1: IDLE (es48.txt Section 3 & 601-629) ─── */}
        {testState === 'IDLE' && (
          <>
            <View style={styles.heroBox}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="shield-alert-outline" size={54} color={colors.primary} />
              </View>
              <Text style={styles.heroTitle}>Test your emergency detection</Text>
            </View>

            <View style={styles.warningBanner}>
              <MaterialCommunityIcons name="information" size={22} color={colors.primaryDark} style={{ marginBottom: 4 }} />
              <Text style={styles.warningTitle}>THIS IS A TEST</Text>
              <Text style={styles.warningSubtext}>No Guardian alert will be sent.</Text>
            </View>

            <View style={styles.keywordCard}>
              <Text style={styles.keywordLabel}>Your emergency keyword</Text>
              <Text style={styles.keywordValue}>"{configuredKeyword}"</Text>
            </View>

            <Text style={styles.instructionText}>
              When you're ready, tap below and say your keyword out loud.
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleStartTest}
              activeOpacity={0.85}
              accessible={true}
              accessibilityLabel="Start test"
            >
              <MaterialCommunityIcons name="microphone" size={22} color={colors.onPrimary} />
              <Text style={styles.primaryBtnText}>START TEST</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─── STATE 2: LISTENING (es48.txt Section 8 & 630-648) ─── */}
        {testState === 'LISTENING' && (
          <View style={styles.centerContainer}>
            <View style={styles.listeningCircle}>
              <ActivityIndicator size="large" color={colors.primary} />
              <MaterialCommunityIcons name="microphone" size={40} color={colors.primary} style={{ position: 'absolute' }} />
            </View>

            <Text style={styles.listeningTitle}>Listening...</Text>
            <Text style={styles.listeningSubtext}>Say your emergency keyword now:</Text>
            <Text style={styles.listeningKeyword}>"{configuredKeyword}"</Text>

            <TouchableOpacity
              style={styles.stopBtn}
              onPress={handleStopTest}
              activeOpacity={0.85}
              accessible={true}
              accessibilityLabel="Stop test"
            >
              <Text style={styles.stopBtnText}>STOP TEST</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STATE 3: SUCCESS (es48.txt Section 11 & 649-668) ─── */}
        {testState === 'SUCCESS' && (
          <View style={styles.centerContainer}>
            <View style={styles.successCircle}>
              <MaterialCommunityIcons name="check" size={54} color={colors.onPrimary} />
            </View>

            <Text style={styles.resultTitle}>Test Successful ✓</Text>
            <Text style={styles.resultSubtext}>
              Your emergency keyword was detected successfully on this device.
            </Text>

            <View style={styles.reassuranceBadge}>
              <MaterialCommunityIcons name="shield-check" size={20} color={colors.success} />
              <Text style={styles.reassuranceText}>No Guardian alert was sent.</Text>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onBack}
              activeOpacity={0.85}
              accessible={true}
              accessibilityLabel="Done"
            >
              <Text style={styles.primaryBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── STATE 4: FAILURE (es48.txt Section 13 & 669-688) ─── */}
        {testState === 'FAILURE' && (
          <View style={styles.centerContainer}>
            <View style={styles.failureCircle}>
              <MaterialCommunityIcons name="alert" size={54} color={colors.onPrimary} />
            </View>

            <Text style={styles.resultTitle}>Test Not Detected</Text>
            <Text style={styles.resultSubtext}>
              {testError
                ? testError
                : 'The emergency keyword was not detected this time. Check your microphone access and try again.'}
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleStartTest}
              activeOpacity={0.85}
              accessible={true}
              accessibilityLabel="Try again"
            >
              <Text style={styles.primaryBtnText}>TRY AGAIN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onBack}
              activeOpacity={0.8}
              accessible={true}
              accessibilityLabel="Done"
            >
              <Text style={styles.secondaryBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingTop: 24,
    paddingBottom: 110,
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
  },
  warningBanner: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    alignItems: 'center',
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 1,
    marginBottom: 2,
  },
  warningSubtext: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  keywordCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: 'center',
    marginBottom: 20,
    ...elevation.e1,
  },
  keywordLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  keywordValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
  },
  instructionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  centerContainer: {
    alignItems: 'center',
    paddingTop: 36,
  },
  listeningCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  listeningTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  listeningSubtext: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  listeningKeyword: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 40,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  failureCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
  },
  resultSubtext: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  reassuranceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.successContainer,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.status.taken.border,
    marginBottom: 32,
  },
  reassuranceText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.success,
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...elevation.e2,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  stopBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.error,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e2,
  },
  stopBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.secondary,
  },
});

export default TestEmergencyDetectionScreen;

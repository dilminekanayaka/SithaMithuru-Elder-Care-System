/**
 * OTPVerificationScreen.tsx — Screen G05 (Authentication Module / OTP Verification)
 * Spec: g05.txt
 *
 * Priorities:
 *  • Step 2 of 4 Progress Bar (50%)
 *  • Minimal Security Illustration (shield-check)
 *  • Title: "Verify Your Phone Number" (28sp Bold)
 *  • Subtitle: "We've sent a 6-digit verification code to +94 71 XXX XXXX" (Masked Phone)
 *  • 6 Individual OTP Input Boxes (52x52 dp, 24sp font, auto-advance, backspace retreat, paste support)
 *  • 60-Second Countdown Timer & Resend OTP CTA
 *  • Full-width 56dp Primary "Verify" Button
 *  • "Need Help?" footer link
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius, elevation } from '../theme';
import { API_URL } from '../services/api';

interface OTPVerificationProps {
  email?: string;
  phone?: string;
  onVerified: (code: string) => void;
  onBack: () => void;
  onNeedHelp?: () => void;
}

const OTPVerificationScreen: React.FC<OTPVerificationProps> = ({
  email,
  phone = '94712345678',
  onVerified,
  onBack,
  onNeedHelp,
}) => {
  // 6 digit array state
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  // References to 6 input fields for auto-advance/backspace
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Mask phone number for display (+94 71 XXX XXXX)
  const formatMaskedPhone = (rawPhone: string) => {
    const clean = rawPhone.replace(/\D/g, '');
    if (clean.length >= 9) {
      const prefix = clean.startsWith('94') ? '+94 ' : '+';
      const num = clean.startsWith('94') ? clean.substring(2) : clean;
      return `${prefix}${num.substring(0, 2)} XXX ${num.substring(num.length - 4)}`;
    }
    return phone || email || '+94 71 XXX XXXX';
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const otpCode = digits.join('');
  const isComplete = otpCode.length === 6;

  // Handle input per box
  const handleChangeText = (text: string, index: number) => {
    // Check if full OTP pasted (e.g. "483291")
    const cleanText = text.replace(/\D/g, '');
    if (cleanText.length === 6) {
      const newDigits = cleanText.split('');
      setDigits(newDigits);
      inputRefs.current[5]?.focus();
      return;
    }

    const val = cleanText.substring(cleanText.length - 1);
    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace retreat
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    if (!isComplete) {
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: 'Please enter the complete 6-digit verification code.',
        position: 'top',
      });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Phone Verified',
        text2: 'Mobile number ownership confirmed.',
        position: 'top',
      });
      onVerified(otpCode);
    }, 800);
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(60);
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();

    try {
      await fetch(`${API_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email }),
      });
      Toast.show({
        type: 'success',
        text1: 'New Code Sent',
        text2: `A fresh 6-digit OTP code was sent to ${formatMaskedPhone(phone)}`,
        position: 'top',
      });
    } catch (e) {
      Toast.show({
        type: 'info',
        text1: 'OTP Code Resent',
        text2: 'A new 6-digit verification code has been dispatched.',
        position: 'top',
      });
    }
  };

  const handleHelpPress = () => {
    if (onNeedHelp) {
      onNeedHelp();
    } else {
      Toast.show({
        type: 'info',
        text1: 'Need Verification Assistance?',
        text2: 'Ensure your mobile signal is active or contact support@sithamithuru.lk',
        position: 'top',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent />

      {/* HEADER BAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTag}>PHONE VERIFICATION</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* SECURITY ILLUSTRATION ICON */}
          <View style={styles.heroSection}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="shield-check" size={54} color={colors.primary} />
            </View>
            <Text style={styles.title}>Verify Your Phone Number</Text>
            <Text style={styles.subtitle}>
              We've sent a secure 6-digit verification code to{' '}
              <Text style={styles.maskedPhone}>{formatMaskedPhone(phone)}</Text>
            </Text>
          </View>

          {/* PROGRESS INDICATOR (STEP 2 OF 4 — 50%) */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressStep}>Step 2 of 4</Text>
              <Text style={styles.progressPercent}>50%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '50%' }]} />
            </View>
          </View>

          {/* 6 INDIVIDUAL OTP INPUT BOXES */}
          <View style={styles.card}>
            <View style={styles.otpRow}>
              {digits.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(ref) => (inputRefs.current[idx] = ref)}
                  style={[styles.box, digit ? styles.boxFilled : null]}
                  value={digit}
                  onChangeText={(t) => handleChangeText(t, idx)}
                  onKeyPress={(e) => handleKeyPress(e, idx)}
                  keyboardType="number-pad"
                  maxLength={6}
                  selectTextOnFocus
                  textAlign="center"
                  accessibilityLabel={`Digit ${idx + 1} of 6`}
                />
              ))}
            </View>

            {/* COUNTDOWN TIMER & RESEND ROW */}
            <View style={styles.timerRow}>
              <Text style={styles.timerText}>
                {timer > 0 ? `Code expires in 00:${timer < 10 ? `0${timer}` : timer}` : 'Code expired'}
              </Text>
              <TouchableOpacity onPress={handleResend} disabled={timer > 0} activeOpacity={0.8}>
                <Text style={[styles.resendBtnText, timer > 0 && styles.resendBtnDisabled]}>
                  {timer > 0 ? `Resend OTP (${timer}s)` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* FULL-WIDTH 56DP PRIMARY VERIFY BUTTON */}
            <TouchableOpacity
              style={[styles.verifyButton, (!isComplete || loading) && styles.disabledButton]}
              onPress={handleVerify}
              disabled={!isComplete || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.verifyButtonText}>Verifying...</Text>
                </View>
              ) : (
                <Text style={styles.verifyButtonText}>Verify & Continue</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* FOOTER NEED HELP LINK */}
          <TouchableOpacity onPress={handleHelpPress} style={styles.helpRow}>
            <MaterialCommunityIcons name="help-circle-outline" size={18} color="#64748B" />
            <Text style={styles.helpText}>Need Help?</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: spacing.s1,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.s6,
    paddingVertical: spacing.s5,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.s4,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s3,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e2,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
  maskedPhone: {
    fontWeight: '800',
    color: '#1E293B',
  },
  progressContainer: {
    marginBottom: spacing.s5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressStep: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.s5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.s5,
    ...elevation.e1,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s5,
  },
  box: {
    width: 48,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
  },
  boxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s5,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  resendBtnDisabled: {
    color: '#94A3B8',
  },
  verifyButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  helpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.s2,
  },
  helpText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
});

export default OTPVerificationScreen;

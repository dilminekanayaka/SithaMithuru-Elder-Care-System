/**
 * CreatePasswordScreen.tsx — Screen G06 (Authentication Module / Progressive Registration Step 3)
 * Spec: g04.txt
 *
 * UX/UI Specification:
 *  • Step 3 of 4 Progress Bar (75%)
 *  • Password input with live strength meter (Weak / Medium / Strong)
 *  • Confirm password input with real-time match validation
 *  • Show/Hide eye toggles for accessibility
 *  • 56dp Primary Button "Continue"
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius, elevation } from '../theme';

interface CreatePasswordScreenProps {
  onBack: () => void;
  onContinue: (password: string) => void;
}

const CreatePasswordScreen: React.FC<CreatePasswordScreenProps> = ({ onBack, onContinue }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Live strength evaluation
  const getStrength = (pass: string) => {
    if (!pass) return { label: 'None', score: 0, color: colors.text.disabled };
    if (pass.length < 8) return { label: 'Weak', score: 1, color: colors.error };
    const hasUpper = /[A-Z]/.test(pass);
    const hasNum = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    if (hasUpper && hasNum && hasSpecial && pass.length >= 10) {
      return { label: 'Strong Healthcare Security', score: 3, color: colors.primary };
    }
    return { label: 'Medium', score: 2, color: colors.warning };
  };

  const strength = getStrength(password);
  const isValid = password.length >= 8 && password === confirmPassword;

  const handleSubmit = async () => {
    if (!isValid) {
      Toast.show({
        type: 'error',
        text1: 'Password Requirement',
        text2: 'Password must be at least 8 characters and match confirm password.',
      });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onContinue(password);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent />

      {/* HEADER BAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTag}>GUARDIAN SECURITY SETUP</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* TITLE */}
          <Text style={styles.title}>Create Password</Text>
          <Text style={styles.subtitle}>Set a strong password to protect your elder's health workspace.</Text>

          {/* PROGRESS (STEP 3 OF 4 — 75%) */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressStep}>Step 3 of 4</Text>
              <Text style={styles.progressPercent}>75%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '75%' }]} />
            </View>
          </View>

          {/* FORM CARD */}
          <View style={styles.formCard}>
            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                New Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.text.tertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <View style={styles.strengthBox}>
                  <View style={styles.strengthBarRow}>
                    {[1, 2, 3].map((step) => (
                      <View
                        key={step}
                        style={[
                          styles.strengthSegment,
                          { backgroundColor: strength.score >= step ? strength.color : colors.outline },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthText, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Confirm Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.text.tertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                  <MaterialCommunityIcons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.errorText}>Passwords do not match.</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.continueButton, (!isValid || loading) && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={!isValid || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.continueButtonText}>Set Password & Continue</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: { padding: spacing.s1 },
  headerTag: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  scrollContent: { paddingHorizontal: spacing.s6, paddingVertical: spacing.s5 },
  title: { fontSize: 26, fontWeight: '900', color: colors.text.primary },
  subtitle: { fontSize: 14, fontWeight: '500', color: colors.text.secondary, marginTop: 4, marginBottom: spacing.s4 },
  progressContainer: { marginBottom: spacing.s5 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressStep: { fontSize: 12, fontWeight: '800', color: colors.primary },
  progressPercent: { fontSize: 12, fontWeight: '700', color: colors.text.secondary },
  progressBarBg: { height: 6, backgroundColor: colors.outline, borderRadius: radius.pill, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  inputGroup: { marginBottom: spacing.s4 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text.primary, marginBottom: 6 },
  required: { color: colors.error },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.s3,
    height: 52,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: colors.text.primary, fontWeight: '500' },
  eyeBtn: { padding: spacing.s2 },
  strengthBox: { marginTop: 8 },
  strengthBarRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { fontSize: 11, fontWeight: '700' },
  errorText: { fontSize: 12, color: colors.error, marginTop: 4, fontWeight: '600' },
  continueButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.s3,
    ...elevation.e2,
  },
  disabledButton: { opacity: 0.5 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  continueButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

export default CreatePasswordScreen;

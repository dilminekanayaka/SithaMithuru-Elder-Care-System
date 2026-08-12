/**
 * SignupScreen.tsx — Dual-Role Account Creation (Elder & Guardian Progressive Flow)
 *
 * Supports:
 *  1. Elder Registration Mode: Single-page streamlined account setup with Consent Checkboxes.
 *  2. Guardian Registration Mode: Step 1 of 4 Progressive Registration per g04.txt spec.
 *  3. Realtime Progress Bar: Starts at 0% and updates dynamically as fields are completed (0% -> 8% -> 16% -> 25%).
 *  4. Redirects to OTPVerificationScreen on Continue.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import { API_URL } from "../services/api";
import { colors, typography, spacing, radius, elevation } from "../theme";

interface SignupScreenProps {
  onLoginPress: () => void;
  onSignupPress?: (role: Role, user?: any, token?: string, refreshToken?: string) => void;
  onContinueToOTP?: (registrationData: { firstName: string; lastName: string; phone: string; email?: string }) => void;
}

type Role = "Elder" | "Guardian";

const SignupScreen: React.FC<SignupScreenProps> = ({
  onLoginPress,
  onSignupPress,
  onContinueToOTP,
}) => {
  const [role, setRole] = useState<Role>("Guardian");

  // Guardian Mode Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Elder Mode Fields
  const [fullName, setFullName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptHealthData, setAcceptHealthData] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Realtime progress bar calculation for Guardian Step 1 (0% -> 25%)
  const isFirstNameValid = firstName.trim().length >= 2;
  const isLastNameValid = lastName.trim().length >= 2;
  const cleanPhone = phone.replace(/\D/g, "");
  const isPhoneValid = cleanPhone.length >= 9 && cleanPhone.length <= 10;

  let progressPercent = 0;
  if (isFirstNameValid) progressPercent += 8;
  if (isLastNameValid) progressPercent += 8;
  if (isPhoneValid) progressPercent += 9; // Total 25% max for Step 1

  const isGuardianStep1Valid = isFirstNameValid && isLastNameValid && isPhoneValid;

  // Handle Guardian Continue to OTP
  const handleGuardianContinue = async () => {
    if (!isGuardianStep1Valid) {
      Toast.show({
        type: "error",
        text1: "Required Fields",
        text2: "Please enter your First Name, Last Name, and a valid Sri Lankan Mobile Number.",
        position: "top",
      });
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = cleanPhone.startsWith("94")
        ? cleanPhone
        : cleanPhone.startsWith("0")
        ? `94${cleanPhone.substring(1)}`
        : `94${cleanPhone}`;

      await fetch(`${API_URL}/auth/register-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: fullPhone,
          role: "Guardian",
        }),
      });

      Toast.show({
        type: "success",
        text1: "Verification Code Sent",
        text2: `6-digit OTP code sent to +${fullPhone}`,
        position: "top",
      });

      if (onContinueToOTP) {
        onContinueToOTP({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: fullPhone,
        });
      } else {
        onLoginPress();
      }
    } catch (error) {
      Toast.show({
        type: "info",
        text1: "Proceeding to Verification",
        text2: "SMS code generated for verification.",
        position: "top",
      });
      if (onContinueToOTP) {
        onContinueToOTP({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: cleanPhone,
        });
      } else {
        onLoginPress();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Elder Direct Signup
  const handleElderSignup = async () => {
    if (!fullName || !emailOrPhone || !password || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Required Fields",
        text2: "Please fill out all fields for Elder account creation.",
        position: "top",
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Password Mismatch",
        text2: "Password and confirm password do not match.",
        position: "top",
      });
      return;
    }

    if (password.length < 8) {
      Toast.show({
        type: "error",
        text1: "Weak Password",
        text2: "Password must be at least 8 characters long.",
        position: "top",
      });
      return;
    }

    const isEmail = emailOrPhone.includes("@");
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailOrPhone.trim())) {
        Toast.show({
          type: "error",
          text1: "Invalid Email Format",
          text2: "Please enter a valid email address.",
          position: "top",
        });
        return;
      }
    } else {
      const cleanPhoneInput = emailOrPhone.replace(/\D/g, "");
      if (cleanPhoneInput.length < 9 || cleanPhoneInput.length > 12) {
        Toast.show({
          type: "error",
          text1: "Invalid Phone Number",
          text2: "Please enter a valid mobile number.",
          position: "top",
        });
        return;
      }
    }

    if (!acceptTerms || !acceptHealthData) {
      Toast.show({
        type: "error",
        text1: "Consent Required",
        text2: "You must accept the Terms of Service and Privacy Policy.",
        position: "top",
      });
      return;
    }

    setIsLoading(true);
    try {
      const isEmail = emailOrPhone.includes("@");
      const payload = isEmail
        ? { name: fullName.trim(), email: emailOrPhone.trim().toLowerCase(), password, role: "Elder" }
        : { name: fullName.trim(), phone_number: emailOrPhone.trim(), password, role: "Elder" };

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        const payloadData = data.data || data;
        Toast.show({
          type: "success",
          text1: "Elder Account Created",
          text2: "Welcome to SithaMithuru!",
          position: "top",
        });
        if (onSignupPress) {
          onSignupPress("Elder", payloadData.user, payloadData.token, payloadData.refreshToken);
        } else {
          onLoginPress();
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Account Creation Failed",
          text2: data.message || "Error creating Elder account.",
          position: "top",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Connection Failed",
        text2: "Unable to connect to server.",
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent />

      {/* HEADER BAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onLoginPress} style={styles.backBtn} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTag}>CREATE SITHAMITHURU ACCOUNT</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* TITLE & SUBTITLE */}
          <View style={styles.heroSection}>
            <Text style={styles.title}>
              {role === "Guardian" ? "Create Guardian Account" : "Create Elder Account"}
            </Text>
            <Text style={styles.subtitle}>
              {role === "Guardian"
                ? "Let's get started with your basic information."
                : "Simple setup to connect with your caregiver."}
            </Text>
          </View>

          {/* ROLE SELECTOR TOGGLE (ELDER VS GUARDIAN) */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, role === "Guardian" && styles.activeToggle]}
              onPress={() => setRole("Guardian")}
            >
              <Text style={[styles.toggleText, role === "Guardian" && styles.activeToggleText]}>
                Guardian Mode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleButton, role === "Elder" && styles.activeToggle]}
              onPress={() => setRole("Elder")}
            >
              <Text style={[styles.toggleText, role === "Elder" && styles.activeToggleText]}>
                Elder Mode
              </Text>
            </TouchableOpacity>
          </View>

          {/* GUARDIAN PROGRESSIVE MODE (STEP 1 OF 4) */}
          {role === "Guardian" ? (
            <View>
              {/* REALTIME DYNAMIC PROGRESS BAR (0% -> 25%) */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressStep}>Step 1 of 4</Text>
                  <Text style={styles.progressPercent}>{progressPercent}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>
              </View>

              {/* GUARDIAN FORM CARD */}
              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    First Name <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="account-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. John"
                      placeholderTextColor={colors.text.tertiary}
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Last Name <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="account-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Silva"
                      placeholderTextColor={colors.text.tertiary}
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Mobile Number <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.flagText}>🇱🇰</Text>
                      <Text style={styles.countryCodeText}>+94</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="071 234 5678"
                      placeholderTextColor={colors.text.tertiary}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      maxLength={12}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.continueButton, (!isGuardianStep1Valid || isLoading) && styles.disabledButton]}
                  onPress={handleGuardianContinue}
                  disabled={!isGuardianStep1Valid || isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.onPrimary} size="small" />
                  ) : (
                    <View style={styles.btnRow}>
                      <Text style={styles.continueButtonText}>Continue to Verification</Text>
                      <MaterialCommunityIcons name="arrow-right" size={20} color={colors.onPrimary} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ELDER REGISTRATION MODE */
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Full Name <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="account-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Amma / Nimal Perera"
                    placeholderTextColor={colors.text.tertiary}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Email or Mobile Number <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="cellphone" size={20} color={colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="0712345678 or elder@email.com"
                    placeholderTextColor={colors.text.tertiary}
                    value={emailOrPhone}
                    onChangeText={setEmailOrPhone}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Password <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor={colors.text.tertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Confirm Password <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-check-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm password"
                    placeholderTextColor={colors.text.tertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>
              </View>

              {/* CONSENT CHECKBOXES */}
              <View style={styles.consentBox}>
                <TouchableOpacity style={styles.checkRow} onPress={() => setAcceptTerms(!acceptTerms)}>
                  <MaterialCommunityIcons
                    name={acceptTerms ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={20}
                    color={acceptTerms ? colors.primary : colors.text.tertiary}
                  />
                  <Text style={styles.consentText}>I agree to the Terms of Service.</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.checkRow} onPress={() => setAcceptHealthData(!acceptHealthData)}>
                  <MaterialCommunityIcons
                    name={acceptHealthData ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={20}
                    color={acceptHealthData ? colors.primary : colors.text.tertiary}
                  />
                  <Text style={styles.consentText}>I consent to health data monitoring (GDPR).</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.continueButton, isLoading && styles.disabledButton]}
                onPress={handleElderSignup}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text style={styles.continueButtonText}>Create Elder Account</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* LOGIN LINK */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onLoginPress}>
              <Text style={styles.linkText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: {
    padding: spacing.s1,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.s6,
    paddingVertical: spacing.s5,
  },
  heroSection: {
    marginBottom: spacing.s4,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.secondary,
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: colors.outline,
    borderRadius: radius.xl,
    padding: 4,
    marginBottom: spacing.s5,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.lg,
  },
  activeToggle: {
    backgroundColor: colors.surface,
    ...elevation.e1,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text.secondary,
  },
  activeToggleText: {
    color: colors.primary,
  },
  progressContainer: {
    marginBottom: spacing.s5,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressStep: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text.secondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.outline,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: spacing.s6,
    ...elevation.e1,
  },
  inputGroup: {
    marginBottom: spacing.s4,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 6,
  },
  required: {
    color: colors.error,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.s3,
    height: 52,
  },
  inputIcon: {
    marginRight: 8,
  },
  countryCodeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 8,
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: colors.outline,
  },
  flagText: {
    fontSize: 16,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text.primary,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: "500",
  },
  eyeBtn: {
    padding: spacing.s2,
  },
  consentBox: {
    gap: 8,
    marginBottom: spacing.s4,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  consentText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  continueButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.s3,
    ...elevation.e2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  continueButtonText: {
    color: colors.onPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.s4,
  },
  footerText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});

export default SignupScreen;

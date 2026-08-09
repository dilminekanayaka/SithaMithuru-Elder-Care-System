/**
 * LoginScreen.tsx — Screen G03 (Authentication Module / Guardian Login)
 * Spec: g03.txt
 *
 * Priorities:
 *  • Enterprise Healthcare Login UI matching Epic MyChart / One Medical
 *  • Clean light background (#F8FAFC), 24px cards, 16px button radius
 *  • Phone number (🇱🇰 +94) or Email login input
 *  • Password input with Show/Hide toggle
 *  • "Remember this device" checkbox
 *  • Biometric Authentication (Fingerprint / Face Unlock) trigger
 *  • Full-width 56dp primary Login button
 *  • Privacy Policy & Terms of Service footer links + v1.0.0 label
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import { API_URL } from "../services/api";
import { colors, typography, spacing, radius, elevation } from "../theme";

interface LoginScreenProps {
  onLoginPress: (role: Role, user?: any, token?: string, refreshToken?: string) => void;
  onRegisterPress?: () => void;
  onSignupPress?: () => void;
  onForgotPasswordPress?: () => void;
  onForgotPassword?: () => void;
  onBack?: () => void;
}

type Role = "Elder" | "Guardian";

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginPress,
  onRegisterPress,
  onSignupPress,
  onForgotPasswordPress,
  onForgotPassword,
  onBack,
}) => {
  const handleRegisterNav = onSignupPress || onRegisterPress || (() => {});
  const handleForgotNav = onForgotPasswordPress || onForgotPassword || (() => {});

  const [role, setRole] = useState<Role>("Guardian");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password) {
      Toast.show({
        type: "error",
        text1: "Required Fields",
        text2: "Please enter your email or mobile number and password.",
        position: "top",
      });
      return;
    }

    setIsLoading(true);
    try {
      const isEmail = emailOrPhone.includes("@");
      const payload = isEmail
        ? { email: emailOrPhone.trim().toLowerCase(), password }
        : { phone_number: emailOrPhone.trim(), password };

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Login Successful",
          text2: `Welcome back to SithaMithuru!`,
          position: "top",
        });
        onLoginPress(data.user.role as Role, data.user, data.token, data.refreshToken);
      } else {
        Toast.show({
          type: "error",
          text1: "Sign In Failed",
          text2: data.message || "Invalid credentials. Please check your details.",
          position: "top",
        });
      }
    } catch (error) {
      console.error("Login Error:", error);
      Toast.show({
        type: "error",
        text1: "Connection Failed",
        text2: "Unable to connect to server. Please check your network.",
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = () => {
    Toast.show({
      type: "info",
      text1: "Biometric Login",
      text2: "Verifying fingerprint / Face Unlock...",
      position: "top",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent />
      
      {/* HEADER BAR */}
      <View style={styles.headerBar}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <Text style={styles.headerTag}>GUARDIAN SECURE LOGIN</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* LOGO & TITLE */}
          <View style={styles.heroSection}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="shield-heart" size={44} color={colors.primary} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to monitor your elder's health securely.</Text>
          </View>

          {/* ROLE SELECTOR */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                role === "Guardian" && styles.activeToggle,
              ]}
              onPress={() => setRole("Guardian")}
            >
              <Text
                style={[
                  styles.toggleText,
                  role === "Guardian" && styles.activeToggleText,
                ]}
              >
                Guardian Mode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                role === "Elder" && styles.activeToggle,
              ]}
              onPress={() => setRole("Elder")}
            >
              <Text
                style={[
                  styles.toggleText,
                  role === "Elder" && styles.activeToggleText,
                ]}
              >
                Elder Mode
              </Text>
            </TouchableOpacity>
          </View>

          {/* FORM CARD */}
          <View style={styles.formCard}>
            {/* Phone or Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Mobile Number or Email <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 071 234 5678 or name@email.com"
                  placeholderTextColor="#94A3B8"
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={20}
                  color={rememberMe ? colors.primary : "#94A3B8"}
                />
                <Text style={styles.rememberText}>Remember this device</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotNav}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Full-width Primary Login Button (56dp height, 16dp radius) */}
            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.signInButtonText}>Signing In...</Text>
                </View>
              ) : (
                <Text style={styles.signInButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* DIVIDER */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* BIOMETRIC LOGIN BUTTON */}
          <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometricLogin} activeOpacity={0.85}>
            <MaterialCommunityIcons name="fingerprint" size={24} color={colors.primary} />
            <Text style={styles.biometricBtnText}>Continue with Biometrics</Text>
          </TouchableOpacity>

          {/* REGISTER LINK */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegisterNav}>
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By signing in, you agree to our <Text style={styles.footerLink}>Privacy Policy</Text> and <Text style={styles.footerLink}>Terms</Text>.
            </Text>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
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
    alignItems: "center",
    marginBottom: spacing.s5,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.s3,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e1,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1E293B",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
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
    backgroundColor: "#FFFFFF",
    ...elevation.e1,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  activeToggleText: {
    color: colors.primary,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: spacing.s5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: spacing.s5,
    ...elevation.e1,
  },
  inputGroup: {
    marginBottom: spacing.s4,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  required: {
    color: colors.error,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: radius.xl,
    paddingHorizontal: spacing.s3,
    height: 52,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "500",
  },
  eyeBtn: {
    padding: spacing.s2,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.s5,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rememberText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  forgotText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  signInButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    ...elevation.e2,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.s4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#CBD5E1",
  },
  dividerText: {
    marginHorizontal: spacing.s3,
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
  },
  biometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: "#FFFFFF",
    marginBottom: spacing.s5,
  },
  biometricBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.s5,
  },
  registerText: {
    color: "#64748B",
    fontSize: 14,
  },
  registerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  footer: {
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
  footerLink: {
    color: colors.primary,
    fontWeight: "700",
  },
  versionText: {
    fontSize: 11,
    color: "#CBD5E1",
    fontWeight: "600",
    marginTop: 4,
  },
});

export default LoginScreen;

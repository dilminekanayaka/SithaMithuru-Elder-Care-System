/**
 * GuardianWelcomeScreen.tsx — Screen G02 (Authentication Module / Welcome Screen)
 * Spec: g02.txt
 *
 * UX/UI Features:
 *  • 96 × 96 px App Logo container with scale animation (95% -> 100%)
 *  • Title: "Welcome to SithaMithuru Guardian" (28sp Bold)
 *  • Subtitle: "Monitor your loved one's health, receive emergency alerts, and stay connected anytime."
 *  • 3 Concise Feature Cards: Emergency Monitoring 🛡, Medication Tracking 💊, Daily Well-being ❤️
 *  • Full-width Primary CTA: "Login" (56dp height, 16dp radius)
 *  • Full-width Secondary CTA: "Create Account"
 *  • Tappable Footer Links: Privacy Policy & Terms of Service
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius, elevation } from '../../theme';

interface GuardianWelcomeScreenProps {
  onLogin: () => void;
  onRegister: () => void;
  onPrivacy?: () => void;
  onTerms?: () => void;
}

const GuardianWelcomeScreen: React.FC<GuardianWelcomeScreenProps> = ({
  onLogin,
  onRegister,
  onPrivacy,
  onTerms,
}) => {
  // Micro-interaction animations
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoScale, logoOpacity, slideAnim]);

  const handlePrivacyPress = () => {
    if (onPrivacy) {
      onPrivacy();
    } else {
      Toast.show({
        type: 'info',
        text1: 'Privacy Policy',
        text2: 'SithaMithuru is HIPAA & GDPR compliant. Your family data is encrypted.',
      });
    }
  };

  const handleTermsPress = () => {
    if (onTerms) {
      onTerms();
    } else {
      Toast.show({
        type: 'info',
        text1: 'Terms of Service',
        text2: 'Read SithaMithuru Elder Care Terms & License Agreement.',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO LOGO & TITLES */}
        <View style={styles.headerSection}>
          <Animated.View
            style={[
              styles.logoBox,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <MaterialCommunityIcons name="shield-heart" size={54} color={colors.primary} />
          </Animated.View>

          <Text style={styles.title}>Welcome to SithaMithuru Guardian</Text>
          <Text style={styles.subtitle}>
            Monitor your loved one's health, receive emergency alerts, and stay connected anytime.
          </Text>
        </View>

        {/* 3 CONCISE FEATURE CARDS */}
        <Animated.View
          style={[
            styles.cardsContainer,
            {
              opacity: logoOpacity,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Card 1: Emergency Monitoring */}
          <View style={styles.featureCard}>
            <View style={[styles.cardIconBox, { backgroundColor: '#FFEBEE' }]}>
              <MaterialCommunityIcons name="shield-alert-outline" size={24} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Emergency Monitoring</Text>
              <Text style={styles.cardSub}>Receive instant emergency alerts.</Text>
            </View>
          </View>

          {/* Card 2: Medication Tracking */}
          <View style={styles.featureCard}>
            <View style={[styles.cardIconBox, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="pill" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Medication Tracking</Text>
              <Text style={styles.cardSub}>Know when medicines are taken or missed.</Text>
            </View>
          </View>

          {/* Card 3: Daily Well-being */}
          <View style={styles.featureCard}>
            <View style={[styles.cardIconBox, { backgroundColor: '#E3F2FD' }]}>
              <MaterialCommunityIcons name="heart-pulse" size={24} color="#1976D2" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Daily Well-being</Text>
              <Text style={styles.cardSub}>Track routines and mood updates.</Text>
            </View>
          </View>
        </Animated.View>

        {/* CTA BUTTONS SECTION */}
        <View style={styles.actionsSection}>
          {/* Primary CTA Button: Login */}
          <TouchableOpacity style={styles.primaryButton} onPress={onLogin} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>

          {/* Secondary CTA Button: Create Account */}
          <TouchableOpacity style={styles.secondaryButton} onPress={onRegister} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER PRIVACY LINKS */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkText} onPress={handlePrivacyPress}>
              Privacy Policy
            </Text>{' '}
            and{' '}
            <Text style={styles.linkText} onPress={handleTermsPress}>
              Terms of Service
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s8,
    paddingBottom: spacing.s6,
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.s6,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e2,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: spacing.s2,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.s2,
  },
  cardsContainer: {
    gap: spacing.s3,
    marginBottom: spacing.s6,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s4,
    backgroundColor: colors.surface,
    padding: spacing.s4,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e1,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  cardSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  actionsSection: {
    gap: spacing.s3,
    marginBottom: spacing.s5,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e2,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: spacing.s2,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default GuardianWelcomeScreen;

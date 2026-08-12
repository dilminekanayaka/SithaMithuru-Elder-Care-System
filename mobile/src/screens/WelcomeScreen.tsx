/**
 * WelcomeScreen.tsx — Screen ELDER-S02 (Welcome Screen)
 * Spec: es2.txt
 *
 * Primary Onboarding Entry Screen for First-Time Elder Users.
 * Objective: Simple, warm, respectful & empowering introduction to SithaMithuru.
 *
 * Priorities:
 *  • Empowering tone ("Your Caring Companion")
 *  • Large typography (28sp headline, 18sp body)
 *  • Large touch target (56dp CTA)
 *  • Step 1 of 3 indicator
 *  • No Skip button (per UX recommendation in es2.txt)
 *  • Stores onboarding_status = IN_PROGRESS
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  BackHandler,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, elevation } from '../theme';

const { width } = Dimensions.get('window');

interface WelcomeScreenProps {
  onGetStarted?: () => void;
  onNavigateLanguage?: () => void;
}

export const ONBOARDING_STATUS_KEY = 'sithamithuru_onboarding_status';

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onNavigateLanguage,
}) => {
  // Mark onboarding in progress when screen mounts
  useEffect(() => {
    AsyncStorage.setItem(ONBOARDING_STATUS_KEY, 'IN_PROGRESS').catch(() => {});
    AccessibilityInfo.announceForAccessibility(
      'Welcome to SithaMithuru. Your Caring Companion. Step 1 of 3.'
    );
  }, []);

  // Hardware back button handler (es2.txt Section 28)
  useEffect(() => {
    const handleBackPress = () => {
      Alert.alert(
        'Exit SithaMithuru',
        'Are you sure you want to exit the application?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]
      );
      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );
    return () => subscription.remove();
  }, []);

  const handleGetStartedPress = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STATUS_KEY, 'IN_PROGRESS');
    } catch {}

    if (onGetStarted) {
      onGetStarted();
    } else if (onNavigateLanguage) {
      onNavigateLanguage();
    }
  }, [onGetStarted, onNavigateLanguage]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" translucent={false} />

      {/* SCAFFOLD TOP SPACING */}
      <View style={styles.topBar} />

      {/* MAIN CONTENT AREA */}
      <View style={styles.contentContainer}>
        {/* Warm & Dignified Caring Illustration Badge (es2.txt Section 5 & 6) */}
        <View style={styles.illustrationCard}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="hand-heart"
              size={72}
              color={colors.primary || colors.primary}
            />
          </View>
          <View style={styles.badgeRow}>
            <MaterialCommunityIcons name="shield-check" size={18} color={colors.success} />
            <Text style={styles.badgeText}>Safe & Dignified Care</Text>
          </View>
        </View>

        {/* Main Headline (es2.txt Section 7: 24-30sp, max 2 lines) */}
        <Text style={styles.headline}>Your Caring Companion</Text>

        {/* Supporting Description (es2.txt Section 8: 17-18sp, 2-3 lines empowering tone) */}
        <Text style={styles.description}>
          Simple support for your everyday life, medicine reminders, safety, and staying connected with loved ones.
        </Text>
      </View>

      {/* BOTTOM AREA: PROGRESS & PRIMARY CTA */}
      <View style={styles.bottomBox}>
        {/* Step Indicator (es2.txt Section 13: Step 1 of 3 for clarity) */}
        <View style={styles.progressContainer}>
          <Text style={styles.stepText}>Step 1 of 3</Text>
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={[styles.dot, styles.inactiveDot]} />
            <View style={[styles.dot, styles.inactiveDot]} />
          </View>
        </View>

        {/* Primary CTA Button (es2.txt Section 9: 56dp height, 18sp bold text) */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={handleGetStartedPress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Get Started"
          accessibilityHint="Navigates to Language Selection screen"
        >
          <Text style={styles.buttonText}>GET STARTED</Text>
          <MaterialCommunityIcons name="arrow-right" size={22} color={colors.onPrimary} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.s5 || 20,
    paddingVertical: spacing.s4 || 16,
  },
  topBar: {
    height: 20,
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    paddingHorizontal: spacing.s2 || 8,
  },
  illustrationCard: {
    width: width * 0.65,
    maxWidth: 240,
    height: width * 0.65,
    maxHeight: 240,
    borderRadius: radius.xxl || 32,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s7 || 32,
    borderWidth: 1,
    borderColor: colors.outline,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.primaryContainer || colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s3 || 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.status.taken.border,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.successDark,
    marginLeft: 4,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.4,
    marginBottom: spacing.s4 || 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: spacing.s2 || 8,
  },
  bottomBox: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    marginBottom: spacing.s4 || 16,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: spacing.s4 || 16,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary || colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: colors.outline,
  },
  primaryButton: {
    width: '100%',
    height: 56, // es2.txt Section 9: 52-56dp target
    backgroundColor: colors.primary || colors.primary,
    borderRadius: radius.lg || 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary || colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});

export default WelcomeScreen;

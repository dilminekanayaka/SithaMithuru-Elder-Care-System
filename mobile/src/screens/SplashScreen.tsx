/**
 * SplashScreen.tsx — Screen G01 (Authentication Module / Splash Bootstrapper)
 * Spec: g01- splash screen.txt
 *
 * Priorities:
 *  • Production Healthcare Application Bootstrapper
 *  • Scale animation (95% -> 100% over 600ms)
 *  • App Name: "SithaMithuru", Subtitle: "Guardian Companion"
 *  • Material Linear Progress Bar (0% -> 100%)
 *  • Dynamic Startup Messages ("Preparing Secure Session...", "Initializing Local Storage...", etc.)
 *  • Version Label: "v1.0.0"
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius, elevation } from '../theme';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

const STARTUP_MESSAGES = [
  'Preparing Secure Session...',
  'Initializing Local Storage...',
  'Validating Credentials...',
  'Syncing Health Telemetry...',
  'Almost Ready...',
];

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Animation References
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeText = useRef(new Animated.Value(1)).current;

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // 1. Logo scale & opacity animation (600ms target)
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Linear progress bar animation (0% -> 100% over 2.2 seconds)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: false,
    }).start();

    // 3. Dynamic loading message step updates
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev < STARTUP_MESSAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    // 4. Time budget completion (2.4s) -> Trigger navigation decision
    const finishTimer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 2400);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(finishTimer);
    };
  }, [onFinish, logoScale, logoOpacity, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F8FAFC" barStyle="dark-content" translucent />

      {/* TOP / CENTER BRANDING */}
      <View style={styles.centerBox}>
        {/* Animated Vector Logo (120x120 px) */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <MaterialCommunityIcons name="shield-heart" size={68} color={colors.primary} />
        </Animated.View>

        {/* App Title */}
        <Text style={styles.appName}>SithaMithuru</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Guardian Companion</Text>
      </View>

      {/* BOTTOM PROGRESS & BOOTSTRAP CONTROL */}
      <View style={styles.bottomBox}>
        {/* Material Linear Progress Bar */}
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>

        {/* Dynamic Loading Message */}
        <Text style={styles.loadingMessage}>{STARTUP_MESSAGES[messageIndex]}</Text>

        {/* Version Label */}
        <Text style={styles.versionLabel}>v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.s8,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e2,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  bottomBox: {
    width: width * 0.8,
    alignItems: 'center',
    marginBottom: spacing.s4,
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.s3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  loadingMessage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginBottom: spacing.s6,
  },
  versionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    letterSpacing: 1,
  },
});

export default SplashScreen;

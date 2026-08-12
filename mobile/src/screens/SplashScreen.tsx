/**
 * SplashScreen.tsx — Screen ELDER-S01 (Splash Screen / System Entry)
 * Spec: es1.txt & g01- splash screen.txt
 *
 * Requirements (es1.txt):
 *  • Primary Goal: Safely initialize app, check session/profile, navigate fast + reliable.
 *  • Core Principles: FAST + CALM + TRUSTWORTHY + OFFLINE-FIRST.
 *  • Tagline: "Your Caring Companion"
 *  • Visual Hierarchy: 01 Logo, 02 SithaMithuru, 03 Tagline, 04 Loading Indicator (● ● ●).
 *  • Clean solid background (#F8FAFC). Avoid cluttered graphics/gradients/menus.
 *  • Error State: Friendly user-facing message with [ Try Again ] button if init fails.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius, elevation } from '../theme';
import {
  initializeApplication,
  StartupResult,
  StartupStep,
} from '../services/startupService';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onStartupComplete?: (result: StartupResult) => void;
  /** Backward compatibility with legacy onFinish callback */
  onFinish?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({
  onStartupComplete,
  onFinish,
}) => {
  // Animation References
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  // State Management (es1.txt State Model)
  const [startupStep, setStartupStep] = useState<StartupStep>('INITIALIZING');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 1. Logo Entrance Animation (300ms - 500ms target per es1.txt)
  const startLogoAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOpacity, logoScale]);

  // 2. Pulsing Dots Animation (● ● ●)
  const startDotsAnimation = useCallback(() => {
    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createPulse(dot1Anim, 0);
    const anim2 = createPulse(dot2Anim, 180);
    const anim3 = createPulse(dot3Anim, 360);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1Anim, dot2Anim, dot3Anim]);

  // 3. Application Startup Execution Coordinator
  const runStartup = useCallback(async () => {
    setIsError(false);
    setErrorMessage('');
    setStartupStep('INITIALIZING');

    try {
      const result = await initializeApplication((step) => {
        setStartupStep(step);
      });

      // Announce accessibility status
      AccessibilityInfo.announceForAccessibility('SithaMithuru initialized. Welcome.');

      if (onStartupComplete) {
        onStartupComplete(result);
      } else if (onFinish) {
        onFinish();
      }
    } catch (err: any) {
      console.error('Splash error:', err);
      setIsError(true);
      setStartupStep('ERROR');
      setErrorMessage('We couldn\'t prepare the app on this device.');
      AccessibilityInfo.announceForAccessibility(
        'Application startup failed. Please tap try again.'
      );
    }
  }, [onStartupComplete, onFinish]);

  useEffect(() => {
    startLogoAnimation();
    const stopDots = startDotsAnimation();
    runStartup();

    return () => {
      stopDots();
    };
  }, [startLogoAnimation, startDotsAnimation, runStartup]);

  return (
    <SafeAreaView
      style={styles.container}
      accessible={true}
      accessibilityLabel="SithaMithuru - Your Caring Companion. Initializing application."
    >
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" translucent />

      {/* CENTER BRANDING SECTION (es1.txt Section 5 & 7: Vertically placed at ~40-45% height) */}
      <View style={styles.centerBox}>
        {/* Animated Brand Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel="SithaMithuru Logo"
        >
          <MaterialCommunityIcons
            name={isError ? 'shield-alert' : 'hand-heart'}
            size={68}
            color={isError ? colors.error : colors.primary}
          />
        </Animated.View>

        {/* App Title (es1.txt Section 9) */}
        <Text style={styles.appName}>SithaMithuru</Text>

        {/* Official Tagline (es1.txt Section 10: "Your Caring Companion") */}
        <Text style={styles.tagline}>Your Caring Companion</Text>
      </View>

      {/* BOTTOM AREA: LOADING DOTS OR FRIENDLY ERROR CARD */}
      <View style={styles.bottomBox}>
        {!isError ? (
          <View style={styles.loadingContainer} accessible={true} accessibilityLabel="Loading">
            {/* Subtle Pulsing Dots Indicator (es1.txt Section 13: ● ● ●) */}
            <View style={styles.dotsRow}>
              <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
              <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
              <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
            </View>
          </View>
        ) : (
          /* Friendly Error Card (es1.txt Section 25: Clean error state without technical exceptions) */
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorSubtext}>
              {errorMessage || 'We couldn\'t prepare the app on this device.'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.8}
              onPress={runStartup}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Try Again"
            >
              <MaterialCommunityIcons name="refresh" size={20} color={colors.onPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingVertical: spacing.s8,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40, // Visual balance for ~40-45% screen height placement
  },
  logoContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e2,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: 'System',
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.secondary,
    letterSpacing: 0.3,
    fontFamily: 'System',
  },
  bottomBox: {
    width: width * 0.85,
    alignItems: 'center',
    marginBottom: spacing.s6,
    minHeight: 100,
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s2,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginHorizontal: 5,
  },
  errorCard: {
    width: '100%',
    backgroundColor: colors.errorContainer,
    borderRadius: radius.lg,
    padding: spacing.s5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.status.missed.border,
    ...elevation.e1,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.errorDark,
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.errorDark,
    textAlign: 'center',
    marginBottom: spacing.s4,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default SplashScreen;

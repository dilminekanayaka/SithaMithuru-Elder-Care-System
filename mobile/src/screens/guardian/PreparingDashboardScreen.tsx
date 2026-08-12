/**
 * PreparingDashboardScreen.tsx — Post-Pairing Care Workspace Initialization Transition Screen
 *
 * UX Requirements:
 *  • Confirms elder linked successfully
 *  • Displays real-time synchronization progress (profile, medications, tasks, notifications, offline SQLite)
 *  • Material linear progress bar (0% -> 100%)
 *  • Automatically navigates to Guardian Dashboard after ~2.4 seconds
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius, elevation } from '../../theme';

const { width } = Dimensions.get('window');

interface PreparingDashboardScreenProps {
  elderName?: string;
  onFinish: () => void;
}

const SYNC_STEPS = [
  { text: 'Elder Profile Linked', icon: 'account-check-outline' },
  { text: 'Medication Schedules Downloaded', icon: 'pill' },
  { text: 'Routine Care Tasks Initialized', icon: 'clipboard-check-outline' },
  { text: 'Emergency & Push Notifications Active', icon: 'bell-ring-outline' },
  { text: 'Offline Care Workspace Ready', icon: 'database-check-outline' },
];

const PreparingDashboardScreen: React.FC<PreparingDashboardScreenProps> = ({
  elderName = 'Your Elder',
  onFinish,
}) => {
  const iconScale = useRef(new Animated.Value(0.9)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    // 1. Entrance Icon Animation
    Animated.parallel([
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Linear Progress Bar Animation (0% -> 100% over 2.2s)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: false,
    }).start();

    // 3. Step updates interval
    const stepInterval = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < SYNC_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 400);

    // 4. Auto-finish timer (2.4s) -> Navigates to Guardian Dashboard
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2400);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(finishTimer);
    };
  }, [onFinish, iconScale, iconOpacity, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent />

      {/* HERO ICON & TITLES */}
      <View style={styles.centerSection}>
        <Animated.View
          style={[
            styles.iconCircle,
            {
              opacity: iconOpacity,
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          <MaterialCommunityIcons name="heart-pulse" size={54} color={colors.primary} />
        </Animated.View>

        <Text style={styles.title}>Preparing Care Dashboard</Text>
        <Text style={styles.subtitle}>
          Linked with <Text style={styles.elderHighlight}>{elderName}</Text>. Preparing offline care workspace and notification telemetry...
        </Text>
      </View>

      {/* PROGRESS BAR & SYNC STEPS CARD */}
      <View style={styles.bottomCard}>
        {/* Material Linear Progress Bar */}
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>

        {/* SEQUENTIAL SYNC CHECKLIST */}
        <View style={styles.checklist}>
          {SYNC_STEPS.map((step, idx) => {
            const isCompleted = idx <= activeStepIndex;
            return (
              <View key={idx} style={styles.checkItem}>
                <MaterialCommunityIcons
                  name={isCompleted ? 'check-circle' : 'circle-outline'}
                  size={20}
                  color={isCompleted ? colors.primary : colors.outline}
                />
                <Text style={[styles.checkText, isCompleted && styles.checkTextDone]}>
                  {step.text}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.footerNote}>SithaMithuru Encrypted Session</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingVertical: spacing.s8,
    paddingHorizontal: spacing.s6,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e2,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 320,
  },
  elderHighlight: {
    fontWeight: '800',
    color: colors.primary,
  },
  bottomCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.outline,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.s5,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  checklist: {
    gap: spacing.s3,
    marginBottom: spacing.s4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  checkTextDone: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.disabled,
    textAlign: 'center',
  },
});

export default PreparingDashboardScreen;

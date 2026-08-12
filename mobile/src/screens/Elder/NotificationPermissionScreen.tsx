/**
 * NotificationPermissionScreen.tsx — Screen ELDER-S07 (Notification Permission Screen)
 * Spec: es7.txt
 *
 * Requirements (es7.txt):
 *  • Step 07 in Onboarding sequence (Welcome -> Language -> Profile -> Permissions Intro -> Mic -> Notification -> Onboarding Complete)
 *  • Explains clear benefit of notifications to Elder BEFORE requesting native OS permission
 *  • Explains 2 main features: 💊 Medicine Reminders & ✓ Daily Task Reminders
 *  • Primary Action: CONTINUE (requests native Notifications.requestPermissionsAsync())
 *  • Secondary Action: Not Now (graceful skip without blocking app or deleting medication schedules)
 *  • 100% Offline-First: Local notification schedules preserved regardless of permission state
 *  • Recovery Action: [ Open Settings ] button if permission was previously blocked in OS
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  BackHandler,
  AccessibilityInfo,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, elevation } from '../../theme';
import { setupNotificationChannelsAsync } from '../../services/notifications';

const { width } = Dimensions.get('window');

export const PERMISSION_NOTIF_KEY = 'sithamithuru_perm_notif';

interface NotificationPermissionScreenProps {
  onFinish: (granted: boolean) => void;
  onBack?: () => void;
}

const NotificationPermissionScreen: React.FC<NotificationPermissionScreenProps> = ({
  onFinish,
  onBack,
}) => {
  const [requesting, setRequesting] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Check existing OS permission status on mount & app resume (es7.txt Section 17 & 31)
  const checkPermissionStatus = useCallback(async () => {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        await AsyncStorage.setItem(PERMISSION_NOTIF_KEY, 'GRANTED');
      } else if (status === 'denied' && !canAskAgain) {
        setIsBlocked(true);
      }
    } catch (err) {
      console.warn('Error checking notification permission:', err);
    }
  }, []);

  useEffect(() => {
    checkPermissionStatus();
    AccessibilityInfo.announceForAccessibility(
      'Notification Permission. SithaMithuru can remind you about medicines and daily tasks at the right time.'
    );
  }, [checkPermissionStatus]);

  // Hardware Back Button Handler
  useEffect(() => {
    const handleBackPress = () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => sub.remove();
  }, [onBack]);

  // Handle CONTINUE button tap -> Triggers Native Android/iOS permission dialog (es7.txt Section 10 & 11)
  const handleContinuePress = async () => {
    setRequesting(true);
    let granted = false;

    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        granted = true;
      } else {
        const { status: reqStatus } = await Notifications.requestPermissionsAsync();
        granted = reqStatus === 'granted';
      }

      if (granted) {
        await setupNotificationChannelsAsync();
      }
    } catch (err) {
      console.warn('Notification permission request error:', err);
    }

    await AsyncStorage.setItem(PERMISSION_NOTIF_KEY, granted ? 'GRANTED' : 'DENIED');
    setRequesting(false);
    onFinish(granted);
  };

  // Handle "Not Now" tap -> Skip without blocking (es7.txt Section 16)
  const handleNotNowPress = async () => {
    await AsyncStorage.setItem(PERMISSION_NOTIF_KEY, 'DENIED');
    onFinish(false);
  };

  // Open System Settings if blocked (es7.txt Section 18)
  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (err) {
      console.warn('Cannot open settings:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* TOP HEADER WITH BACK BUTTON */}
      <View style={styles.topHeader}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous step"
          >
            <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <Text style={styles.stepHeaderLabel}>Reminders</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO BELL ILLUSTRATION (es7.txt Section 5) */}
        <View style={styles.heroBox}>
          <View style={styles.bellCircle}>
            <MaterialCommunityIcons name="bell-ring" size={64} color={colors.primary} />
          </View>
        </View>

        {/* TITLE & DESCRIPTION (es7.txt Section 4) */}
        <View style={styles.titleBox}>
          <Text style={styles.mainTitle}>Helpful Reminders</Text>
          <Text style={styles.subTitle}>
            SithaMithuru can remind you about medicines and daily tasks at the right time.
          </Text>
        </View>

        {/* FEATURE CARDS LIST (es7.txt Section 6 & 7) */}
        <View style={styles.cardsContainer}>
          {/* CARD 1: MEDICINE REMINDERS */}
          <View style={styles.featureCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
              <MaterialCommunityIcons name="pill" size={26} color={colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Medicine Reminders</Text>
              <Text style={styles.cardDescription}>
                Get a timely reminder when it is time to take your morning, afternoon, or evening medicine.
              </Text>
            </View>
          </View>

          {/* CARD 2: DAILY TASK REMINDERS */}
          <View style={styles.featureCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.successContainer }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={26} color={colors.success} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Daily Tasks</Text>
              <Text style={styles.cardDescription}>
                Get reminders for drinking water, appointments, and daily routines you have planned.
              </Text>
            </View>
          </View>
        </View>

        {/* SETTINGS NOTICE (es7.txt Section 3) */}
        <Text style={styles.settingsNotice}>
          You can change your notification preferences anytime later in Settings.
        </Text>

        {/* BLOCKED RECOVERY BANNER (es7.txt Section 18) */}
        {isBlocked && (
          <View style={styles.blockedBanner}>
            <MaterialCommunityIcons name="bell-off-outline" size={22} color={colors.warning} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.blockedTitle}>Notifications are turned off</Text>
              <Text style={styles.blockedSubtext}>
                Enable notifications from your phone's app settings to receive medicine reminders.
              </Text>
            </View>
            <TouchableOpacity style={styles.openSettingsBtn} onPress={handleOpenSettings}>
              <Text style={styles.openSettingsBtnText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* BOTTOM FOOTER WITH CONTINUE & NOT NOW ACTIONS (es7.txt Section 3 & 26) */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinuePress}
          disabled={requesting}
          activeOpacity={0.85}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Continue to allow notifications"
        >
          <Text style={styles.buttonText}>{requesting ? 'ALLOWING...' : 'CONTINUE'}</Text>
          <MaterialCommunityIcons name="arrow-right" size={22} color={colors.onPrimary} style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notNowButton}
          onPress={handleNotNowPress}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Not Now"
        >
          <Text style={styles.notNowText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4 || 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  stepHeaderLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s2 || 8,
    paddingBottom: spacing.s8 || 32,
    alignItems: 'center',
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: spacing.s4 || 16,
  },
  bellCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    ...elevation.e2,
  },
  titleBox: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    marginBottom: spacing.s5 || 20,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.s4 || 16,
    marginBottom: spacing.s4 || 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s4 || 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  settingsNotice: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.s4 || 16,
  },
  blockedBanner: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningContainer,
    borderRadius: radius.lg || 16,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.status.upcoming.border,
    marginBottom: spacing.s4 || 16,
  },
  blockedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warningDark,
  },
  blockedSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.warningDark,
    marginTop: 2,
  },
  openSettingsBtn: {
    backgroundColor: colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  openSettingsBtnText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: spacing.s5 || 20,
    paddingVertical: spacing.s4 || 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    maxWidth: 420,
    height: 56,
    borderRadius: radius.lg || 16,
    backgroundColor: colors.primary || colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.primary || colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  notNowButton: {
    width: '100%',
    maxWidth: 420,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notNowText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});

export default NotificationPermissionScreen;

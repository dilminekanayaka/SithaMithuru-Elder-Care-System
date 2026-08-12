/**
 * PermissionsIntroScreen.tsx — Screen ELDER-S05 (Permissions Introduction & Contextual Flow)
 * Spec: es5.txt
 *
 * Requirements (es5.txt):
 *  • Educates Elder on why permissions are needed BEFORE triggering OS popups
 *  • Never pops up multiple permission dialogs at once
 *  • Explains 3 permissions: 🎙 Emergency Support (Microphone), 🔔 Reminders (Notifications), 📷 Photos (Deferred)
 *  • Contextual Microphone Flow: Explains on-device voice processing for emergency keyword
 *  • Contextual Notification Flow: Explains medication & task reminders
 *  • Deferred Photos/Camera: Requested only when Elder performs photo actions
 *  • Graceful Denial: App does not block or crash if permission is denied. Sets emergencyDetectorReady = false.
 *  • 100% Offline-First: No network dependency
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  BackHandler,
  AccessibilityInfo,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, elevation } from '../../theme';

const { width } = Dimensions.get('window');

interface PermissionsIntroScreenProps {
  onFinishPermissions: (status: { micGranted: boolean; notifGranted: boolean }) => void;
  onBack?: () => void;
}

export const PERMISSION_MIC_KEY = 'sithamithuru_perm_mic';
export const PERMISSION_NOTIF_KEY = 'sithamithuru_perm_notif';

type FlowStage = 'INTRO' | 'MIC_FLOW' | 'NOTIF_FLOW';

const PermissionsIntroScreen: React.FC<PermissionsIntroScreenProps> = ({
  onFinishPermissions,
  onBack,
}) => {
  const [stage, setStage] = useState<FlowStage>('INTRO');
  const [micGranted, setMicGranted] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Announce screen load for accessibility
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      'Permissions Introduction. A few permissions help SithaMithuru support you safely.'
    );
  }, []);

  // Hardware Back Button Handler
  useEffect(() => {
    const handleBackPress = () => {
      if (stage === 'INTRO') {
        if (onBack) {
          onBack();
          return true;
        }
      } else if (stage === 'MIC_FLOW') {
        setStage('INTRO');
        return true;
      } else if (stage === 'NOTIF_FLOW') {
        setStage('MIC_FLOW');
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => sub.remove();
  }, [stage, onBack]);

  // Stage 1: User taps CONTINUE on INTRO screen -> Move to Microphone Flow
  const handleIntroContinue = () => {
    setStage('MIC_FLOW');
  };

  // Stage 2: Request Microphone Permission (es5.txt Section 6, 12, 14 & 15)
  const handleRequestMicrophone = async () => {
    setRequesting(true);
    let granted = false;

    try {
      const { status } = await Audio.requestPermissionsAsync();
      granted = status === 'granted';
    } catch (err) {
      console.warn('Microphone permission request error:', err);
    }

    setMicGranted(granted);
    await AsyncStorage.setItem(PERMISSION_MIC_KEY, granted ? 'GRANTED' : 'DENIED');
    setRequesting(false);

    // Move to Notification Flow
    setStage('NOTIF_FLOW');
  };

  const handleSkipMicrophone = async () => {
    setMicGranted(false);
    await AsyncStorage.setItem(PERMISSION_MIC_KEY, 'DENIED');
    setStage('NOTIF_FLOW');
  };

  // Stage 3: Request Notification Permission (es5.txt Section 8 & 18)
  const handleRequestNotifications = async () => {
    setRequesting(true);
    let granted = false;

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      granted = status === 'granted';
    } catch (err) {
      console.warn('Notification permission request error:', err);
    }

    setNotifGranted(granted);
    await AsyncStorage.setItem(PERMISSION_NOTIF_KEY, granted ? 'GRANTED' : 'DENIED');
    setRequesting(false);

    // Complete permission onboarding
    onFinishPermissions({ micGranted, notifGranted: granted });
  };

  const handleSkipNotifications = async () => {
    setNotifGranted(false);
    await AsyncStorage.setItem(PERMISSION_NOTIF_KEY, 'DENIED');
    onFinishPermissions({ micGranted, notifGranted: false });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* TOP HEADER WITH BACK ARROW */}
      <View style={styles.topHeader}>
        {onBack && stage === 'INTRO' ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back to Profile Setup"
          >
            <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <Text style={styles.stepHeaderLabel}>Permissions</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TITLE & SUBTITLE */}
        <View style={styles.titleBox}>
          <Text style={styles.mainTitle}>Almost ready</Text>
          <Text style={styles.subTitle}>
            A few permissions help SithaMithuru support you safely.
          </Text>
        </View>

        {/* 3 PERMISSION CARDS (es5.txt Section 4, 6, 8 & 9) */}
        <View style={styles.cardsContainer}>
          {/* CARD 1: EMERGENCY SUPPORT (MICROPHONE) */}
          <View style={styles.permCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
              <MaterialCommunityIcons name="microphone" size={28} color={colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Emergency Support</Text>
              <Text style={styles.cardDescription}>
                Helps the app recognize your emergency keyword ('Help' or 'බේරගන්න'). Audio is safely processed on your device.
              </Text>
            </View>
          </View>

          {/* CARD 2: REMINDERS (NOTIFICATIONS) */}
          <View style={styles.permCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.warningContainer }]}>
              <MaterialCommunityIcons name="bell-ring" size={28} color={colors.warning} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Reminders</Text>
              <Text style={styles.cardDescription}>
                Helps you receive timely medicine and daily task reminders directly on your phone.
              </Text>
            </View>
          </View>

          {/* CARD 3: PHOTOS & CAMERA (DEFERRED) */}
          <View style={styles.permCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.category.journal.bg }]}>
              <MaterialCommunityIcons name="image-multiple" size={28} color={colors.category.journal.accent} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Photos & Camera</Text>
              <Text style={styles.cardDescription}>
                Only requested when you explicitly choose to add a photo to your profile or memories.
              </Text>
            </View>
          </View>
        </View>

        {/* PRIVACY REASSURANCE BOX (es5.txt Section 25) */}
        <View style={styles.privacyBox}>
          <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.success} style={{ marginRight: 8 }} />
          <Text style={styles.privacyText}>
            Your privacy is important. You stay in control of your permissions at all times.
          </Text>
        </View>
      </ScrollView>

      {/* FOOTER: CONTINUE BUTTON FOR INTRO STAGE */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleIntroContinue}
          activeOpacity={0.85}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Continue to permissions setup"
        >
          <Text style={styles.buttonText}>CONTINUE</Text>
          <MaterialCommunityIcons name="arrow-right" size={22} color={colors.onPrimary} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>

      {/* STAGE 2: CONTEXTUAL MICROPHONE PERMISSION MODAL (es5.txt Section 12) */}
      <Modal
        visible={stage === 'MIC_FLOW'}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStage('INTRO')}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.permissionModalCard}>
            <View style={[styles.modalIconBox, { backgroundColor: colors.primaryContainer }]}>
              <MaterialCommunityIcons name="microphone-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Emergency Voice Protection</Text>
            <Text style={styles.modalDescription}>
              Allow SithaMithuru to use the microphone so it can listen for your emergency keyword ('Help' or 'බේරගන්න') on this device.
            </Text>
            <View style={styles.modalBadge}>
              <MaterialCommunityIcons name="shield-lock-outline" size={16} color={colors.success} />
              <Text style={styles.modalBadgeText}>Processed locally on device</Text>
            </View>

            <TouchableOpacity
              style={styles.allowButton}
              onPress={handleRequestMicrophone}
              disabled={requesting}
              activeOpacity={0.85}
            >
              <Text style={styles.allowButtonText}>
                {requesting ? 'ALLOWING...' : 'ALLOW MICROPHONE'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkipMicrophone}>
              <Text style={styles.skipButtonText}>Skip For Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* STAGE 3: CONTEXTUAL NOTIFICATION PERMISSION MODAL (es5.txt Section 18) */}
      <Modal
        visible={stage === 'NOTIF_FLOW'}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStage('MIC_FLOW')}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.permissionModalCard}>
            <View style={[styles.modalIconBox, { backgroundColor: colors.warningContainer }]}>
              <MaterialCommunityIcons name="bell-ring-outline" size={48} color={colors.warning} />
            </View>
            <Text style={styles.modalTitle}>Medicine & Task Reminders</Text>
            <Text style={styles.modalDescription}>
              Allow notifications so SithaMithuru can remind you about medicine times, appointments, and daily routines.
            </Text>

            <TouchableOpacity
              style={[styles.allowButton, { backgroundColor: colors.warning }]}
              onPress={handleRequestNotifications}
              disabled={requesting}
              activeOpacity={0.85}
            >
              <Text style={styles.allowButtonText}>
                {requesting ? 'ALLOWING...' : 'ALLOW NOTIFICATIONS'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkipNotifications}>
              <Text style={styles.skipButtonText}>Skip For Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: spacing.s3 || 12,
    paddingBottom: spacing.s8 || 32,
    alignItems: 'center',
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
    marginBottom: spacing.s6 || 24,
  },
  permCard: {
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
    width: 52,
    height: 52,
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
  privacyBox: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    borderRadius: radius.lg || 16,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.status.taken.border,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.successDark,
    lineHeight: 18,
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
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.s5 || 20,
  },
  permissionModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 28,
    padding: spacing.s6 || 24,
    alignItems: 'center',
    ...elevation.e4,
  },
  modalIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s4 || 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.s4 || 16,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: spacing.s6 || 24,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.successDark,
    marginLeft: 6,
  },
  allowButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary || colors.primary,
    borderRadius: radius.lg || 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  allowButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});

export default PermissionsIntroScreen;

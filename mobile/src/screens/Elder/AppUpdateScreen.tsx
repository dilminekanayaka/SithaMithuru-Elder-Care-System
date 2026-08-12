/**
 * AppUpdateScreen.tsx — Screen ELDER-S45 (App Update / Version Information Screen)
 * Spec: es45.txt
 *
 * Requirements (es45.txt):
 *  1. Header: Back arrow (←), Title "App Update".
 *  2. Current Version Display (es45.txt Section 3):
 *     - Logo icon circle (Shield Heart)
 *     - App Name "SithaMithuru"
 *     - "Current Version 1.0.0"
 *  3. Status Card (es45.txt Section 4, 5, 19):
 *     - Up to date badge: "✓ Your app is up to date"
 *     - Last checked timestamp: e.g. "Today • 10:30 AM"
 *  4. Manual Update Check Action (es45.txt Section 20):
 *     - [ CHECK FOR UPDATE ] (≥52dp height CTA button)
 *     - Interactive checking state with spinner loading indicator
 *  5. Offline / Network Error Handling (es45.txt Section 7):
 *     - "Unable to check for updates. Please connect to the internet and try again." [ TRY AGAIN ]
 *  6. Non-blocking design: App update check does not block core Elder features.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface AppUpdateProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  currentVersion?: string;
  isOnline?: boolean;
}

const AppUpdateScreen: React.FC<AppUpdateProps> = ({
  onBack,
  onNavigate,
  currentVersion = '1.0.0',
  isOnline = true,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>('Today • 10:30 AM');
  const [statusState, setStatusState] = useState<'UP_TO_DATE' | 'UPDATE_AVAILABLE' | 'ERROR'>('UP_TO_DATE');

  const handleCheckUpdate = () => {
    if (!isOnline) {
      setStatusState('ERROR');
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Please connect to the internet to check for updates.',
        position: 'top',
      });
      return;
    }

    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setStatusState('UP_TO_DATE');
      setLastChecked('Just now');
      Toast.show({
        type: 'success',
        text1: 'Up to Date',
        text2: 'SithaMithuru is running the latest version.',
        position: 'top',
      });
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es45.txt Section 1) ─── */}
      <ScreenHeader title="App Update" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── APP LOGO & VERSION IDENTITY (es45.txt Section 3) ─── */}
        <View style={styles.heroBox}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="hand-heart" size={54} color={colors.primary} />
          </View>
          <Text style={styles.appNameText}>SithaMithuru</Text>
          <Text style={styles.versionLabel}>Current Version</Text>
          <Text style={styles.versionValue}>{currentVersion}</Text>
        </View>

        {/* ─── STATUS CARD (es45.txt Section 4, 5, 7) ─── */}
        {statusState === 'UP_TO_DATE' && (
          <View style={styles.statusCard}>
            <View style={styles.upToDateBadge}>
              <MaterialCommunityIcons name="check-circle" size={28} color={colors.success} />
              <Text style={styles.upToDateText}>Your app is up to date</Text>
            </View>

            <View style={styles.timestampRow}>
              <Text style={styles.timestampLabel}>Last checked</Text>
              <Text style={styles.timestampValue}>{lastChecked}</Text>
            </View>
          </View>
        )}

        {statusState === 'ERROR' && (
          <View style={[styles.statusCard, { borderColor: '#FCA5A5', backgroundColor: colors.errorContainer }]}>
            <MaterialCommunityIcons name="wifi-off" size={32} color={colors.error} style={{ marginBottom: 8 }} />
            <Text style={styles.errorTitle}>Unable to check for updates</Text>
            <Text style={styles.errorSubtitle}>
              Please connect to the internet and try again.
            </Text>
          </View>
        )}

        {/* ─── CHECK FOR UPDATE ACTION BUTTON (es45.txt Section 20) ─── */}
        <TouchableOpacity
          style={[styles.checkBtn, isChecking && { opacity: 0.75 }]}
          onPress={handleCheckUpdate}
          disabled={isChecking}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Check for updates"
        >
          {isChecking ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={colors.onPrimary} />
              <Text style={styles.checkBtnText}>Checking...</Text>
            </View>
          ) : (
            <Text style={styles.checkBtnText}>
              {statusState === 'ERROR' ? 'TRY AGAIN' : 'CHECK FOR UPDATE'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <BottomNavBar activeTab="settings" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4 || 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: 36,
    paddingBottom: 110,
    alignItems: 'center',
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
    ...elevation.e2,
  },
  appNameText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 12,
  },
  versionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 2,
  },
  versionValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.outline,
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
    ...elevation.e1,
  },
  upToDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  upToDateText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.success,
  },
  timestampRow: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: colors.outlineVariant,
    paddingTop: 12,
    width: '100%',
  },
  timestampLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  timestampValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.error,
    marginBottom: 4,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  checkBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e2,
  },
  checkBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
});

export default AppUpdateScreen;

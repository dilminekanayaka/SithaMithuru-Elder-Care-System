/**
 * LocalDataScreen.tsx — Screen ELDER-S76 (Local Data Screen)
 * Spec: es76.txt
 *
 * Requirements (es76.txt):
 *  1. Header: Back arrow (←), Title "Local Data".
 *  2. Guidance Text (es76.txt Section 2 & 4):
 *     - "Some information is stored on your device so important features can continue working when you are offline."
 *  3. STORED ON THIS DEVICE Section (es76.txt Section 5-8):
 *     - Medication Information ("Information needed for your medication reminders.")
 *     - Reminder Settings ("Your scheduled reminder preferences.")
 *     - App Settings ("Your language, notification and accessibility preferences.")
 *     - Offline Information ("Information waiting to be synchronized when you are online.")
 *  4. LOCAL STORAGE Section (es76.txt Section 2):
 *     - "Information stored here is available to the app on this device."
 *     - [ DELETE LOCAL DATA ] CTA button ➔ navigates to deleteLocalData (Screen ELDER-S77)
 *  5. 100% Offline-First (es76.txt Section 26 & 412)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface LocalDataProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const LocalDataScreen: React.FC<LocalDataProps> = ({
  onBack,
  onNavigate,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es76.txt Section 1) ─── */}
      <ScreenHeader title="Local Data" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es76.txt Section 2 & 4) ─── */}
        <Text style={styles.guidanceText}>
          Some information is stored on your device so important features can continue working when you are offline.
        </Text>

        {/* ─── STORED ON THIS DEVICE SECTION (es76.txt Section 5-8) ─── */}
        <Text style={styles.sectionHeaderTitle}>STORED ON THIS DEVICE</Text>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoTitle}>Medication Information</Text>
            <Text style={styles.infoSubtitle}>Information needed for your medication reminders.</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoTitle}>Reminder Settings</Text>
            <Text style={styles.infoSubtitle}>Your scheduled reminder preferences.</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoTitle}>App Settings</Text>
            <Text style={styles.infoSubtitle}>Your language, notification and accessibility preferences.</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoTitle}>Offline Information</Text>
            <Text style={styles.infoSubtitle}>Information waiting to be synchronized when you are online.</Text>
          </View>
        </View>

        {/* ─── LOCAL STORAGE SECTION (es76.txt Section 2 & 12) ─── */}
        <Text style={styles.sectionHeaderTitle}>LOCAL STORAGE</Text>

        <View style={styles.card}>
          <Text style={styles.localStorageText}>
            Information stored here is available to the app on this device.
          </Text>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onNavigate('deleteLocalData')}
            activeOpacity={0.85}
            accessible={true}
            accessibilityLabel="Delete Local Data"
          >
            <Text style={styles.deleteBtnText}>DELETE LOCAL DATA</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: spacing.s4 || 16,
    paddingBottom: 110,
  },
  guidanceText: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  infoRow: {
    paddingVertical: 4,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 12,
  },
  localStorageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteBtn: {
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.xl || 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.status.missed.border,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.error,
    letterSpacing: 0.5,
  },
});

export default LocalDataScreen;

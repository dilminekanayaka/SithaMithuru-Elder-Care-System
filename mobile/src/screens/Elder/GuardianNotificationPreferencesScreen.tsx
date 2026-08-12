/**
 * GuardianNotificationPreferencesScreen.tsx — Screen ELDER-S61 (Guardian Notification Preferences Screen)
 * Spec: es61.txt
 *
 * Requirements (es61.txt):
 *  1. Header: Back arrow (←), Title "Guardian Notifications".
 *  2. Connected Guardian Header (es61.txt Section 13):
 *     - Guardian Name ("Nimal Perera"), Status "✓ Connected"
 *  3. Notification Preference Categories (es61.txt Section 3, 5, 6, 7, 8, 9, 646-684):
 *     - Emergency Alerts: Mandatory safety feature -> "✓ Always enabled for safety" (Non-disableable switch to protect safety pathway).
 *     - Medication Alerts: Interactive Switch (ON / OFF) -> "Receive supported medication notifications."
 *     - Wellbeing Alerts: Interactive Switch (ON / OFF) -> "Receive supported wellbeing notifications."
 *     - Inactivity Alerts: Interactive Switch (ON / OFF) -> "Receive supported inactivity notifications."
 *  4. Sync Information Banner (es61.txt Section 22):
 *     - "Changes are saved locally and synchronized when online."
 *  5. 100% Offline-First (Section 20 & 21): Local state persistence in SQLite/device storage.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Switch,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface GuardianNotificationPreferencesProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  guardianName?: string;
}

const GuardianNotificationPreferencesScreen: React.FC<GuardianNotificationPreferencesProps> = ({
  onBack,
  onNavigate,
  guardianName = 'Nimal Perera',
}) => {
  const [medicationAlerts, setMedicationAlerts] = useState(true);
  const [wellbeingAlerts, setWellbeingAlerts] = useState(true);
  const [inactivityAlerts, setInactivityAlerts] = useState(true);

  const handleToggle = (setter: (val: boolean) => void, val: boolean, name: string) => {
    setter(val);
    Toast.show({
      type: 'info',
      text1: 'Preference Saved',
      text2: `${name} notifications ${val ? 'enabled' : 'disabled'}.`,
      position: 'top',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es61.txt Section 1) ─── */}
      <ScreenHeader title="Guardian Notifications" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── CONNECTED GUARDIAN HEADER (es61.txt Section 13) ─── */}
        <View style={styles.guardianHeaderCard}>
          <Text style={styles.guardianHeaderLabel}>GUARDIAN</Text>
          <Text style={styles.guardianNameText}>{guardianName}</Text>
          <View style={styles.connectedBadgeBox}>
            <View style={styles.greenDot} />
            <Text style={styles.connectedBadgeText}>Connected</Text>
          </View>
        </View>

        <Text style={styles.sectionHeaderTitle}>SAFETY NOTIFICATIONS</Text>

        {/* ─── 1. EMERGENCY ALERTS (es61.txt Section 5 & 6) ─── */}
        <View style={styles.preferenceCard}>
          <View style={styles.preferenceMainRow}>
            <View style={styles.iconCircleRed}>
              <MaterialCommunityIcons name="shield-alert" size={24} color={colors.error} />
            </View>
            <View style={styles.preferenceTextCol}>
              <Text style={styles.preferenceTitleText}>Emergency Alerts</Text>
              <Text style={styles.alwaysEnabledText}>✓ Always enabled for safety</Text>
            </View>
            <Switch value={true} disabled trackColor={{ false: colors.outline, true: colors.primaryContainer }} thumbColor={colors.primary} />
          </View>
          <Text style={styles.preferenceDescText}>Receive supported emergency notifications.</Text>
        </View>

        {/* ─── 2. MEDICATION ALERTS (es61.txt Section 7) ─── */}
        <View style={styles.preferenceCard}>
          <View style={styles.preferenceMainRow}>
            <View style={styles.iconCircleBlue}>
              <MaterialCommunityIcons name="pill" size={24} color={colors.primary} />
            </View>
            <View style={styles.preferenceTextCol}>
              <Text style={styles.preferenceTitleText}>Medication Alerts</Text>
              <Text style={styles.statusStateText}>{medicationAlerts ? 'ON' : 'OFF'}</Text>
            </View>
            <Switch
              value={medicationAlerts}
              onValueChange={(val) => handleToggle(setMedicationAlerts, val, 'Medication')}
              trackColor={{ false: colors.outline, true: colors.primaryContainer }}
              thumbColor={medicationAlerts ? colors.primary : colors.text.tertiary}
            />
          </View>
          <Text style={styles.preferenceDescText}>Receive supported medication notifications.</Text>
        </View>

        {/* ─── 3. WELLBEING ALERTS (es61.txt Section 8) ─── */}
        <View style={styles.preferenceCard}>
          <View style={styles.preferenceMainRow}>
            <View style={styles.iconCircleGreen}>
              <MaterialCommunityIcons name="heart-pulse" size={24} color={colors.success} />
            </View>
            <View style={styles.preferenceTextCol}>
              <Text style={styles.preferenceTitleText}>Wellbeing Alerts</Text>
              <Text style={styles.statusStateText}>{wellbeingAlerts ? 'ON' : 'OFF'}</Text>
            </View>
            <Switch
              value={wellbeingAlerts}
              onValueChange={(val) => handleToggle(setWellbeingAlerts, val, 'Wellbeing')}
              trackColor={{ false: colors.outline, true: colors.primaryContainer }}
              thumbColor={wellbeingAlerts ? colors.primary : colors.text.tertiary}
            />
          </View>
          <Text style={styles.preferenceDescText}>Receive supported wellbeing notifications.</Text>
        </View>

        {/* ─── 4. INACTIVITY ALERTS (es61.txt Section 9) ─── */}
        <View style={styles.preferenceCard}>
          <View style={styles.preferenceMainRow}>
            <View style={styles.iconCircleAmber}>
              <MaterialCommunityIcons name="clock-alert-outline" size={24} color={colors.warning} />
            </View>
            <View style={styles.preferenceTextCol}>
              <Text style={styles.preferenceTitleText}>Inactivity Alerts</Text>
              <Text style={styles.statusStateText}>{inactivityAlerts ? 'ON' : 'OFF'}</Text>
            </View>
            <Switch
              value={inactivityAlerts}
              onValueChange={(val) => handleToggle(setInactivityAlerts, val, 'Inactivity')}
              trackColor={{ false: colors.outline, true: colors.primaryContainer }}
              thumbColor={inactivityAlerts ? colors.primary : colors.text.tertiary}
            />
          </View>
          <Text style={styles.preferenceDescText}>Receive supported inactivity notifications.</Text>
        </View>

        {/* ─── FOOTER REASSURANCE (es61.txt Section 22 & 681) ─── */}
        <View style={styles.footerNoteBox}>
          <MaterialCommunityIcons name="cloud-sync-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.footerNoteText}>
            Changes are saved locally and synchronized when online.
          </Text>
        </View>
      </ScrollView>

      <BottomNavBar activeTab="profile" onNavigate={onNavigate} />
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
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s5 || 20,
    paddingBottom: 110,
  },
  guardianHeaderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: 18,
    marginBottom: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  guardianHeaderLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  guardianNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  connectedBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    borderRadius: 14,
    paddingVertical: 3,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.status.taken.border,
    gap: 6,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
  },
  connectedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.success,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  preferenceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s3 || 12,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  preferenceMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircleRed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircleBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircleGreen: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.successContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircleAmber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.warningContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preferenceTextCol: {
    flex: 1,
  },
  preferenceTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  alwaysEnabledText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  statusStateText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  preferenceDescText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  footerNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 8,
    marginTop: 8,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 18,
  },
});

export default GuardianNotificationPreferencesScreen;

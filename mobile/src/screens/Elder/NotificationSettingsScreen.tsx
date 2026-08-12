/**
 * NotificationSettingsScreen.tsx — Screen ELDER-S37 (Notification Settings Screen)
 * Spec: es37.txt
 *
 * Requirements (es37.txt):
 *  1. Header: Back arrow (←), Title "Notification Settings".
 *  2. Reminders Category (es37.txt Section 3, 4, 6, 7):
 *     - Medication reminders [ Switch ON/OFF ] (Default: ON) + Subtitle "Get reminded before your medicines are due."
 *     - Daily task reminders [ Switch ON/OFF ] (Default: ON) + Subtitle "Get reminded about planned tasks."
 *     - Mood check-ins [ Switch ON/OFF ] (Default: ON) + Subtitle "Get occasional reminders to check your mood."
 *  3. Sounds Category (es37.txt Section 8 & 9):
 *     - Notification sound [ Switch ON/OFF ] (Default: ON)
 *     - Vibration [ Switch ON/OFF ] (Default: ON)
 *  4. Safety Category (es37.txt Section 10 & 13):
 *     - Emergency alerts ✓ (Read-only status card "Always enabled for safety", cannot be disabled here)
 *  5. Automatic Save (es37.txt Section 20):
 *     - Saves settings locally immediately on toggle without requiring an explicit save button.
 *  6. 100% Offline-First
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

interface NotificationSettingsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsProps> = ({
  onBack,
  onNavigate,
}) => {
  const [medicationReminders, setMedicationReminders] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [moodCheckIns, setMoodCheckIns] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, title: string) => {
    setter((prev) => {
      const next = !prev;
      Toast.show({
        type: 'info',
        text1: 'Preference Updated',
        text2: `${title} set to ${next ? 'ON' : 'OFF'}.`,
        position: 'top',
      });
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es37.txt Section 1) ─── */}
      <ScreenHeader title="Notification Settings" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── SECTION 1: REMINDERS (es37.txt Section 4, 6, 7) ─── */}
        <Text style={styles.sectionHeader}>REMINDERS</Text>

        <View style={styles.card}>
          {/* MEDICATION REMINDERS */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingTitle}>Medication reminders</Text>
              <Text style={styles.settingSubtitle}>Get reminded before your medicines are due.</Text>
            </View>
            <Switch
              value={medicationReminders}
              onValueChange={() => handleToggle(setMedicationReminders, 'Medication reminders')}
              trackColor={{ false: colors.outline, true: colors.successContainer }}
              thumbColor={medicationReminders ? colors.success : colors.text.tertiary}
            />
          </View>

          <View style={styles.divider} />

          {/* DAILY TASK REMINDERS */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingTitle}>Daily task reminders</Text>
              <Text style={styles.settingSubtitle}>Get reminded about planned tasks.</Text>
            </View>
            <Switch
              value={taskReminders}
              onValueChange={() => handleToggle(setTaskReminders, 'Task reminders')}
              trackColor={{ false: colors.outline, true: colors.successContainer }}
              thumbColor={taskReminders ? colors.success : colors.text.tertiary}
            />
          </View>

          <View style={styles.divider} />

          {/* MOOD CHECK-INS */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingTitle}>Mood check-ins</Text>
              <Text style={styles.settingSubtitle}>Get occasional reminders to check your mood.</Text>
            </View>
            <Switch
              value={moodCheckIns}
              onValueChange={() => handleToggle(setMoodCheckIns, 'Mood check-ins')}
              trackColor={{ false: colors.outline, true: colors.successContainer }}
              thumbColor={moodCheckIns ? colors.success : colors.text.tertiary}
            />
          </View>
        </View>

        {/* ─── SECTION 2: SOUNDS (es37.txt Section 8 & 9) ─── */}
        <Text style={styles.sectionHeader}>SOUNDS</Text>

        <View style={styles.card}>
          {/* NOTIFICATION SOUND */}
          <View style={styles.settingRow}>
            <Text style={styles.settingTitle}>Notification sound</Text>
            <Switch
              value={soundEnabled}
              onValueChange={() => handleToggle(setSoundEnabled, 'Notification sound')}
              trackColor={{ false: colors.outline, true: colors.successContainer }}
              thumbColor={soundEnabled ? colors.success : colors.text.tertiary}
            />
          </View>

          <View style={styles.divider} />

          {/* VIBRATION */}
          <View style={styles.settingRow}>
            <Text style={styles.settingTitle}>Vibration</Text>
            <Switch
              value={vibrationEnabled}
              onValueChange={() => handleToggle(setVibrationEnabled, 'Vibration')}
              trackColor={{ false: colors.outline, true: colors.successContainer }}
              thumbColor={vibrationEnabled ? colors.success : colors.text.tertiary}
            />
          </View>

          <View style={styles.divider} />

          {/* QUIET HOURS (es64.txt Section 12) */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => onNavigate('quietHours')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Quiet Hours, 10 PM to 7 AM"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingTitle}>Quiet Hours</Text>
              <Text style={styles.settingSubtitle}>10:00 PM – 7:00 AM</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* ─── SECTION 3: SAFETY (es37.txt Section 10 & 13) ─── */}
        <Text style={styles.sectionHeader}>SAFETY</Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Emergency alerts</Text>
              <Text style={styles.settingSubtitle}>Always enabled for safety.</Text>
            </View>
            <View style={styles.alwaysEnabledBadge}>
              <MaterialCommunityIcons name="check" size={18} color={colors.success} />
              <Text style={styles.alwaysEnabledText}>Active</Text>
            </View>
          </View>
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 12,
  },
  alwaysEnabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.status.taken.border,
    gap: 4,
  },
  alwaysEnabledText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.success,
  },
});

export default NotificationSettingsScreen;

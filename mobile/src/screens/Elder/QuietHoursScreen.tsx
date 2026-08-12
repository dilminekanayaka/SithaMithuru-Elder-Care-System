/**
 * QuietHoursScreen.tsx — Screen ELDER-S65 (Quiet Hours Screen)
 * Spec: es65.txt
 *
 * Requirements (es65.txt):
 *  1. Header: Back arrow (←), Title "Quiet Hours".
 *  2. Main Toggle (es65.txt Section 3):
 *     - Quiet Hours [ Switch ON/OFF ] (Default: ON)
 *     - Subtitle "Reduce non-critical notification sounds during your chosen hours."
 *  3. Time Period Pickers (es65.txt Section 4, 5, 6):
 *     - START: 10:00 PM (Tap to edit time)
 *     - END: 7:00 AM (Tap to edit time)
 *  4. Current Status Banner (es65.txt Section 23 & 24):
 *     - "CURRENT STATUS: Quiet Hours is active. Ends at 7:00 AM" (or "Quiet Hours starts at 10:00 PM.")
 *  5. Reassurance & Policy Note (es65.txt Section 8 & 9):
 *     - "Important safety notifications follow the application's safety notification policy."
 *  6. Primary Action (es65.txt Section 13):
 *     - [ SAVE ] CTA button (≥56dp height)
 *  7. 100% Offline-First (es65.txt Section 16 & 32)
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

interface QuietHoursProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const QuietHoursScreen: React.FC<QuietHoursProps> = ({
  onBack,
  onNavigate,
}) => {
  const [enabled, setEnabled] = useState(true);
  const [startTime, setStartTime] = useState('10:00 PM');
  const [endTime, setEndTime] = useState('7:00 AM');

  const handleSave = () => {
    Toast.show({
      type: 'success',
      text1: 'Quiet Hours Saved',
      text2: enabled ? `Active from ${startTime} to ${endTime}.` : 'Quiet Hours turned off.',
      position: 'top',
    });
    onBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es65.txt Section 1) ─── */}
      <ScreenHeader title="Quiet Hours" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── EXPLANATION & MAIN TOGGLE (es65.txt Section 3 & 8) ─── */}
        <Text style={styles.descriptionText}>
          Reduce non-critical notification sounds during your chosen hours.
        </Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingTitle}>Quiet Hours</Text>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: colors.outline, true: colors.primaryContainer }}
              thumbColor={enabled ? colors.primary : colors.text.tertiary}
            />
          </View>
        </View>

        {/* ─── START & END TIME PICKERS (es65.txt Section 4 & 5) ─── */}
        <Text style={styles.sectionHeaderTitle}>TIME PERIOD</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.timeRow}
            onPress={() => setStartTime(startTime === '10:00 PM' ? '11:00 PM' : '10:00 PM')}
            activeOpacity={0.7}
            disabled={!enabled}
          >
            <View>
              <Text style={styles.timeLabel}>START</Text>
              <Text style={[styles.timeValue, !enabled && { color: colors.text.tertiary }]}>{startTime}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.timeRow}
            onPress={() => setEndTime(endTime === '7:00 AM' ? '6:00 AM' : '7:00 AM')}
            activeOpacity={0.7}
            disabled={!enabled}
          >
            <View>
              <Text style={styles.timeLabel}>END</Text>
              <Text style={[styles.timeValue, !enabled && { color: colors.text.tertiary }]}>{endTime}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* ─── CURRENT STATUS BANNER (es65.txt Section 23 & 24) ─── */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabelText}>CURRENT STATUS</Text>
          <Text style={styles.statusTitleText}>
            {enabled ? 'Quiet Hours is active.' : 'Quiet Hours is disabled.'}
          </Text>
          <Text style={styles.statusSubText}>
            {enabled ? `Ends at ${endTime}.` : 'Turn on to reduce notification sounds.'}
          </Text>
        </View>

        {/* ─── SAFETY POLICY REASSURANCE (es65.txt Section 8) ─── */}
        <View style={styles.reassuranceCard}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.primary} />
          <Text style={styles.reassuranceText}>
            Important safety notifications follow the application's safety notification policy.
          </Text>
        </View>

        {/* ─── SAVE CTA BUTTON (es65.txt Section 13) ─── */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Save Quiet Hours"
        >
          <Text style={styles.saveBtnText}>SAVE</Text>
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
    paddingTop: spacing.s4 || 16,
    paddingBottom: 110,
  },
  descriptionText: {
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
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s3 || 12,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 12,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginTop: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  statusLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statusTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  statusSubText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  reassuranceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xl || 20,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    marginBottom: 24,
  },
  reassuranceText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    lineHeight: 18,
  },
  saveBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e2,
  },
  saveBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
});

export default QuietHoursScreen;

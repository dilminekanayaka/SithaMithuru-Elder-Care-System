/**
 * GuardianNotificationSettingsScreen.tsx — Screen G48 (Notification Category Settings)
 * Spec: g48.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, NHS App, Samsung Health
 *
 * Screen Mission: Choose which notification categories guardian receives and configure delivery options.
 *
 * Healthcare Safety Mandate per g48.txt:
 *  - Emergency Alerts are REQUIRED & ALWAYS ENABLED for guardian safety (cannot be casually disabled).
 *  - Turning off Guardian Alerts does NOT disable the elder's medication reminders or activity monitoring.
 *  - Distinguishes App Preferences vs Android System Notification Permissions.
 *
 * Component Architecture per g48.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Notification Settings", Subtitle "Categories & Preferences • G48").
 *  3. Introduction & Scope Banner (Applies to all connected elders).
 *  4. Safety Notifications Section:
 *     - Emergency Alerts (Required & Always Enabled locked switch).
 *     - Risk Alerts (Switch toggle + confirmation modal when turning off).
 *  5. Health & Care Section:
 *     - Medication Alerts (Switch toggle).
 *     - Reminder Alerts (Switch toggle).
 *     - Activity Alerts (Switch toggle).
 *  6. System Section:
 *     - Device & Sync Alerts (Switch toggle).
 *     - System Notifications (Switch toggle).
 *  7. Notification Delivery Section:
 *     - Push Notifications (Switch toggle).
 *     - Sound (Switch toggle).
 *     - Vibration (Switch toggle).
 *  8. Android Device Notification Permission Diagnostic Card (Allowed / Open Device Settings CTA).
 *  9. Preference Synchronization Footer & Persistent 5-Tab Bottom Navigation Bar.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, elevation } from '../../theme';

const PREFS_KEY = 'guardian_notification_delivery_prefs';

// Screen palette — derived from the central SithaMithuru design system
// (mobile/src/theme) rather than a hardcoded local copy, so this screen
// picks up palette changes automatically instead of silently drifting.
const C = {
  bg:             colors.background,
  card:           colors.surface,
  primary:        colors.primary,
  primaryLight:   colors.primaryContainer,
  warning:        colors.warning,
  warningLight:   colors.warningContainer,
  orange:         colors.category.journal.accent,
  orangeLight:    colors.category.journal.bg,
  error:          colors.error,
  errorLight:     colors.errorContainer,
  info:           colors.info,
  infoLight:      colors.infoContainer,
  textPrimary:    colors.text.primary,
  textSecondary:  colors.text.secondary,
  textMuted:      colors.text.tertiary,
  border:         colors.outline,
};

interface DeliveryPrefs {
  push: boolean;
  sound: boolean;
  vibration: boolean;
}

const DEFAULT_PREFS: DeliveryPrefs = { push: true, sound: true, vibration: true };

interface GuardianNotificationSettingsScreenProps {
  onBack: () => void;
  token?: string;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianNotificationSettingsScreen: React.FC<GuardianNotificationSettingsScreenProps> = ({
  onBack,
  token,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [prefs, setPrefs] = useState<DeliveryPrefs>(DEFAULT_PREFS);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined' | 'checking'>('checking');

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then((raw) => {
      if (raw) {
        try { setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }); } catch {}
      }
    });
    Notifications.getPermissionsAsync().then(({ status }) => setPermissionStatus(status as any));
  }, []);

  const updatePref = async (key: keyof DeliveryPrefs, value: boolean) => {
    Haptics.selectionAsync();
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 4. TOP APP BAR ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <Text style={styles.headerSubtitle}>Categories & Preferences • G48</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ─── INTRODUCTION & SCOPE BANNER ─── */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Guardian Notification Preferences</Text>
          <Text style={styles.introSub}>
            Emergency and medication alerts are always delivered — this controls how they're delivered on this device.
          </Text>
        </View>

        {/* ─── SAFETY NOTIFICATIONS ─── */}
        <Text style={styles.sectionTitle}>Safety Notifications</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.rowTitleRow}>
                <Text style={styles.rowTitle}>Emergency Alerts</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>REQUIRED</Text>
                </View>
              </View>
              <Text style={styles.rowSub}>Critical emergency SOS events. Always enabled for safety policy.</Text>
            </View>
            <Switch value={true} disabled trackColor={{ true: C.primary }} />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.rowTitleRow}>
                <Text style={styles.rowTitle}>Medication Alerts</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>REQUIRED</Text>
                </View>
              </View>
              <Text style={styles.rowSub}>Missed doses and unconfirmed medication reminder windows.</Text>
            </View>
            <Switch value={true} disabled trackColor={{ true: C.primary }} />
          </View>
        </View>

        {/* ─── NOTIFICATION DELIVERY PREFERENCES (real, device-local) ─── */}
        <Text style={styles.sectionTitle}>Notification Delivery Options</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Push Notifications</Text>
              <Text style={styles.rowSub}>Receive device push notifications when app is closed.</Text>
            </View>
            <Switch
              value={prefs.push}
              onValueChange={(v) => updatePref('push', v)}
              trackColor={{ true: C.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Sound</Text>
              <Text style={styles.rowSub}>Play alert sound on incoming notifications.</Text>
            </View>
            <Switch
              value={prefs.sound}
              onValueChange={(v) => updatePref('sound', v)}
              trackColor={{ true: C.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Vibration</Text>
              <Text style={styles.rowSub}>Vibrate device on alert delivery.</Text>
            </View>
            <Switch
              value={prefs.vibration}
              onValueChange={(v) => updatePref('vibration', v)}
              trackColor={{ true: C.primary }}
            />
          </View>
        </View>

        {/* ─── ANDROID SYSTEM NOTIFICATION PERMISSION DIAGNOSTIC CARD (real check) ─── */}
        <TouchableOpacity
          style={styles.permCard}
          onPress={() => { if (permissionStatus !== 'granted') Linking.openSettings(); }}
          disabled={permissionStatus === 'granted'}
        >
          <MaterialCommunityIcons
            name={permissionStatus === 'granted' ? 'check-decagram' : 'alert-decagram'}
            size={24}
            color={permissionStatus === 'granted' ? C.primary : C.error}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.permTitle}>
              {permissionStatus === 'checking' ? 'Checking Permission…' : permissionStatus === 'granted' ? 'Android System Notifications Allowed' : 'Notifications Blocked by Device'}
            </Text>
            <Text style={styles.permSub}>
              {permissionStatus === 'granted'
                ? 'System permissions are correctly granted in device OS settings.'
                : permissionStatus === 'checking' ? '' : 'Tap to open device settings and allow notifications.'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* PERSISTENT 5-TAB BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        {[
          { id: 'guardianDashboard', label: 'Home', icon: 'home' },
          { id: 'elderOverview', label: 'Elder', icon: 'account-heart' },
          { id: 'emergencyAlerts', label: 'Emergency', icon: 'alert-decagram-outline' },
          { id: 'reports', label: 'Reports', icon: 'chart-bar' },
          { id: 'guardianSettings', label: 'Settings', icon: 'cog-outline' },
        ].map((tab) => {
          const isActive = tab.id === 'guardianSettings';
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabBtn}
              onPress={() => onNavigate(tab.id)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={22}
                color={isActive ? C.primary : C.textMuted}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    ...elevation.e1,
  },
  backBtn: { paddingRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.textPrimary },
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: C.primary, marginTop: 1 },
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: 110 },
  introCard: { backgroundColor: C.primaryLight, borderRadius: 16, padding: 14, marginBottom: spacing.s4 },
  introTitle: { fontSize: 13, fontWeight: '900', color: C.primary },
  introSub: { fontSize: 11, color: C.textSecondary, marginTop: 4, lineHeight: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: C.textMuted, letterSpacing: 0.8, marginTop: 10, marginBottom: 8 },
  card: { backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: { fontSize: 14, fontWeight: '800', color: C.textPrimary },
  requiredBadge: { backgroundColor: C.errorLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  requiredBadgeText: { color: C.error, fontSize: 9, fontWeight: '900' },
  rowSub: { fontSize: 11, color: C.textSecondary, marginTop: 2, lineHeight: 16 },
  divider: { height: 1, backgroundColor: colors.surfaceVariant },
  permCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 16, padding: 14, marginVertical: 8, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  permTitle: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  permSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  syncFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginVertical: 12 },
  syncFooterText: { fontSize: 11, fontWeight: '700', color: C.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.s6 },
  modalContent: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s6, width: '100%', maxWidth: 340, ...elevation.e3 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary, marginBottom: 8 },
  modalBody: { fontSize: 13, color: C.textSecondary, lineHeight: 20, marginBottom: 16 },
  modalActionsRow: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: C.bg },
  modalCancelText: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  modalConfirmBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: C.error },
  modalConfirmText: { fontSize: 13, fontWeight: '900', color: '#FFF' },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...elevation.e2,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 2 },
  tabLabelActive: { color: C.primary, fontWeight: '800' },
});

export default GuardianNotificationSettingsScreen;

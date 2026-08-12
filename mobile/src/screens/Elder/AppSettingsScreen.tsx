/**
 * AppSettingsScreen.tsx — Screen ELDER-S39 (App Settings Hub Screen)
 * Spec: es39.txt
 *
 * Requirements (es39.txt):
 *  1. Header: Back arrow (←), Title "App Settings".
 *  2. Personalization Category (es39.txt Section 4 & 5):
 *     - Language > (Displays "Sinhala" / "English", navigates to languageSelection)
 *     - Accessibility > (Subtitle "Large text, sound & more", navigates to accessibilitySettings)
 *  3. Notifications Category (es39.txt Section 6):
 *     - Notification Settings > (Subtitle "Reminders & sounds", navigates to notificationSettings)
 *  4. Safety Category (es39.txt Section 7 & 8):
 *     - Emergency Safety > (Subtitle "Keyword detection • Active ✓", navigates to emergencySettings)
 *  5. About Category (es39.txt Section 9):
 *     - About SithaMithuru > (Subtitle "App info, privacy & terms", navigates to aboutSithaMithuru)
 *  6. Navigation Hub Only: No save button needed, items navigate directly to their respective detail screens.
 *  7. 100% Offline-First
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

interface AppSettingsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  currentLanguage?: string;
  isEmergencyActive?: boolean;
}

const AppSettingsScreen: React.FC<AppSettingsProps> = ({
  onBack,
  onNavigate,
  currentLanguage = 'Sinhala',
  isEmergencyActive = true,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es39.txt Section 1) ─── */}
      <ScreenHeader title="App Settings" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── CATEGORY 1: PERSONALIZATION (es39.txt Section 4 & 5) ─── */}
        <Text style={styles.sectionHeader}>PERSONALIZATION</Text>
        <View style={styles.card}>
          {/* LANGUAGE */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigate('languageSettings')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Language, currently Sinhala"
          >
            <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
              <MaterialCommunityIcons name="earth" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Language</Text>
              <Text style={styles.menuSubtitle}>{currentLanguage}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* ACCESSIBILITY */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigate('accessibilitySettings')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Accessibility settings, Large text, sound and more"
          >
            <View style={[styles.iconBox, { backgroundColor: colors.category.journal.bg }]}>
              <MaterialCommunityIcons name="eye-outline" size={24} color={colors.category.journal.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Accessibility</Text>
              <Text style={styles.menuSubtitle}>Large text, sound & more</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* ─── CATEGORY 2: NOTIFICATIONS (es39.txt Section 6) ─── */}
        <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigate('notificationSettings')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Notification Settings, Reminders and sounds"
          >
            <View style={[styles.iconBox, { backgroundColor: colors.warningContainer }]}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Notification Settings</Text>
              <Text style={styles.menuSubtitle}>Reminders & sounds</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* ─── CATEGORY 3: SAFETY (es39.txt Section 7 & 8) ─── */}
        <Text style={styles.sectionHeader}>SAFETY</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigate('emergencySettings')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Emergency Safety, Keyword detection active"
          >
            <View style={[styles.iconBox, { backgroundColor: colors.errorContainer }]}>
              <MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Emergency Safety</Text>
              <Text style={styles.menuSubtitle}>
                Keyword detection • {isEmergencyActive ? 'Active ✓' : 'Disabled'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* ─── CATEGORY 4: ABOUT (es39.txt Section 9) ─── */}
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigate('aboutApp')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="About SithaMithuru, App info, privacy and terms"
          >
            <View style={[styles.iconBox, { backgroundColor: colors.outline }]}>
              <MaterialCommunityIcons name="information-outline" size={24} color={colors.text.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>About SithaMithuru</Text>
              <Text style={styles.menuSubtitle}>App info, privacy & terms</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 12,
  },
});

export default AppSettingsScreen;

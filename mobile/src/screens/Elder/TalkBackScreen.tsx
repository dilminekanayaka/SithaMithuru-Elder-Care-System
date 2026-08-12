/**
 * TalkBackScreen.tsx — Screen ELDER-S72 (TalkBack & Screen Reader Screen)
 * Spec: es72.txt
 *
 * Requirements (es72.txt):
 *  1. Header: Back arrow (←), Title "TalkBack & Screen Reader".
 *  2. Guidance Text (es72.txt Section 2 & 8):
 *     - "TalkBack helps you use SithaMithuru by reading information on the screen aloud."
 *  3. Android TalkBack Status Card (es72.txt Section 5 & 6):
 *     - Title "Android TalkBack", Subtitle "Managed by Android"
 *     - CTA Button [ OPEN ACCESSIBILITY SETTINGS ] -> Toast / intent simulator
 *  4. How It Works Section (es72.txt Section 2):
 *     - "SithaMithuru provides labels and descriptions that help TalkBack explain buttons, settings and important safety information."
 *  5. Reassurance Footer (es72.txt Section 2):
 *     - "TalkBack is an Android feature and may use your device's accessibility settings."
 *  6. 100% Offline-First (es72.txt Section 7 & 646)
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
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface TalkBackProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const TalkBackScreen: React.FC<TalkBackProps> = ({
  onBack,
  onNavigate,
}) => {
  const handleOpenAndroidSettings = () => {
    Toast.show({
      type: 'info',
      text1: 'Android Accessibility',
      text2: 'Opening Android Accessibility Settings...',
      position: 'top',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es72.txt Section 1) ─── */}
      <ScreenHeader title="TalkBack & Screen Reader" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es72.txt Section 2 & 8) ─── */}
        <Text style={styles.guidanceText}>
          TalkBack helps you use SithaMithuru by reading information on the screen aloud.
        </Text>

        {/* ─── ANDROID TALKBACK STATUS CARD (es72.txt Section 5 & 6) ─── */}
        <Text style={styles.sectionHeaderTitle}>TALKBACK</Text>

        <View style={styles.card}>
          <Text style={styles.settingTitle}>Android TalkBack</Text>
          <Text style={styles.settingSubtitle}>Managed by Android</Text>

          <TouchableOpacity
            style={styles.openSettingsBtn}
            onPress={handleOpenAndroidSettings}
            activeOpacity={0.85}
            accessible={true}
            accessibilityLabel="Open Android Accessibility Settings"
          >
            <Text style={styles.openSettingsBtnText}>OPEN ACCESSIBILITY SETTINGS</Text>
          </TouchableOpacity>
        </View>

        {/* ─── HOW IT WORKS SECTION (es72.txt Section 2) ─── */}
        <Text style={styles.sectionHeaderTitle}>HOW IT WORKS</Text>

        <View style={styles.card}>
          <Text style={styles.howItWorksText}>
            SithaMithuru provides labels and descriptions that help TalkBack explain buttons, settings and important safety information.
          </Text>
        </View>

        {/* ─── REASSURANCE FOOTER (es72.txt Section 2) ─── */}
        <Text style={styles.footerNoteText}>
          TalkBack is an Android feature and may use your device's accessibility settings.
        </Text>
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
    fontSize: 18,
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
    marginTop: 8,
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
  settingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 16,
  },
  openSettingsBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.xl || 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e1,
  },
  openSettingsBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  howItWorksText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 22,
  },
  footerNoteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 8,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default TalkBackScreen;

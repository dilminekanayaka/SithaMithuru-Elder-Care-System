/**
 * LanguageSettingsScreen.tsx — Screen ELDER-S66 (Language Settings Screen)
 * Spec: es66.txt
 *
 * Requirements (es66.txt):
 *  1. Header: Back arrow (←), Title "Language".
 *  2. Trilingual Guidance (es66.txt Section 2):
 *     - "Choose your preferred language / භාෂාව තෝරන්න / மொழியைத் தேர்ந்தெடுக்கவும்"
 *  3. Language Radio Options (es66.txt Section 3, 4, 5, 21):
 *     - ● සිංහල (Sinhala)
 *     - ○ தமிழ் (Tamil)
 *     - ○ English
 *  4. Immediate Radio Selection & Persistence (es66.txt Section 6 & 8):
 *     - Selecting an option updates language state immediately without extra save buttons.
 *  5. Reassurance Note (es66.txt Section 2):
 *     - "Language changes apply to the SithaMithuru interface."
 *  6. 100% Offline-First (es66.txt Section 9 & 36)
 */

import React, { useState } from 'react';
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

interface LanguageSettingsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export type SupportedLanguage = 'si' | 'ta' | 'en';

const LanguageSettingsScreen: React.FC<LanguageSettingsProps> = ({
  onBack,
  onNavigate,
}) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('si');

  const handleSelectLanguage = (lang: SupportedLanguage, name: string) => {
    setSelectedLang(lang);
    Toast.show({
      type: 'success',
      text1: 'Language Updated',
      text2: `App language set to ${name}.`,
      position: 'top',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es66.txt Section 1) ─── */}
      <ScreenHeader title="Language" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── TRILINGUAL GUIDANCE HEADER (es66.txt Section 2) ─── */}
        <View style={styles.guidanceBox}>
          <Text style={styles.guidanceTitleEn}>Choose your preferred language</Text>
          <Text style={styles.guidanceTitleSi}>භාෂාව තෝරන්න</Text>
          <Text style={styles.guidanceTitleTa}>மொழியைத் தேர்ந்தெடுக்கவும்</Text>
        </View>

        <Text style={styles.sectionHeaderTitle}>LANGUAGE</Text>

        {/* ─── 1. SINHALA OPTION (es66.txt Section 21) ─── */}
        <TouchableOpacity
          style={[styles.langCard, selectedLang === 'si' && styles.langCardSelected]}
          onPress={() => handleSelectLanguage('si', 'සිංහල (Sinhala)')}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Sinhala, selected"
        >
          <View style={styles.radioOuter}>
            {selectedLang === 'si' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.langTextCol}>
            <Text style={styles.langMainText}>සිංහල</Text>
            <Text style={styles.langSubText}>Sinhala</Text>
          </View>
          {selectedLang === 'si' && (
            <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>

        {/* ─── 2. TAMIL OPTION (es66.txt Section 21) ─── */}
        <TouchableOpacity
          style={[styles.langCard, selectedLang === 'ta' && styles.langCardSelected]}
          onPress={() => handleSelectLanguage('ta', 'தமிழ் (Tamil)')}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Tamil"
        >
          <View style={styles.radioOuter}>
            {selectedLang === 'ta' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.langTextCol}>
            <Text style={styles.langMainText}>தமிழ்</Text>
            <Text style={styles.langSubText}>Tamil</Text>
          </View>
          {selectedLang === 'ta' && (
            <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>

        {/* ─── 3. ENGLISH OPTION (es66.txt Section 21) ─── */}
        <TouchableOpacity
          style={[styles.langCard, selectedLang === 'en' && styles.langCardSelected]}
          onPress={() => handleSelectLanguage('en', 'English')}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="English"
        >
          <View style={styles.radioOuter}>
            {selectedLang === 'en' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.langTextCol}>
            <Text style={styles.langMainText}>English</Text>
          </View>
          {selectedLang === 'en' && (
            <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>

        {/* ─── REASSURANCE NOTE (es66.txt Section 2) ─── */}
        <Text style={styles.footerNoteText}>
          Language changes apply to the SithaMithuru interface.
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
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s5 || 20,
    paddingBottom: 110,
  },
  guidanceBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  guidanceTitleEn: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  guidanceTitleSi: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
  },
  guidanceTitleTa: {
    fontSize: 15,
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
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    minHeight: 72,
    marginBottom: spacing.s3 || 12,
    borderWidth: 2,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  langCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  langTextCol: {
    flex: 1,
  },
  langMainText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  langSubText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 2,
  },
  footerNoteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default LanguageSettingsScreen;

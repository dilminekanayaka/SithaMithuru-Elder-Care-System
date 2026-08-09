import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n/i18n';
import { colors, typography, spacing, radius, elevation } from '../theme';

interface LanguageSelectionProps {
  onContinue: () => void;
}

const LANGUAGES = [
  {
    code: 'si',
    label: 'Sinhala',
    native: 'සිංහල',
    subText: 'සිංහල භාෂාවෙන් යෙදුම භාවිතා කරන්න',
    flag: '🇱🇰',
  },
  {
    code: 'en',
    label: 'English',
    native: 'English',
    subText: 'Use the application in English',
    flag: '🇬🇧',
  },
  {
    code: 'ta',
    label: 'Tamil',
    native: 'தமிழ்',
    subText: 'பயன்பாட்டை தமிழில் பயன்படுத்தவும்',
    flag: '🇱🇰',
  },
];

const LanguageSelectionScreen: React.FC<LanguageSelectionProps> = ({ onContinue }) => {
  const { i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<'si' | 'en' | 'ta'>(
    (i18n.language as 'si' | 'en' | 'ta') || 'si'
  );

  const handleSelect = async (code: 'si' | 'en' | 'ta') => {
    setSelectedLang(code);
    await changeLanguage(code);
  };

  const getContinueText = () => {
    switch (selectedLang) {
      case 'si':
        return 'ඉදිරියට යන්න';
      case 'ta':
        return 'தொடரவும்';
      default:
        return 'Continue';
    }
  };

  const getHeaderTitle = () => {
    switch (selectedLang) {
      case 'si':
        return 'භාෂාව තෝරන්න';
      case 'ta':
        return 'மொழியைத் தேர்ந்தெடுக்கவும்';
      default:
        return 'Select Your Language';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="translate" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>{getHeaderTitle()}</Text>
          <Text style={styles.subtitle}>
            ඔබට පහසු භාෂාවක් තෝරාගන්න • Choose your preferred language
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.card,
                  isSelected ? styles.cardSelected : styles.cardUnselected,
                ]}
                onPress={() => handleSelect(lang.code as any)}
                activeOpacity={0.85}
              >
                <View style={styles.flagBox}>
                  <Text style={styles.flag}>{lang.flag}</Text>
                </View>

                <View style={styles.cardTextContent}>
                  <Text style={[styles.langTitle, isSelected && styles.langTitleSelected]}>
                    {lang.native} ({lang.label})
                  </Text>
                  <Text style={[styles.langSub, isSelected && styles.langSubSelected]}>
                    {lang.subText}
                  </Text>
                </View>

                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check-bold"
                      size={18}
                      color={colors.onPrimary}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={onContinue} activeOpacity={0.9}>
          <Text style={styles.buttonText}>{getContinueText()}</Text>
          <MaterialCommunityIcons name="arrow-right" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s8,
    paddingBottom: spacing.s12,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.s8,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xxxl,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s4,
  },
  title: {
    ...typography.headlineLarge,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.s2,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  cardsContainer: {
    gap: spacing.s4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.s5,
    borderRadius: radius.xxl,
    borderWidth: 2,
    ...elevation.e2,
  },
  cardUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.outlineVariant,
  },
  cardSelected: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  flagBox: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s4,
  },
  flag: {
    fontSize: 26,
  },
  cardTextContent: {
    flex: 1,
  },
  langTitle: {
    ...typography.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing.s1,
  },
  langTitleSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  langSub: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  langSubSelected: {
    color: colors.text.secondary,
  },
  radio: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.s3,
  },
  radioSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: {
    padding: spacing.s5,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.outlineVariant,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 60,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.s2,
    ...elevation.e3,
  },
  buttonText: {
    ...typography.headlineSmall,
    color: colors.onPrimary,
  },
});

export default LanguageSelectionScreen;

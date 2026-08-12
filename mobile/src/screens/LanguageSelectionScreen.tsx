/**
 * LanguageSelectionScreen.tsx — Screen ELDER-S03 (Language Selection Screen)
 * Spec: es3.txt
 *
 * Requirements (es3.txt):
 *  • Step 2 of 3 in Onboarding sequence (Splash -> Welcome -> Language Selection -> Onboarding)
 *  • Native language script names (සිංහල / தமிழ் / English)
 *  • No flags (per Section 26: language != country)
 *  • NO default language pre-selected (selectedLang starts as null)
 *  • CONTINUE button is DISABLED until user explicitly taps a language card
 *  • Large cards (68dp height, touch target >= 56dp, colorblind-friendly selection border)
 *  • Top header back arrow + Android hardware back navigation to Welcome screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  BackHandler,
  AccessibilityInfo,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { changeLanguage } from '../i18n/i18n';
import { colors, spacing, radius, elevation } from '../theme';

const { width } = Dimensions.get('window');

type LanguageCode = 'si' | 'ta' | 'en';

interface LanguageSelectionProps {
  onContinue: () => void;
  onBack?: () => void;
}

interface LanguageOption {
  code: LanguageCode;
  nativeTitle: string;
  subTitle?: string;
  accessibilityText: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'si',
    nativeTitle: 'සිංහල',
    subTitle: 'Sinhala',
    accessibilityText: 'සිංහල, Sinhala language option',
  },
  {
    code: 'ta',
    nativeTitle: 'தமிழ்',
    subTitle: 'Tamil',
    accessibilityText: 'தமிழ், Tamil language option',
  },
  {
    code: 'en',
    nativeTitle: 'English',
    accessibilityText: 'English language option',
  },
];

const LanguageSelectionScreen: React.FC<LanguageSelectionProps> = ({
  onContinue,
  onBack,
}) => {
  // CRITICAL RULE (es3.txt Section 7): selectedLang starts as null (no pre-selected language)
  const [selectedLang, setSelectedLang] = useState<LanguageCode | null>(null);

  // Announce screen load for accessibility
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      'Language Selection. Step 2 of 3. Please select your preferred language.'
    );
  }, []);

  // Hardware Back Button Handler (es3.txt Section 28)
  useEffect(() => {
    const handleBackPress = () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => sub.remove();
  }, [onBack]);

  const handleCardPress = useCallback((code: LanguageCode, nativeTitle: string) => {
    setSelectedLang(code);
    AccessibilityInfo.announceForAccessibility(`${nativeTitle}, selected`);
  }, []);

  const handleContinuePress = useCallback(async () => {
    if (!selectedLang) return;

    // Apply & store language locally (es3.txt Section 10 & 13)
    await changeLanguage(selectedLang);
    onContinue();
  }, [selectedLang, onContinue]);

  const getContinueButtonText = () => {
    switch (selectedLang) {
      case 'si':
        return 'ඉදිරියට යන්න';
      case 'ta':
        return 'தொடரவும்';
      case 'en':
        return 'CONTINUE';
      default:
        return 'CONTINUE';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* TOP NAVIGATION HEADER WITH BACK BUTTON */}
      <View style={styles.topHeader}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back to Welcome screen"
          >
            <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <Text style={styles.stepHeaderLabel}>Step 2 of 3</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TITLE & DESCRIPTION */}
        <View style={styles.titleBox}>
          <Text style={styles.mainTitle}>Choose your language</Text>
          <Text style={styles.subTitle}>
            Select the language you are most comfortable using.
          </Text>
          <Text style={styles.sinhalaHint}>ඔබ කැමති භාෂාව තෝරන්න</Text>
        </View>

        {/* LANGUAGE CARDS CONTAINER */}
        <View style={styles.cardsContainer}>
          {LANGUAGE_OPTIONS.map((item) => {
            const isSelected = selectedLang === item.code;

            return (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.card,
                  isSelected ? styles.cardSelected : styles.cardUnselected,
                ]}
                onPress={() => handleCardPress(item.code, item.nativeTitle)}
                activeOpacity={0.85}
                accessible={true}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={item.accessibilityText}
              >
                {/* Radio Indicator Icon */}
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected ? (
                    <MaterialCommunityIcons name="check-bold" size={16} color={colors.onPrimary} />
                  ) : null}
                </View>

                {/* Native Language Text Content */}
                <View style={styles.cardTextContent}>
                  <Text style={[styles.nativeTitle, isSelected && styles.nativeTitleSelected]}>
                    {item.nativeTitle}
                  </Text>
                  {item.subTitle ? (
                    <Text style={[styles.englishSubTitle, isSelected && styles.englishSubTitleSelected]}>
                      {item.subTitle}
                    </Text>
                  ) : null}
                </View>

                {/* Selection Check Badge */}
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary || colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* BOTTOM FOOTER: CONTINUE BUTTON (DISABLED UNTIL SELECTION MADE) */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedLang ? styles.continueButtonDisabled : styles.continueButtonEnabled,
          ]}
          onPress={handleContinuePress}
          disabled={!selectedLang}
          activeOpacity={0.85}
          accessible={true}
          accessibilityRole="button"
          accessibilityState={{ disabled: !selectedLang }}
          accessibilityLabel={getContinueButtonText()}
        >
          <Text
            style={[
              styles.buttonText,
              !selectedLang ? styles.buttonTextDisabled : styles.buttonTextEnabled,
            ]}
          >
            {getContinueButtonText()}
          </Text>
          {selectedLang ? (
            <MaterialCommunityIcons name="arrow-right" size={22} color={colors.onPrimary} style={{ marginLeft: 8 }} />
          ) : null}
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
  topHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4 || 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  stepHeaderLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s4 || 16,
    paddingBottom: spacing.s8 || 32,
    alignItems: 'center',
  },
  titleBox: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    marginBottom: spacing.s6 || 24,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 22,
  },
  sinhalaHint: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
  },
  cardsContainer: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.s4 || 16,
  },
  card: {
    minHeight: 68, // es3.txt Section 5: 64-72dp card height
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s5 || 20,
    paddingVertical: spacing.s3 || 12,
    borderRadius: radius.xl || 20,
    borderWidth: 2,
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    elevation: 2,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
  },
  cardSelected: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary || colors.primary,
    shadowOpacity: 0.1,
  },
  radioCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.text.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s4 || 16,
  },
  radioCircleSelected: {
    backgroundColor: colors.primary || colors.primary,
    borderColor: colors.primary || colors.primary,
  },
  cardTextContent: {
    flex: 1,
    justifyContent: 'center',
  },
  nativeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  nativeTitleSelected: {
    color: colors.primaryDark || colors.primaryDark,
    fontWeight: '800',
  },
  englishSubTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.secondary,
    marginTop: 2,
  },
  englishSubTitleSelected: {
    color: colors.primary || colors.primary,
    fontWeight: '600',
  },
  checkBadge: {
    marginLeft: 12,
  },
  footer: {
    paddingHorizontal: spacing.s5 || 20,
    paddingVertical: spacing.s4 || 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    maxWidth: 420,
    height: 56, // es3.txt Section 5 & 23: 56dp height
    borderRadius: radius.lg || 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: colors.outline, // Grayed out disabled button (es3.txt Section 8)
    elevation: 0,
    shadowOpacity: 0,
  },
  continueButtonEnabled: {
    backgroundColor: colors.primary || colors.primary,
    elevation: 4,
    shadowColor: colors.primary || colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  buttonTextDisabled: {
    color: colors.text.tertiary,
  },
  buttonTextEnabled: {
    color: colors.onPrimary,
  },
});

export default LanguageSelectionScreen;

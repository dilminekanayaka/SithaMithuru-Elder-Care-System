import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n/i18n';

interface LanguageSelectorProps {
  onLanguageChanged?: () => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'si', label: 'Sinhala', native: 'සිංහල', flag: '🇱🇰' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇱🇰' },
];

const LanguageSelectorCard: React.FC<LanguageSelectorProps> = ({ onLanguageChanged }) => {
  const { i18n, t } = useTranslation();

  const handleSelect = async (code: 'en' | 'si' | 'ta') => {
    await changeLanguage(code);
    if (onLanguageChanged) onLanguageChanged();
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="translate" size={24} color="#6C63FF" />
        <Text style={styles.title}>{t('language_preference')}</Text>
      </View>
      <View style={styles.optionsContainer}>
        {LANGUAGES.map((lang) => {
          const isSelected = i18n.language === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langChip, isSelected && styles.langChipSelected]}
              onPress={() => handleSelect(lang.code as any)}
              accessibilityLabel={`Select ${lang.label}`}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={[styles.langText, isSelected && styles.langTextSelected]}>
                {lang.native}
              </Text>
              {isSelected && (
                <MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C3E50',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  langChipSelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  flag: {
    fontSize: 16,
  },
  langText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3E50',
  },
  langTextSelected: {
    color: '#FFFFFF',
  },
});

export default LanguageSelectorCard;

/**
 * TextSizeScreen.tsx — Screen ELDER-S68 (Text Size Screen)
 * Spec: es68.txt
 *
 * Requirements (es68.txt):
 *  1. Header: Back arrow (←), Title "Text Size".
 *  2. Guidance Text (es68.txt Section 2):
 *     - "Choose a text size that is comfortable for you to read."
 *  3. Live Preview Card (es68.txt Section 2, 5, 9):
 *     - Dynamic preview displaying "Medication Reminder: Take your morning medicine at 8:00 AM. [ VIEW MEDICATION ]"
 *     - Updates immediately when text size option changes.
 *  4. Radio Options (es68.txt Section 3 & 7):
 *     - ● Standard (Base typography)
 *     - ● Large (Elder-friendly default)
 *     - ● Extra Large (Maximum supported size)
 *  5. Immediate Persistence (es68.txt Section 6 & 27):
 *     - Selecting an option updates preview and saves state immediately without requiring an explicit save button.
 *  6. 100% Offline-First (es68.txt Section 26)
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

export type TextSizeLevel = 'STANDARD' | 'LARGE' | 'EXTRA_LARGE';

interface TextSizeProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const TextSizeScreen: React.FC<TextSizeProps> = ({
  onBack,
  onNavigate,
}) => {
  const [selectedSize, setSelectedSize] = useState<TextSizeLevel>('LARGE');

  const handleSelectSize = (level: TextSizeLevel, name: string) => {
    setSelectedSize(level);
    Toast.show({
      type: 'info',
      text1: 'Text Size Updated',
      text2: `Font scale set to ${name}.`,
      position: 'top',
    });
  };

  const getPreviewTitleSize = () => {
    switch (selectedSize) {
      case 'STANDARD':
        return 18;
      case 'LARGE':
        return 22;
      case 'EXTRA_LARGE':
        return 26;
    }
  };

  const getPreviewBodySize = () => {
    switch (selectedSize) {
      case 'STANDARD':
        return 15;
      case 'LARGE':
        return 18;
      case 'EXTRA_LARGE':
        return 21;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es68.txt Section 1) ─── */}
      <ScreenHeader title="Text Size" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es68.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          Choose a text size that is comfortable for you to read.
        </Text>

        {/* ─── LIVE PREVIEW CARD (es68.txt Section 2 & 5) ─── */}
        <Text style={styles.sectionHeaderTitle}>PREVIEW</Text>
        <View style={styles.previewCard}>
          <Text style={[styles.previewTitleText, { fontSize: getPreviewTitleSize() }]}>
            Medication Reminder
          </Text>
          <Text style={[styles.previewBodyText, { fontSize: getPreviewBodySize() }]}>
            Take your morning medicine at 8:00 AM.
          </Text>

          <View style={styles.previewButtonMock}>
            <Text style={[styles.previewButtonMockText, { fontSize: getPreviewBodySize() - 2 }]}>
              VIEW MEDICATION
            </Text>
          </View>
        </View>

        {/* ─── TEXT SIZE OPTIONS (es68.txt Section 3 & 7) ─── */}
        <Text style={styles.sectionHeaderTitle}>TEXT SIZE</Text>

        {/* 1. STANDARD */}
        <TouchableOpacity
          style={[styles.optionCard, selectedSize === 'STANDARD' && styles.optionCardSelected]}
          onPress={() => handleSelectSize('STANDARD', 'Standard')}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Standard text size"
        >
          <View style={styles.radioOuter}>
            {selectedSize === 'STANDARD' && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.optionTitleText}>Standard</Text>
          {selectedSize === 'STANDARD' && (
            <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>

        {/* 2. LARGE (ELDER DEFAULT) */}
        <TouchableOpacity
          style={[styles.optionCard, selectedSize === 'LARGE' && styles.optionCardSelected]}
          onPress={() => handleSelectSize('LARGE', 'Large')}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Large text size, selected"
        >
          <View style={styles.radioOuter}>
            {selectedSize === 'LARGE' && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.optionTitleText}>Large</Text>
          {selectedSize === 'LARGE' && (
            <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>

        {/* 3. EXTRA LARGE */}
        <TouchableOpacity
          style={[styles.optionCard, selectedSize === 'EXTRA_LARGE' && styles.optionCardSelected]}
          onPress={() => handleSelectSize('EXTRA_LARGE', 'Extra Large')}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Extra Large text size"
        >
          <View style={styles.radioOuter}>
            {selectedSize === 'EXTRA_LARGE' && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.optionTitleText}>Extra Large</Text>
          {selectedSize === 'EXTRA_LARGE' && (
            <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>

        <Text style={styles.footerNoteText}>Changes apply across SithaMithuru.</Text>
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
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  previewTitleText: {
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
  },
  previewBodyText: {
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  previewButtonMock: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewButtonMockText: {
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    minHeight: 64,
    marginBottom: spacing.s3 || 12,
    borderWidth: 2,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionTitleText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  footerNoteText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default TextSizeScreen;

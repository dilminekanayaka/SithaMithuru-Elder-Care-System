/**
 * FaqScreen.tsx — Screen ELDER-S84 (Frequently Asked Questions Screen)
 * Spec: es84.txt
 *
 * Requirements (es84.txt):
 *  1. Header: Back arrow (←), Title "Frequently Asked Questions".
 *  2. Guidance Text (es84.txt Section 2):
 *     - "Find quick answers to common questions about SithaMithuru."
 *  3. Expandable FAQ Accordion Categories (es84.txt Section 3-10):
 *     - MEDICATION FAQ:
 *       • How do medication reminders work?
 *       • Can reminders work offline?
 *       • What happens if I miss a medication reminder?
 *     - EMERGENCY FAQ:
 *       • What happens when an emergency word is detected?
 *       • Can emergency detection work without internet?
 *       • What happens if the detection is incorrect?
 *     - GUARDIAN FAQ:
 *       • What information can my Guardian receive?
 *       • Does my Guardian see everything on my device?
 *  4. Single open item behavior (es84.txt Section 4).
 *  5. 100% Offline-First (es84.txt Section 19 & 32)
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
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface FaqProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

interface FaqItemData {
  id: string;
  category: 'MEDICATION' | 'EMERGENCY' | 'GUARDIAN';
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItemData[] = [
  {
    id: 'med_1',
    category: 'MEDICATION',
    question: 'How do medication reminders work?',
    answer: 'SithaMithuru uses your medication schedule to provide reminders at the scheduled times locally on your device.',
  },
  {
    id: 'med_2',
    category: 'MEDICATION',
    question: 'Can reminders work offline?',
    answer: 'Yes. Medication reminder information is stored on the device so reminders can continue working when you are offline.',
  },
  {
    id: 'med_3',
    category: 'MEDICATION',
    question: 'What happens if I miss a medication reminder?',
    answer: 'The application can record the missed reminder and use it as part of safety monitoring.',
  },
  {
    id: 'emg_1',
    category: 'EMERGENCY',
    question: 'What happens when an emergency word is detected?',
    answer: 'The application starts the emergency support process. An alert and confirmation step may appear before the emergency is confirmed.',
  },
  {
    id: 'emg_2',
    category: 'EMERGENCY',
    question: 'Can emergency detection work without internet?',
    answer: 'Emergency keyword detection is designed to work on the device even when you are offline.',
  },
  {
    id: 'emg_3',
    category: 'EMERGENCY',
    question: 'What happens if the detection is incorrect?',
    answer: 'A confirmation or cancellation step gives you an opportunity to stop an incorrect emergency alert during the countdown.',
  },
  {
    id: 'grd_1',
    category: 'GUARDIAN',
    question: 'What information can my Guardian receive?',
    answer: 'Your Guardian can receive relevant medication, safety, and emergency alerts according to the application\'s Guardian support features.',
  },
  {
    id: 'grd_2',
    category: 'GUARDIAN',
    question: 'Does my Guardian see everything on my device?',
    answer: 'No. Guardian support does not mean that your Guardian has access to all information on your device.',
  },
];

const FaqScreen: React.FC<FaqProps> = ({
  onBack,
  onNavigate,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderFaqCategory = (categoryName: 'MEDICATION' | 'EMERGENCY' | 'GUARDIAN') => {
    const items = FAQ_ITEMS.filter((item) => item.category === categoryName);
    return (
      <View style={{ marginBottom: 16 }} key={categoryName}>
        <Text style={styles.sectionHeaderTitle}>{categoryName}</Text>
        <View style={styles.card}>
          {items.map((item, index) => {
            const isExpanded = expandedId === item.id;
            return (
              <View key={item.id}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.faqRow}
                  onPress={() => toggleExpand(item.id)}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityLabel={`${item.question}. ${isExpanded ? 'Expanded' : 'Collapsed'}`}
                >
                  <Text style={styles.faqQuestionText}>{item.question}</Text>
                  <MaterialCommunityIcons
                    name={isExpanded ? 'minus' : 'plus'}
                    size={22}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.answerBox}>
                    <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es84.txt Section 1) ─── */}
      <ScreenHeader title="Frequently Asked Questions" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es84.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          Find quick answers to common questions about SithaMithuru.
        </Text>

        {renderFaqCategory('MEDICATION')}
        {renderFaqCategory('EMERGENCY')}
        {renderFaqCategory('GUARDIAN')}
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
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginRight: 10,
    lineHeight: 22,
  },
  answerBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  faqAnswerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 12,
  },
});

export default FaqScreen;

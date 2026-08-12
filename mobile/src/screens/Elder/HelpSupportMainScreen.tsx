/**
 * HelpSupportMainScreen.tsx — Screen ELDER-S79 (Help & Support Main Screen)
 * Spec: es79.txt
 *
 * Requirements (es79.txt):
 *  1. Header: Back arrow (←), Title "Help & Support".
 *  2. Guidance Text (es79.txt Section 2):
 *     - "Find answers and get help using SithaMithuru."
 *  3. QUICK HELP Section (es79.txt Section 4-7):
 *     - "How to use SithaMithuru" ➔ navigates to howToUse (Screen ELDER-S80)
 *     - "Medication Reminders" ➔ Toast / detail
 *     - "Emergency Help" ➔ Toast / detail
 *     - "Guardian Help" ➔ Toast / detail
 *  4. COMMON QUESTIONS Section (es79.txt Section 8 & 25):
 *     - "Frequently Asked Questions" ➔ Expandable FAQ list
 *  5. CONTACT SUPPORT Section (es79.txt Section 9):
 *     - "Contact Support" ➔ Contact support dialog / options
 *  6. 100% Offline-First (es79.txt Section 12 & 32)
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

interface HelpSupportMainProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'faq_1',
    question: 'How do medication reminders work?',
    answer: 'SithaMithuru alerts you at your scheduled medication times locally on your device.',
  },
  {
    id: 'faq_2',
    question: 'What happens during an emergency?',
    answer: 'When an emergency keyword is detected, an alert countdown begins and your Guardian is notified.',
  },
  {
    id: 'faq_3',
    question: 'How does my Guardian receive alerts?',
    answer: 'Your connected Guardian receives safety and emergency alerts when your device sends updates.',
  },
];

const HelpSupportMainScreen: React.FC<HelpSupportMainProps> = ({
  onBack,
  onNavigate,
}) => {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es79.txt Section 1) ─── */}
      <ScreenHeader title="Help & Support" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es79.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          Find answers and get help using SithaMithuru.
        </Text>

        {/* ─── QUICK HELP SECTION (es79.txt Section 4-7) ─── */}
        <Text style={styles.sectionHeaderTitle}>QUICK HELP</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => onNavigate('howToUse')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="How to use SithaMithuru"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.navTitle}>How to use SithaMithuru</Text>
              <Text style={styles.navSubtitle}>Learn about the main features.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() =>
              Toast.show({
                type: 'info',
                text1: 'Medication Help',
                text2: 'Medication reminders alert you at scheduled times.',
                position: 'top',
              })
            }
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Medication Reminders help"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.navTitle}>Medication Reminders</Text>
              <Text style={styles.navSubtitle}>Learn how medication reminders work.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => onNavigate('emergencySafetyGuide')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Emergency Help"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.navTitle}>Emergency Help</Text>
              <Text style={styles.navSubtitle}>Learn what happens when an emergency is detected.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() =>
              Toast.show({
                type: 'info',
                text1: 'Guardian Help',
                text2: 'Guardians receive safety notifications from your account.',
                position: 'top',
              })
            }
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Guardian Help"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.navTitle}>Guardian Help</Text>
              <Text style={styles.navSubtitle}>Learn about Guardian support.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* ─── COMMON QUESTIONS SECTION (es79.txt Section 8 & 25) ─── */}
        <Text style={styles.sectionHeaderTitle}>COMMON QUESTIONS</Text>

        <View style={styles.card}>
          <Text style={[styles.navTitle, { marginBottom: 12 }]}>Frequently Asked Questions</Text>
          {FAQS.map((faq, index) => (
            <View key={faq.id}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.faqRow}
                onPress={() => toggleFaq(faq.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <MaterialCommunityIcons
                  name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
              {expandedFaq === faq.id && (
                <Text style={styles.faqAnswerText}>{faq.answer}</Text>
              )}
            </View>
          ))}
        </View>

        {/* ─── CONTACT SUPPORT SECTION (es79.txt Section 9) ─── */}
        <Text style={styles.sectionHeaderTitle}>CONTACT SUPPORT</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() =>
              Toast.show({
                type: 'info',
                text1: 'Contact Support',
                text2: 'SithaMithuru Support: support@sithamithuru.org',
                position: 'top',
              })
            }
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Contact Support"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.navTitle}>Contact Support</Text>
              <Text style={styles.navSubtitle}>Reach out to our support team.</Text>
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
    marginTop: 4,
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  navSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 12,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    marginRight: 10,
  },
  faqAnswerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 4,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 14,
  },
});

export default HelpSupportMainScreen;

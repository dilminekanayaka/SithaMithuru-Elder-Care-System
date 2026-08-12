/**
 * HelpSupportScreen.tsx — Screen ELDER-S46 (Help & Support Screen)
 * Spec: es46.txt
 *
 * Requirements (es46.txt):
 *  1. Header: Back arrow (←), Title "Help & Support".
 *  2. Search Box (es46.txt Section 21 & 22):
 *     - "Search help topics..." (Filters help articles dynamically)
 *  3. Quick Help Categories (es46.txt Section 3 & 27):
 *     - 🛡 Emergency Detection -> Learn how emergency safety works
 *     - 💊 Medication Reminders -> Manage your medicines
 *     - 📅 Daily Tasks -> Manage your reminders
 *     - ❤️ Mood & Wellbeing -> Track your mood and wellbeing
 *     - 📖 Memories & Journaling -> Save meaningful moments
 *     - 👤 Guardian Support -> Connect and manage your Guardian
 *     - 🔔 Notifications -> Fix sound & reminder issues
 *     - 👁 Accessibility -> Adjust text size & contrast
 *  4. Common Questions (FAQ) List (es46.txt Section 14, 15, 18, 19):
 *     - "Why didn't I receive a reminder?"
 *     - "How does emergency detection work?"
 *     - "How do I connect my Guardian?"
 *  5. Help Article Modal (ELDER-S46A - Section 23):
 *     - Displays detailed help guide with contextual CTA button (e.g. [ OPEN MEDICATION ]).
 *  6. 100% Offline-First (Section 29)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface HelpArticle {
  id: string;
  category: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  summary: string;
  content: string;
  targetScreen?: string;
  actionLabel?: string;
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'emergency_help',
    category: 'QUICK HELP',
    icon: 'shield-alert-outline',
    iconBg: colors.errorContainer,
    iconColor: colors.error,
    title: 'Emergency Detection',
    summary: 'Learn how emergency safety works.',
    content: `The app listens for your configured emergency keywords (e.g., "Help", "Save me") on your device.

When detected, an emergency confirmation screen opens. If unconfirmed within the countdown, an emergency alert is logged and sent to your connected Guardian.

Note: Emergency detection operates 100% offline on your device, but remote Guardian alerts require a network connection.`,
    targetScreen: 'emergencySettings',
    actionLabel: 'OPEN SAFETY SETTINGS',
  },
  {
    id: 'medication_help',
    category: 'QUICK HELP',
    icon: 'pill',
    iconBg: colors.primaryContainer,
    iconColor: colors.primary,
    title: 'Medication Reminders',
    summary: 'Manage your medicines.',
    content: `Open Medication from the Home dashboard and tap Add Medicine.

Enter the medicine name, dose, and preferred reminder time. When the scheduled time arrives, the app alerts you. Tap "Taken" after taking your medicine to record adherence.`,
    targetScreen: 'medicines',
    actionLabel: 'OPEN MEDICATION',
  },
  {
    id: 'tasks_help',
    category: 'QUICK HELP',
    icon: 'check-circle-outline',
    iconBg: colors.successContainer,
    iconColor: colors.success,
    title: 'Daily Tasks',
    summary: 'Manage your reminders.',
    content: `Daily Tasks allow you to set reminders for activities like drinking water, attending appointments, or visiting the bank.

You can set reminders for today or upcoming future dates. The app will remind you beforehand.`,
    targetScreen: 'tasks',
    actionLabel: 'OPEN DAILY TASKS',
  },
  {
    id: 'mood_help',
    category: 'QUICK HELP',
    icon: 'emoticon-happy-outline',
    iconBg: colors.warningContainer,
    iconColor: colors.warning,
    title: 'Mood & Wellbeing',
    summary: 'Track your mood and wellbeing.',
    content: `Tell the app how you are feeling today. Select an icon or type your current emotion.

Based on your selected mood, the app may offer gentle wellbeing suggestions like reviewing your favorite memories.`,
    targetScreen: 'mood',
    actionLabel: 'OPEN MOOD CHECK-IN',
  },
  {
    id: 'memories_help',
    category: 'QUICK HELP',
    icon: 'book-open-page-variant-outline',
    iconBg: colors.category.journal.bg,
    iconColor: colors.category.journal.accent,
    title: 'Memories & Journaling',
    summary: 'Save meaningful moments.',
    content: `Create personal memories using photos, text, and dates.

Your journal entries remain strictly private and confidential on your device unless explicitly shared.`,
    targetScreen: 'memories',
    actionLabel: 'OPEN MEMORIES',
  },
  {
    id: 'guardian_help',
    category: 'QUICK HELP',
    icon: 'account-heart-outline',
    iconBg: colors.successContainer,
    iconColor: colors.success,
    title: 'Guardian Support',
    summary: 'Manage your Guardian.',
    content: `To connect a Guardian:
1. Ask your Guardian to open their app and display their QR code or 6-digit Guardian code.
2. Tap Connect Guardian from Guardian Information.
3. Enter the code or scan the QR code to confirm connection.`,
    targetScreen: 'guardianInfo',
    actionLabel: 'OPEN GUARDIAN INFO',
  },
  {
    id: 'notif_faq',
    category: 'COMMON QUESTIONS',
    icon: 'bell-outline',
    iconBg: colors.warningContainer,
    iconColor: colors.warning,
    title: "Why didn't I receive a reminder?",
    summary: 'Troubleshoot missing notification alerts.',
    content: `If you missed a reminder, please verify that:
1. Notification Settings > Medication & Task reminders are turned ON.
2. Notification sound and vibration are turned ON.
3. Your device settings allow notifications for SithaMithuru.`,
    targetScreen: 'notificationSettings',
    actionLabel: 'OPEN NOTIFICATION SETTINGS',
  },
  {
    id: 'offline_faq',
    category: 'COMMON QUESTIONS',
    icon: 'wifi-off',
    iconBg: colors.primaryContainer,
    iconColor: colors.primary,
    title: 'Does the app work without internet?',
    summary: 'Learn about offline capabilities.',
    content: `Yes! SithaMithuru is built with an offline-first architecture.

Emergency keyword detection, medication reminders, daily tasks, mood check-ins, and journaling work 100% offline. Information waiting to reach your Guardian will sync automatically when connectivity returns.`,
  },
];

interface HelpSupportProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const HelpSupportScreen: React.FC<HelpSupportProps> = ({
  onBack,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const filteredArticles = HELP_ARTICLES.filter((article) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      article.title.toLowerCase().includes(q) ||
      article.summary.toLowerCase().includes(q) ||
      article.content.toLowerCase().includes(q)
    );
  });

  const quickHelpItems = filteredArticles.filter((item) => item.category === 'QUICK HELP');
  const faqItems = filteredArticles.filter((item) => item.category === 'COMMON QUESTIONS');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es46.txt Section 1) ─── */}
      <ScreenHeader title="Help & Support" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.mainTitleText}>How can we help?</Text>

        {/* ─── SEARCH BOX (es46.txt Section 21) ─── */}
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={24} color={colors.text.tertiary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help topics..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ─── QUICK HELP CATEGORIES (es46.txt Section 3 & 27) ─── */}
        {quickHelpItems.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>QUICK HELP</Text>
            <View style={styles.card}>
              {quickHelpItems.map((item, idx) => (
                <React.Fragment key={item.id}>
                  {idx > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.articleRow}
                    onPress={() => setSelectedArticle(item)}
                    activeOpacity={0.8}
                    accessible={true}
                    accessibilityLabel={`${item.title}, ${item.summary}`}
                  >
                    <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                      <MaterialCommunityIcons name={item.icon as any} size={22} color={item.iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.articleTitle}>{item.title}</Text>
                      <Text style={styles.articleSummary}>{item.summary}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </>
        )}

        {/* ─── COMMON QUESTIONS (FAQ) (es46.txt Section 14, 15, 18, 19) ─── */}
        {faqItems.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>COMMON QUESTIONS</Text>
            <View style={styles.card}>
              {faqItems.map((item, idx) => (
                <React.Fragment key={item.id}>
                  {idx > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.articleRow}
                    onPress={() => setSelectedArticle(item)}
                    activeOpacity={0.8}
                    accessible={true}
                    accessibilityLabel={item.title}
                  >
                    <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                      <MaterialCommunityIcons name={item.icon as any} size={22} color={item.iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.articleTitle}>{item.title}</Text>
                      <Text style={styles.articleSummary}>{item.summary}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* ─── HELP ARTICLE MODAL (ELDER-S46A - Section 23) ─── */}
      <Modal
        visible={!!selectedArticle}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setSelectedArticle(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setSelectedArticle(null)}
              accessible={true}
              accessibilityLabel="Close help article"
            >
              <MaterialCommunityIcons name="close" size={26} color={colors.text.primary} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Help Guide</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={true}>
            <View style={[styles.modalIconBox, { backgroundColor: selectedArticle?.iconBg }]}>
              <MaterialCommunityIcons name={selectedArticle?.icon as any} size={36} color={selectedArticle?.iconColor} />
            </View>

            <Text style={styles.modalArticleTitle}>{selectedArticle?.title}</Text>

            <View style={styles.modalDivider} />

            <Text style={styles.modalArticleBody}>{selectedArticle?.content}</Text>

            {selectedArticle?.targetScreen && selectedArticle?.actionLabel ? (
              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={() => {
                  const target = selectedArticle.targetScreen;
                  setSelectedArticle(null);
                  if (target) {
                    onNavigate(target);
                  }
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalActionBtnText}>{selectedArticle.actionLabel}</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
    paddingTop: 20,
    paddingBottom: 110,
  },
  mainTitleText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl || 20,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 20,
    ...elevation.e1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 16,
    ...elevation.e1,
  },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  articleSummary: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4 || 16,
    borderBottomWidth: 1,
    borderColor: colors.outline,
  },
  modalContent: {
    padding: spacing.s5 || 20,
    alignItems: 'center',
  },
  modalIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalArticleTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.outline,
    width: '100%',
    marginBottom: 20,
  },
  modalArticleBody: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 24,
    width: '100%',
    marginBottom: 32,
  },
  modalActionBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e2,
  },
  modalActionBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
});

export default HelpSupportScreen;

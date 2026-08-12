/**
 * AboutAppInfoScreen.tsx — Screen ELDER-S41 (About the App Information Screen)
 * Spec: es41.txt
 *
 * Requirements (es41.txt):
 *  1. Header: Back arrow (←), Title "About the App".
 *  2. Top Identity (es40.txt & es41.txt Section 2):
 *     - Logo icon circle (Shield Heart)
 *     - App Name "SithaMithuru"
 *     - Tagline "Your Caring Companion"
 *  3. Opening Description (es41.txt Section 3):
 *     - "SithaMithuru is designed to support older adults with everyday reminders, wellbeing support and emergency safety."
 *  4. Main Features Summary Cards (es41.txt Section 4-16):
 *     - 🛡 Emergency Safety: "Detect configured emergency keywords and start the emergency support flow."
 *     - 💊 Medication Reminders: "Receive reminders when it is time to take your medicines and record adherence."
 *     - 📅 Daily Tasks: "Create reminders for important daily activities and upcoming tasks."
 *     - ❤️ Mood Check-ins: "Tell the app how you are feeling and keep track of your mood over time."
 *     - 📖 Memories & Journaling: "Create personal memories using photos, text and meaningful moments."
 *     - 👤 Guardian Support: "Connect a trusted Guardian who can receive supported safety and wellbeing information."
 *  5. Offline-First Support Section (es41.txt Section 18):
 *     - "Important app features are designed to continue working when an internet connection is unavailable."
 *  6. 100% Offline-First
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

interface AboutAppInfoProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const AboutAppInfoScreen: React.FC<AboutAppInfoProps> = ({
  onBack,
  onNavigate,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es41.txt Section 1) ─── */}
      <ScreenHeader title="About the App" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── APP IDENTITY (es41.txt Section 2) ─── */}
        <View style={styles.heroBox}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="hand-heart" size={48} color={colors.primary} />
          </View>
          <Text style={styles.appNameText}>SithaMithuru</Text>
          <Text style={styles.taglineText}>Your Caring Companion</Text>
        </View>

        {/* ─── OPENING DESCRIPTION (es41.txt Section 3) ─── */}
        <Text style={styles.sectionHeader}>ABOUT SITHAMITHURU</Text>
        <View style={styles.infoCard}>
          <Text style={styles.descriptionText}>
            SithaMithuru is designed to support older adults with everyday reminders, wellbeing support and emergency safety.
          </Text>
        </View>

        {/* ─── MAIN FEATURES (es41.txt Section 4-16) ─── */}
        <Text style={styles.sectionHeader}>MAIN FEATURES</Text>
        <View style={styles.card}>
          {/* EMERGENCY SAFETY */}
          <View style={styles.featureRow}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.errorContainer }]}>
              <MaterialCommunityIcons name="shield-alert-outline" size={22} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Emergency Safety</Text>
              <Text style={styles.featureSubtitle}>
                Detect configured emergency keywords and start the emergency support flow.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* MEDICATION REMINDERS */}
          <View style={styles.featureRow}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.primaryContainer }]}>
              <MaterialCommunityIcons name="pill" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Medication Reminders</Text>
              <Text style={styles.featureSubtitle}>
                Receive reminders when it is time to take your medicines and record adherence.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* DAILY TASKS */}
          <View style={styles.featureRow}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.successContainer }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={22} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Daily Tasks</Text>
              <Text style={styles.featureSubtitle}>
                Create reminders for important daily activities and upcoming tasks.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* MOOD CHECK-INS */}
          <View style={styles.featureRow}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.warningContainer }]}>
              <MaterialCommunityIcons name="emoticon-happy-outline" size={22} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Mood Check-ins</Text>
              <Text style={styles.featureSubtitle}>
                Tell the app how you are feeling and keep track of your mood over time.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* MEMORIES & JOURNALING */}
          <View style={styles.featureRow}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.category.journal.bg }]}>
              <MaterialCommunityIcons name="book-open-page-variant-outline" size={22} color={colors.category.journal.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Memories & Journaling</Text>
              <Text style={styles.featureSubtitle}>
                Create personal memories using photos, text and meaningful moments.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* GUARDIAN SUPPORT */}
          <View style={styles.featureRow}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.successContainer }]}>
              <MaterialCommunityIcons name="account-heart-outline" size={22} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Guardian Support</Text>
              <Text style={styles.featureSubtitle}>
                Connect a trusted Guardian who can receive supported safety and wellbeing information.
              </Text>
            </View>
          </View>
        </View>

        {/* ─── OFFLINE-FIRST SUPPORT (es41.txt Section 18) ─── */}
        <Text style={styles.sectionHeader}>OFFLINE-FIRST SUPPORT</Text>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="wifi-off" size={24} color={colors.primary} style={{ marginBottom: 6 }} />
          <Text style={styles.descriptionText}>
            Important app features are designed to continue working when an internet connection is unavailable.
          </Text>
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
    paddingTop: 24,
    paddingBottom: 110,
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
    ...elevation.e1,
  },
  appNameText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  taglineText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 16,
    ...elevation.e1,
  },
  descriptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 22,
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
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 10,
  },
});

export default AboutAppInfoScreen;

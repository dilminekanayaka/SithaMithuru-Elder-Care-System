/**
 * PrivacyInformationScreen.tsx — Screen ELDER-S42 (Privacy Information Screen)
 * Spec: es42.txt
 *
 * Requirements (es42.txt):
 *  1. Header: Back arrow (←), Title "Privacy Information".
 *  2. Intro Banner (es42.txt Section 4):
 *     - "Your privacy matters. SithaMithuru uses information needed to provide its reminder, safety, wellbeing and Guardian support features."
 *  3. Expandable Accordion Sections (es42.txt Section 35, 36, 37, 443-465):
 *     - Information We Collect (Profile, Medication, Tasks, Mood, Journal/Memories, Emergency, Guardian)
 *     - How We Use Information (Reminders, Safety Support, Guardian Risk Alerts)
 *     - Emergency Information & Data Flow (On-device detection, local storage, offline queue)
 *     - Guardian Data Sharing (Safety alerts shared, private memories remain confidential)
 *     - Data Storage & Synchronization (Local SQLite caching, secure backend sync when online)
 *     - Permissions Explained (Microphone for Emergency detection, Notifications for alerts, Camera for QR scan)
 *     - Security & User Rights (Data protection and account settings control)
 *  4. Policy Footer (es42.txt Section 33 & 34):
 *     - "Privacy Policy Version 1.0 | Last updated: August 2026"
 *  5. 100% Offline-First
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

interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <View style={styles.accordionCard}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={onToggle}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel={`${title}, ${isOpen ? 'Expanded' : 'Collapsed'}`}
      >
        <Text style={styles.accordionTitle}>{title}</Text>
        <MaterialCommunityIcons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>

      {isOpen && <View style={styles.accordionBody}>{children}</View>}
    </View>
  );
};

interface PrivacyInformationProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const PrivacyInformationScreen: React.FC<PrivacyInformationProps> = ({
  onBack,
  onNavigate,
}) => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    collect: true,
    use: false,
    emergency: false,
    guardian: false,
    storage: false,
    permissions: false,
    security: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es42.txt Section 1) ─── */}
      <ScreenHeader title="Privacy Information" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── INTRO BANNER (es42.txt Section 4) ─── */}
        <View style={styles.introCard}>
          <MaterialCommunityIcons name="shield-lock-outline" size={32} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.introTitle}>Your privacy matters</Text>
          <Text style={styles.introText}>
            SithaMithuru uses information needed to provide its reminder, safety, wellbeing and Guardian support features.
          </Text>
        </View>

        {/* ─── EXPANDABLE ACCORDION SECTIONS (es42.txt Section 35, 36, 37) ─── */}

        {/* 1. INFORMATION WE COLLECT */}
        <AccordionSection
          title="Information We Collect"
          isOpen={!!openSections.collect}
          onToggle={() => toggleSection('collect')}
        >
          <Text style={styles.bulletText}>• Profile information (Name, Age, Preferred Language)</Text>
          <Text style={styles.bulletText}>• Medication information & Schedule status</Text>
          <Text style={styles.bulletText}>• Daily task information & Completion records</Text>
          <Text style={styles.bulletText}>• Mood check-in entries & History</Text>
          <Text style={styles.bulletText}>• Journal & Memory stories created by you</Text>
          <Text style={styles.bulletText}>• Emergency detection events & Log timestamps</Text>
          <Text style={styles.bulletText}>• Guardian relationship details</Text>
        </AccordionSection>

        {/* 2. HOW WE USE INFORMATION */}
        <AccordionSection
          title="How We Use Information"
          isOpen={!!openSections.use}
          onToggle={() => toggleSection('use')}
        >
          <Text style={styles.bodyText}>
            Information is used to deliver timely medication reminders, daily task alerts, support mood check-ins, store personal memories, detect emergency keyword events, and notify your connected Guardian during safety concerns.
          </Text>
        </AccordionSection>

        {/* 3. EMERGENCY INFORMATION & DATA FLOW */}
        <AccordionSection
          title="Emergency Information"
          isOpen={!!openSections.emergency}
          onToggle={() => toggleSection('emergency')}
        >
          <Text style={styles.bodyText}>
            Emergency keyword detection operates directly on your device. When an emergency is detected, an event log is saved locally. If internet connectivity is available, an alert is sent to your Guardian. If offline, the event remains securely saved on-device until connection is restored.
          </Text>
        </AccordionSection>

        {/* 4. GUARDIAN DATA SHARING */}
        <AccordionSection
          title="Guardian Data Sharing"
          isOpen={!!openSections.guardian}
          onToggle={() => toggleSection('guardian')}
        >
          <Text style={styles.bodyText}>
            Connected Guardians receive information supported by Guardian monitoring features, such as safety alerts and medication adherence risks. Your private memories and personal journal entries remain confidential to you.
          </Text>
        </AccordionSection>

        {/* 5. DATA STORAGE & SYNCHRONIZATION */}
        <AccordionSection
          title="Data Storage & Synchronization"
          isOpen={!!openSections.storage}
          onToggle={() => toggleSection('storage')}
        >
          <Text style={styles.bodyText}>
            SithaMithuru is built with an offline-first architecture. Your data is saved securely on your local device first. When an internet connection becomes available, necessary information is synchronized with our secure cloud backend.
          </Text>
        </AccordionSection>

        {/* 6. PERMISSIONS EXPLAINED */}
        <AccordionSection
          title="Permissions Explained"
          isOpen={!!openSections.permissions}
          onToggle={() => toggleSection('permissions')}
        >
          <Text style={styles.bulletText}>• Microphone: Required exclusively for emergency keyword detection.</Text>
          <Text style={styles.bulletText}>• Notifications: Required to deliver medicine, task and safety reminders.</Text>
          <Text style={styles.bulletText}>• Camera: Used only when scanning a Guardian QR code connection.</Text>
        </AccordionSection>

        {/* 7. SECURITY & USER RIGHTS */}
        <AccordionSection
          title="Security & User Rights"
          isOpen={!!openSections.security}
          onToggle={() => toggleSection('security')}
        >
          <Text style={styles.bodyText}>
            The application implements standard technical security measures to protect your information. You can manage your preferences through the available App Settings and account controls.
          </Text>
        </AccordionSection>

        {/* ─── POLICY FOOTER (es42.txt Section 33 & 34) ─── */}
        <View style={styles.footerBox}>
          <Text style={styles.footerText}>Privacy Policy Version 1.0</Text>
          <Text style={styles.footerText}>Last updated: August 2026</Text>
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
    paddingTop: 20,
    paddingBottom: 110,
  },
  introCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 20,
    alignItems: 'flex-start',
    ...elevation.e1,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  introText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 22,
  },
  accordionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 12,
    overflow: 'hidden',
    ...elevation.e1,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.s4 || 16,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  accordionBody: {
    paddingHorizontal: spacing.s4 || 16,
    paddingBottom: spacing.s4 || 16,
    borderTopWidth: 1,
    borderColor: colors.outlineVariant,
    paddingTop: 12,
  },
  bodyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 22,
  },
  bulletText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 6,
  },
  footerBox: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginBottom: 2,
  },
});

export default PrivacyInformationScreen;

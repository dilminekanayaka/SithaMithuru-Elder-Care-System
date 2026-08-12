/**
 * TermsOfUseScreen.tsx — Screen ELDER-S43 (Terms of Use Screen)
 * Spec: es43.txt
 *
 * Requirements (es43.txt):
 *  1. Header: Back arrow (←), Title "Terms of Use".
 *  2. Intro Banner: "Please read these terms of use carefully before using SithaMithuru."
 *  3. Accordion Sections:
 *     - 1. Application Purpose (Reminders, wellbeing support & emergency assistance)
 *     - 2. Emergency Disclaimer (Safety support tool; does not replace emergency medical or police services)
 *     - 3. Guardian Connection (Connected Guardians receive supported safety and risk alerts)
 *     - 4. Account Responsibility (Elder account usage guidelines)
 *     - 5. Service Availability & Offline Use (Offline-first local operation; remote alert delivery requires network)
 *  4. Footer: "Terms Version 1.0 | Last updated: August 2026"
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

interface TermsOfUseProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const TermsOfUseScreen: React.FC<TermsOfUseProps> = ({
  onBack,
  onNavigate,
}) => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    purpose: true,
    emergency: true,
    guardian: false,
    account: false,
    availability: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es43.txt Section 1) ─── */}
      <ScreenHeader title="Terms of Use" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── INTRO BANNER ─── */}
        <View style={styles.introCard}>
          <MaterialCommunityIcons name="file-document-outline" size={32} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.introTitle}>Terms of Use</Text>
          <Text style={styles.introText}>
            Please read these terms of use carefully before using the SithaMithuru application.
          </Text>
        </View>

        {/* ─── ACCORDION SECTIONS ─── */}

        {/* 1. APPLICATION PURPOSE */}
        <AccordionSection
          title="1. Application Purpose"
          isOpen={!!openSections.purpose}
          onToggle={() => toggleSection('purpose')}
        >
          <Text style={styles.bodyText}>
            SithaMithuru is an elder-care assistant designed to support older adults with daily medication reminders, task management, mood check-ins, personal memory journaling, and emergency safety support.
          </Text>
        </AccordionSection>

        {/* 2. EMERGENCY DISCLAIMER */}
        <AccordionSection
          title="2. Emergency Disclaimer"
          isOpen={!!openSections.emergency}
          onToggle={() => toggleSection('emergency')}
        >
          <Text style={styles.warningBodyText}>
            ⚠️ SithaMithuru is designed to provide additional safety support and does not replace emergency services, police, or direct professional human medical care. In life-threatening emergencies, always attempt to contact official emergency services directly.
          </Text>
        </AccordionSection>

        {/* 3. GUARDIAN CONNECTION */}
        <AccordionSection
          title="3. Guardian Connection"
          isOpen={!!openSections.guardian}
          onToggle={() => toggleSection('guardian')}
        >
          <Text style={styles.bodyText}>
            By connecting a Guardian, you authorize the application to send supported safety notifications, emergency alerts, and contextual wellbeing monitoring data to your connected Guardian.
          </Text>
        </AccordionSection>

        {/* 4. ACCOUNT RESPONSIBILITY */}
        <AccordionSection
          title="4. Account Responsibility"
          isOpen={!!openSections.account}
          onToggle={() => toggleSection('account')}
        >
          <Text style={styles.bodyText}>
            Users are responsible for ensuring that their profile information, emergency keyword preferences, and trusted Guardian connections are kept accurate.
          </Text>
        </AccordionSection>

        {/* 5. SERVICE AVAILABILITY & OFFLINE USE */}
        <AccordionSection
          title="5. Service Availability"
          isOpen={!!openSections.availability}
          onToggle={() => toggleSection('availability')}
        >
          <Text style={styles.bodyText}>
            Core features are engineered to operate offline on your device. However, remote Guardian alerts and cloud data synchronization require an active internet connection to deliver messages.
          </Text>
        </AccordionSection>

        {/* ─── FOOTER ─── */}
        <View style={styles.footerBox}>
          <Text style={styles.footerText}>Terms Version 1.0</Text>
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
  warningBodyText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warningDark,
    lineHeight: 22,
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

export default TermsOfUseScreen;

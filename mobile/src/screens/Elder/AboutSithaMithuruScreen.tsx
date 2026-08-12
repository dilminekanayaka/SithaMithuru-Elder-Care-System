/**
 * AboutSithaMithuruScreen.tsx — Screen ELDER-S40 (About SithaMithuru Screen)
 * Spec: es40.txt
 *
 * Requirements (es40.txt):
 *  1. Header: Back arrow (←), Title "About SithaMithuru".
 *  2. Top Identity Section (es40.txt Section 3 & 4):
 *     - Logo icon circle (Shield Heart / Caring icon)
 *     - Title "SithaMithuru"
 *     - Tagline "Your Caring Companion"
 *     - App Version "Version 1.0.0"
 *  3. Navigation Links (es40.txt Section 5-8 & 398-425):
 *     - About the App > (navigates to aboutApp)
 *     - Privacy Information > (navigates to privacyInfo)
 *     - Terms of Use > (navigates to termsOfUse)
 *     - Open Source Licenses > (navigates to openSourceLicenses)
 *  4. Footer Copyright: "© 2026 SithaMithuru"
 *  5. 100% Offline-First
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

interface AboutSithaMithuruProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const AboutSithaMithuruScreen: React.FC<AboutSithaMithuruProps> = ({
  onBack,
  onNavigate,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es40.txt Section 1) ─── */}
      <ScreenHeader title="About SithaMithuru" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── APP IDENTITY (es40.txt Section 3 & 4) ─── */}
        <View style={styles.heroBox}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="hand-heart" size={54} color={colors.primary} />
          </View>
          <Text style={styles.appNameText}>SithaMithuru</Text>
          <Text style={styles.taglineText}>Your Caring Companion</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        {/* ─── NAVIGATION MENU (es40.txt Section 5-8 & 398-425) ─── */}
        <View style={styles.card}>
          {/* ABOUT THE APP */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigate('aboutApp')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="About the App"
          >
            <Text style={styles.menuText}>About the App</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* PRIVACY INFORMATION */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigate('privacyInfo')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Privacy Information"
          >
            <Text style={styles.menuText}>Privacy Information</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* TERMS OF USE */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigate('termsOfUse')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Terms of Use"
          >
            <Text style={styles.menuText}>Terms of Use</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* OPEN SOURCE LICENSES */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigate('openSourceLicenses')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Open Source Licenses"
          >
            <Text style={styles.menuText}>Open Source Licenses</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* ─── COPYRIGHT FOOTER (es40.txt Section 18) ─── */}
        <Text style={styles.copyrightText}>© 2026 SithaMithuru</Text>
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
    paddingTop: 32,
    paddingBottom: 110,
    alignItems: 'center',
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
    ...elevation.e2,
  },
  appNameText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  taglineText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    width: '100%',
    marginBottom: 32,
    ...elevation.e1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 6,
  },
  copyrightText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

export default AboutSithaMithuruScreen;

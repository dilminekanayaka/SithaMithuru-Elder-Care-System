/**
 * ProfileScreen.tsx — Screen ELDER-S29 (Elder Profile Screen)
 * Spec: es29.txt
 *
 * Requirements (es29.txt):
 *  1. Header: Back arrow (←), Title "My Profile".
 *  2. Hero Profile Identity (es29.txt Section 2 & 508-522):
 *     - Avatar Circle / Profile Photo
 *     - Elder Full Name ("Kamal" / "Kamal Perera")
 *     - [ Edit Profile ] CTA button (≥52dp height) -> navigates to Edit Personal Info
 *  3. Profile Navigation Cards (es29.txt Section 2, 7, 8, 10, 11, 523-541):
 *     - Personal Information > (Full Name, Date of Birth)
 *     - Language > (Sinhala / Tamil / English)
 *     - Guardian Information > (Connected ✓ / Guardian relationship summary)
 *     - App Settings > (Notification & System preferences)
 *  4. 100% Offline-First
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface ProfileProps {
  userData?: any;
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const ProfileScreen: React.FC<ProfileProps> = ({ userData, onBack, onNavigate }) => {
  const name = userData?.name || 'Kamal Perera';
  const avatarUrl = userData?.avatar_url;
  const language = userData?.preferred_language || 'Sinhala';

  const getInitials = (nStr: string) => {
    return nStr
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es29.txt Section 1) ─── */}
      <ScreenHeader title="My Profile" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── HERO PROFILE IDENTITY (es29.txt Section 2 & 508-522) ─── */}
        <View style={styles.heroSection}>
          <View style={styles.avatarCircle}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Text style={styles.avatarInitialsText}>{getInitials(name)}</Text>
            )}
          </View>

          <Text style={styles.nameText}>{name}</Text>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => onNavigate('editProfile')}
            activeOpacity={0.85}
            accessible={true}
            accessibilityLabel="Edit Profile"
          >
            <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ─── MENU NAVIGATION CARDS (es29.txt Section 2, 7, 8, 10, 11, 523-541) ─── */}
        <View style={styles.menuSection}>
          {/* PERSONAL INFORMATION */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => onNavigate('editProfile')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Personal Information"
          >
            <MaterialCommunityIcons name="account-outline" size={24} color={colors.primary} />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitleText}>Personal Information</Text>
              <Text style={styles.menuSubtitleText}>Name & Date of Birth</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* LANGUAGE */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => onNavigate('languageSettings')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Language settings"
          >
            <MaterialCommunityIcons name="translate" size={24} color={colors.category.journal.accent} />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitleText}>Language</Text>
              <Text style={styles.menuSubtitleText}>{language}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* GUARDIAN INFORMATION */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => onNavigate('guardianInfo')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Guardian Information"
          >
            <MaterialCommunityIcons name="account-heart-outline" size={24} color={colors.success} />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitleText}>Guardian Information</Text>
              <Text style={[styles.menuSubtitleText, { color: colors.success, fontWeight: '700' }]}>
                Connected ✓
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* APP SETTINGS */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => onNavigate('settings')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="App Settings"
          >
            <MaterialCommunityIcons name="cog-outline" size={24} color={colors.warning} />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitleText}>App Settings</Text>
              <Text style={styles.menuSubtitleText}>Notifications & preferences</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavBar activeTab="profile" onNavigate={onNavigate} />
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
    paddingTop: spacing.s5 || 20,
    paddingBottom: 110,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.s6 || 24,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.surface,
    ...elevation.e2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitialsText: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 14,
  },
  editProfileBtn: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    gap: 8,
    ...elevation.e1,
  },
  editProfileBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  menuSection: {
    gap: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  menuSubtitleText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '600',
  },
});

export default ProfileScreen;

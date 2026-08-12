/**
 * GuardianDetailsScreen.tsx — Screen ELDER-S53 (Guardian Details Screen)
 * Spec: es53.txt
 *
 * Requirements (es53.txt):
 *  1. Header: Back arrow (←), Title "Guardian Details".
 *  2. Profile Header (es53.txt Section 3):
 *     - Avatar Circle / Initials ("NP")
 *     - Guardian Name ("Nimal Perera")
 *     - Status Badge "✓ Connected"
 *  3. Information Fields (es53.txt Section 4, 5, 6, 7, 8):
 *     - Relationship: "Daughter" / "Son"
 *     - Connected Since: "August 5, 2026"
 *     - Connection Status: "✓ Active"
 *     - Guardian Notifications: "✓ Enabled"
 *  4. Support Explanation Banner (es53.txt Section 9 & 333-360):
 *     - "Guardian Support: Your Guardian can receive supported safety and wellbeing notifications from SithaMithuru."
 *  5. 100% Offline-First (Section 19): Read-only cached display.
 */

import React, { useState } from 'react';
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

export interface GuardianDetailModel {
  name: string;
  relationship: string;
  connectedSince: string;
  connectionStatus: string;
  notificationStatus: string;
  avatarUrl?: string;
}

const DEFAULT_GUARDIAN_DETAIL: GuardianDetailModel = {
  name: 'Kumari Perera',
  relationship: 'Daughter',
  connectedSince: 'August 5, 2026',
  connectionStatus: '✓ Active',
  notificationStatus: '✓ Enabled',
};

interface GuardianDetailsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  guardianData?: GuardianDetailModel;
}

const GuardianDetailsScreen: React.FC<GuardianDetailsProps> = ({
  onBack,
  onNavigate,
  guardianData = DEFAULT_GUARDIAN_DETAIL,
}) => {
  const [details] = useState<GuardianDetailModel>(guardianData);

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

      {/* ─── HEADER (es53.txt Section 1) ─── */}
      <ScreenHeader title="Guardian Details" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── PROFILE HEADER (es53.txt Section 3) ─── */}
        <View style={styles.heroSection}>
          <View style={styles.avatarCircle}>
            {details.avatarUrl ? (
              <Image source={{ uri: details.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Text style={styles.avatarInitialsText}>{getInitials(details.name)}</Text>
            )}
          </View>

          <Text style={styles.guardianNameText}>{details.name}</Text>

          <View style={styles.statusBadgeBox}>
            <View style={styles.greenDot} />
            <Text style={styles.statusBadgeText}>Connected</Text>
          </View>
        </View>

        {/* ─── INFORMATION FIELDS (es53.txt Section 4-8) ─── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>Relationship</Text>
          <Text style={styles.infoCardValue}>{details.relationship}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>Connected Since</Text>
          <Text style={styles.infoCardValue}>{details.connectedSince}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>Connection Status</Text>
          <Text style={[styles.infoCardValue, { color: colors.success }]}>{details.connectionStatus}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>Guardian Notifications</Text>
          <Text style={[styles.infoCardValue, { color: colors.success }]}>{details.notificationStatus}</Text>
        </View>

        {/* ─── SUPPORT EXPLANATION BANNER (es53.txt Section 9) ─── */}
        <View style={styles.supportBanner}>
          <MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.primary} style={{ marginBottom: 6 }} />
          <Text style={styles.supportTitle}>Guardian Support</Text>
          <Text style={styles.supportText}>
            Your Guardian can receive supported safety and wellbeing notifications from SithaMithuru.
          </Text>
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
    marginBottom: spacing.s5 || 20,
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
  guardianNameText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
  },
  statusBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.status.taken.border,
    gap: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.success,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s3 || 12,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  infoCardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  supportBanner: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    marginTop: 12,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  supportText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 20,
  },
});

export default GuardianDetailsScreen;

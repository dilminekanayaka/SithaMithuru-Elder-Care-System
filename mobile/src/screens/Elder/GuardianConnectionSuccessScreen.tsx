/**
 * GuardianConnectionSuccessScreen.tsx — Screen ELDER-S34 (Guardian Connection Success Screen)
 * Spec: es34.txt
 *
 * Requirements (es34.txt):
 *  1. Terminal Success State Layout (es34.txt Section 2, 3, 4, 5, 457-488):
 *     - Green Checkmark Circle (✓)
 *     - Title "Guardian Connected"
 *     - Avatar Circle / Photo ("N")
 *     - Guardian Name ("Nimal Perera")
 *     - Relationship ("Daughter")
 *     - Confirmation Text: "Your Guardian can now receive supported safety notifications from your account."
 *     - Primary Action: [ DONE ] button (≥56dp height full-width button) -> navigates to Guardian Information (ELDER-S31)
 *  2. Trustworthy & Calm Aesthetics: Clean layout, clear success indicator without unnecessary clutter.
 *  3. 100% Offline-First: Cached local relationship confirmation.
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

interface GuardianConnectionSuccessProps {
  onNavigate: (screen: string) => void;
  guardianData?: {
    name: string;
    relationship: string;
    avatarUrl?: string;
  };
}

const DEFAULT_GUARDIAN_DATA: {
  name: string;
  relationship: string;
  avatarUrl?: string;
} = {
  name: 'Kumari Perera',
  relationship: 'Daughter',
};

const GuardianConnectionSuccessScreen: React.FC<GuardianConnectionSuccessProps> = ({
  onNavigate,
  guardianData = DEFAULT_GUARDIAN_DATA,
}) => {
  const getInitials = (nStr: string) => {
    return nStr
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleDone = () => {
    onNavigate('guardianInfo');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── 3. SUCCESS INDICATOR (es34.txt Section 3) ─── */}
        <View style={styles.successCircle}>
          <MaterialCommunityIcons name="check" size={54} color={colors.onPrimary} />
        </View>

        <Text style={styles.titleText}>Guardian Connected</Text>

        {/* ─── 4. GUARDIAN IDENTITY (es34.txt Section 4) ─── */}
        <View style={styles.avatarCircle}>
          {guardianData.avatarUrl ? (
            <Image
              source={{ uri: guardianData.avatarUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarInitialsText}>{getInitials(guardianData.name)}</Text>
          )}
        </View>

        <Text style={styles.guardianNameText}>{guardianData.name}</Text>
        <Text style={styles.relationshipText}>{guardianData.relationship}</Text>

        {/* ─── 5. CONFIRMATION TEXT (es34.txt Section 5) ─── */}
        <View style={styles.reassuranceCard}>
          <MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.success} />
          <Text style={styles.reassuranceText}>
            Your Guardian can now receive supported safety notifications from your account.
          </Text>
        </View>

        {/* ─── 13. DONE BUTTON (es34.txt Section 13 & es58.txt Section 8) ─── */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={handleDone}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Done, return to Guardian Information"
        >
          <Text style={styles.doneBtnText}>DONE</Text>
        </TouchableOpacity>

        {/* ─── 9. SECONDARY CTA: VIEW GUARDIAN DETAILS (es58.txt Section 9) ─── */}
        <TouchableOpacity
          style={styles.viewDetailsBtn}
          onPress={() => onNavigate('guardianDetails')}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="View Guardian Details"
        >
          <Text style={styles.viewDetailsBtnText}>VIEW GUARDIAN DETAILS</Text>
        </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: 48,
    paddingBottom: 110,
    alignItems: 'center',
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...elevation.e2,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
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
    marginBottom: 4,
  },
  relationshipText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 24,
  },
  reassuranceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    borderRadius: radius.xxl || 24,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.status.taken.border,
    marginBottom: 32,
    width: '100%',
  },
  reassuranceText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.successDark,
    lineHeight: 22,
  },
  doneBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e2,
  },
  doneBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  viewDetailsBtn: {
    width: '100%',
    height: 52,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  viewDetailsBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
});

export default GuardianConnectionSuccessScreen;

/**
 * GuardianConnectionConfirmationScreen.tsx — Screen ELDER-S56 (Guardian Connection Confirmation Screen)
 * Spec: es56.txt
 *
 * Requirements (es56.txt):
 *  1. Header: Back arrow (←), Title "Confirm Guardian Connection".
 *  2. Guardian Identity Header (es56.txt Section 3):
 *     - Avatar Circle / Initials ("NP")
 *     - Guardian Name ("Nimal Perera")
 *     - Status Badge "✓ Guardian Found"
 *  3. Information Card (es56.txt Section 4):
 *     - Relationship: "Son" / "Daughter"
 *  4. Consent Question & Purpose (es56.txt Section 5 & 6):
 *     - Question: "Connect this person as your Guardian?"
 *     - Explanation: "Your Guardian may receive supported safety and wellbeing notifications from SithaMithuru."
 *  5. Action Controls (es56.txt Section 7 & 8):
 *     - Primary Button: [ CONFIRM CONNECTION ] (≥56dp height)
 *     - Processing State: ActivityIndicator + "Connecting Guardian..."
 *     - Secondary Action: CANCEL
 *  6. Success Navigation: Navigates to guardianConnectionSuccess upon confirmation.
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
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

export interface GuardianPreviewModel {
  name: string;
  relationship: string;
  avatarUrl?: string;
}

const DEFAULT_PREVIEW: GuardianPreviewModel = {
  name: 'Nimal Perera',
  relationship: 'Daughter',
};

interface GuardianConnectionConfirmationProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  guardianData?: GuardianPreviewModel;
  onConnectionSuccess?: (guardianData: any) => void;
}

const GuardianConnectionConfirmationScreen: React.FC<GuardianConnectionConfirmationProps> = ({
  onBack,
  onNavigate,
  guardianData = DEFAULT_PREVIEW,
  onConnectionSuccess,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [guardian] = useState<GuardianPreviewModel>(guardianData);

  const getInitials = (nStr: string) => {
    return nStr
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleConfirmConnection = () => {
    setIsConnecting(true);

    // Simulate backend connection authorization
    setTimeout(() => {
      setIsConnecting(false);
      Toast.show({
        type: 'success',
        text1: 'Guardian Connected 🎉',
        text2: `${guardian.name} is now connected to your account.`,
        position: 'top',
      });

      if (onConnectionSuccess) {
        onConnectionSuccess(guardian);
      }

      onNavigate('guardianConnectionSuccess');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es56.txt Section 1) ─── */}
      <ScreenHeader title="Confirm Guardian Connection" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUARDIAN IDENTITY HEADER (es56.txt Section 3) ─── */}
        <View style={styles.heroSection}>
          <View style={styles.avatarCircle}>
            {guardian.avatarUrl ? (
              <Image source={{ uri: guardian.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Text style={styles.avatarInitialsText}>{getInitials(guardian.name)}</Text>
            )}
          </View>

          <Text style={styles.guardianNameText}>{guardian.name}</Text>

          <View style={styles.statusBadgeBox}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.statusBadgeText}>Guardian Found</Text>
          </View>
        </View>

        {/* ─── RELATIONSHIP CARD (es56.txt Section 4) ─── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>Relationship</Text>
          <Text style={styles.infoCardValue}>{guardian.relationship}</Text>
        </View>

        {/* ─── CONSENT & PURPOSE BOX (es56.txt Section 5 & 6) ─── */}
        <View style={styles.consentCard}>
          <Text style={styles.consentQuestion}>Connect this person as your Guardian?</Text>
          <Text style={styles.consentText}>
            Your Guardian may receive supported safety and wellbeing notifications from SithaMithuru.
          </Text>
        </View>

        {/* ─── ACTION BUTTONS (es56.txt Section 7 & 8) ─── */}
        <TouchableOpacity
          style={[styles.confirmBtn, isConnecting && { opacity: 0.75 }]}
          onPress={handleConfirmConnection}
          disabled={isConnecting}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Confirm connection"
        >
          {isConnecting ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color={colors.onPrimary} />
              <Text style={styles.confirmBtnText}>Connecting Guardian...</Text>
            </View>
          ) : (
            <Text style={styles.confirmBtnText}>CONFIRM CONNECTION</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onBack}
          disabled={isConnecting}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelBtnText}>CANCEL</Text>
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
    gap: 6,
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
    marginBottom: spacing.s4 || 16,
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
  consentCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    marginBottom: 24,
  },
  consentQuestion: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 6,
  },
  consentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 20,
  },
  confirmBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...elevation.e2,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  cancelBtn: {
    width: '100%',
    height: 52,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.secondary,
  },
});

export default GuardianConnectionConfirmationScreen;

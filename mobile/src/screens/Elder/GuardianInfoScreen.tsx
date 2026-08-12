/**
 * GuardianInfoScreen.tsx — Screen ELDER-S31 (Guardian Information Screen)
 * Spec: es31.txt
 *
 * Requirements (es31.txt):
 *  1. Header: Back arrow (←), Title "Guardian Information".
 *  2. Connected Guardian State Layout (es31.txt Section 2, 3, 5, 6, 7, 344-375):
 *     - Avatar Circle / Photo (e.g. "N")
 *     - Guardian Name (e.g. "Nimal Perera")
 *     - Relationship (e.g. "Daughter")
 *     - Status Badge: ● Connected (Green pill badge)
 *     - Card 1: Relationship | Daughter
 *     - Card 2: Connection status | Connected ✓
 *     - Action: Disconnect Guardian button
 *  3. Disconnect Confirmation Modal (es31.txt Section 12):
 *     - "Disconnect Guardian? Nimal Perera will no longer be connected to your Elder account. Safety notifications may no longer reach this Guardian. [ CANCEL ] [ DISCONNECT ]"
 *  4. No Guardian Connected State (es31.txt Section 9):
 *     - 👤 "No Guardian connected. Connect a trusted person to receive safety alerts and support your wellbeing."
 *     - CTA button: [ CONNECT GUARDIAN ] (navigates to connect)
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
  Image,
  Modal,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface GuardianInfoProps {
  userData?: any;
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export interface GuardianData {
  name: string;
  relationship: string;
  status: 'CONNECTED' | 'PENDING' | 'DISCONNECTED';
  avatarUrl?: string;
}

const DEFAULT_GUARDIAN: GuardianData = {
  name: 'Kumari Perera',
  relationship: 'Daughter',
  status: 'CONNECTED',
};

const GuardianInfoScreen: React.FC<GuardianInfoProps> = ({
  userData,
  onBack,
  onNavigate,
}) => {
  const [guardian, setGuardian] = useState<GuardianData | null>(DEFAULT_GUARDIAN);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  React.useEffect(() => {
    if (userData?.guardian_name || userData?.guardianName || userData?.primary_guardian_name) {
      setGuardian({
        name: userData.guardian_name || userData.guardianName || userData.primary_guardian_name,
        relationship: userData.guardian_relationship || userData.relationship || 'Daughter',
        status: 'CONNECTED',
      });
    }
  }, [userData]);

  const handleConfirmDisconnect = () => {
    setGuardian(null);
    setShowDisconnectModal(false);
    Toast.show({
      type: 'info',
      text1: 'Guardian Disconnected',
      text2: 'No Guardian is currently connected to your account.',
      position: 'top',
    });
  };

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

      {/* ─── HEADER (es31.txt Section 1) ─── */}
      <ScreenHeader title="Guardian Information" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {guardian && guardian.status !== 'DISCONNECTED' ? (
          /* ─── 344. FINAL PRODUCTION LAYOUT: CONNECTED GUARDIAN (es31.txt Section 2 & 3) ─── */
          <>
            <View style={styles.heroSection}>
              <View style={styles.avatarCircle}>
                {guardian.avatarUrl ? (
                  <Image
                    source={{ uri: guardian.avatarUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.avatarInitialsText}>{getInitials(guardian.name)}</Text>
                )}
              </View>

              <Text style={styles.guardianNameText}>{guardian.name}</Text>
              <Text style={styles.relationshipSubText}>{guardian.relationship}</Text>

              {/* CONNECTED BADGE */}
              <View style={styles.statusBadgeBox}>
                <View style={styles.greenDot} />
                <Text style={styles.statusBadgeText}>Connected</Text>
              </View>
            </View>

            {/* INFO CARDS */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardLabel}>Relationship</Text>
              <Text style={styles.infoCardValue}>{guardian.relationship}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardLabel}>Connection status</Text>
              <Text style={[styles.infoCardValue, { color: colors.success }]}>Connected ✓</Text>
            </View>

            {/* GUARDIAN DETAILS CTA BUTTON (es52.txt Section 12) */}
            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={() => onNavigate('guardianDetails')}
              activeOpacity={0.85}
              accessible={true}
              accessibilityLabel="View Guardian details"
            >
              <Text style={styles.detailsBtnText}>GUARDIAN DETAILS</Text>
            </TouchableOpacity>

            {/* DISCONNECT CTA BUTTON (es31.txt Section 11 & es52.txt Section 13) */}
            <TouchableOpacity
              style={styles.disconnectBtn}
              onPress={() => setShowDisconnectModal(true)}
              activeOpacity={0.85}
              accessible={true}
              accessibilityLabel="Disconnect Guardian"
            >
              <Text style={styles.disconnectBtnText}>Disconnect Guardian</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ─── 9. NO GUARDIAN CONNECTED STATE (es31.txt Section 9 & 150-166) ─── */
          <View style={styles.noGuardianBox}>
            <View style={styles.noGuardianCircle}>
              <MaterialCommunityIcons name="account-search-outline" size={54} color={colors.text.secondary} />
            </View>
            <Text style={styles.noGuardianTitle}>No Guardian connected</Text>
            <Text style={styles.noGuardianSubtitle}>
              Connect a trusted person to receive safety alerts and support your wellbeing.
            </Text>

            <TouchableOpacity
              style={styles.connectGuardianBtn}
              onPress={() => onNavigate('connectGuardian')}
              activeOpacity={0.85}
              accessible={true}
              accessibilityLabel="Connect Guardian"
            >
              <MaterialCommunityIcons name="account-plus-outline" size={20} color={colors.onPrimary} />
              <Text style={styles.connectGuardianBtnText}>CONNECT GUARDIAN</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ─── DISCONNECT CONFIRMATION MODAL (es31.txt Section 12) ─── */}
      <Modal
        visible={showDisconnectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDisconnectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.modalTitle}>Disconnect Guardian?</Text>
            <Text style={styles.modalSubtitle}>
              {guardian?.name || 'Your Guardian'} will no longer be connected to your Elder account. Safety notifications may no longer reach this Guardian.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowDisconnectModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDisconnectBtn}
                onPress={handleConfirmDisconnect}
              >
                <Text style={styles.modalDisconnectBtnText}>DISCONNECT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    marginBottom: 2,
  },
  relationshipSubText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: 12,
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
  detailsBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
    ...elevation.e1,
  },
  detailsBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  disconnectBtn: {
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.status.missed.border,
    marginTop: 10,
  },
  disconnectBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.error,
  },
  noGuardianBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noGuardianCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noGuardianTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  noGuardianSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  connectGuardianBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...elevation.e2,
  },
  connectGuardianBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    ...elevation.e3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.secondary,
  },
  modalDisconnectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: colors.status.missed.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDisconnectBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.error,
  },
});

export default GuardianInfoScreen;

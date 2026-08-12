/**
 * GuardianConnectionManagementScreen.tsx — Screen ELDER-S59 (Guardian Connection Management Screen)
 * Spec: es59.txt
 *
 * Requirements (es59.txt):
 *  1. Header: Back arrow (←), Title "Guardian Connection Management".
 *  2. Current Guardian Card (es59.txt Section 3):
 *     - Avatar Circle / Initials ("NP")
 *     - Guardian Name ("Nimal Perera")
 *     - Status Badge "✓ Connected"
 *  3. Details Section (es59.txt Section 4, 5, 6):
 *     - Connection Status: "✓ Active"
 *     - Connected Since: "August 5, 2026"
 *     - Guardian Notifications: "✓ Enabled"
 *  4. Action Buttons (es59.txt Section 8 & 9):
 *     - [ VIEW GUARDIAN DETAILS ] CTA -> navigates to guardianDetails (Screen ELDER-S53)
 *     - [ DISCONNECT GUARDIAN ] CTA -> shows confirmation modal ("Disconnect Guardian? ... Your Emergency Detection will remain available.")
 *  5. Processing & Disconnect Flow: Disconnect confirmation navigates to guardianConnectionRemoved (Screen ELDER-S60).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

export interface ActiveGuardianManagementData {
  name: string;
  relationship: string;
  connectedSince: string;
  statusText: string;
  notificationStatusText: string;
}

const DEFAULT_MANAGEMENT_DATA: ActiveGuardianManagementData = {
  name: 'Nimal Perera',
  relationship: 'Daughter',
  connectedSince: 'August 5, 2026',
  statusText: '✓ Active',
  notificationStatusText: '✓ Enabled',
};

interface GuardianConnectionManagementProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  guardianData?: ActiveGuardianManagementData;
  onDisconnectSuccess?: () => void;
}

const GuardianConnectionManagementScreen: React.FC<GuardianConnectionManagementProps> = ({
  onBack,
  onNavigate,
  guardianData = DEFAULT_MANAGEMENT_DATA,
  onDisconnectSuccess,
}) => {
  const [data] = useState<ActiveGuardianManagementData>(guardianData);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const getInitials = (nStr: string) => {
    return nStr
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleConfirmDisconnect = () => {
    setShowDisconnectModal(false);
    setIsDisconnecting(true);

    // Simulate backend disconnection authorization
    setTimeout(() => {
      setIsDisconnecting(false);
      Toast.show({
        type: 'info',
        text1: 'Guardian Disconnected',
        text2: 'The Guardian connection has been removed.',
        position: 'top',
      });

      if (onDisconnectSuccess) {
        onDisconnectSuccess();
      }

      onNavigate('guardianConnectionRemoved');
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es59.txt Section 1) ─── */}
      <ScreenHeader title="Connection Management" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── CURRENT GUARDIAN CARD (es59.txt Section 3) ─── */}
        <Text style={styles.sectionHeaderTitle}>CURRENT GUARDIAN</Text>
        <View style={styles.heroSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitialsText}>{getInitials(data.name)}</Text>
          </View>

          <Text style={styles.guardianNameText}>{data.name}</Text>

          <View style={styles.statusBadgeBox}>
            <View style={styles.greenDot} />
            <Text style={styles.statusBadgeText}>Connected</Text>
          </View>
        </View>

        {/* ─── DETAILS SECTION (es59.txt Section 4, 5, 6) ─── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>Connection</Text>
          <Text style={[styles.infoCardValue, { color: colors.success }]}>{data.statusText}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>Connected Since</Text>
          <Text style={styles.infoCardValue}>{data.connectedSince}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>Guardian Notifications</Text>
          <Text style={[styles.infoCardValue, { color: colors.success }]}>{data.notificationStatusText}</Text>
        </View>

        {/* ─── ACTION BUTTONS (es59.txt Section 8 & 9) ─── */}
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => onNavigate('guardianDetails')}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="View Guardian Details"
        >
          <Text style={styles.detailsBtnText}>VIEW GUARDIAN DETAILS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.disconnectBtn, isDisconnecting && { opacity: 0.7 }]}
          onPress={() => setShowDisconnectModal(true)}
          disabled={isDisconnecting}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Disconnect Guardian"
        >
          {isDisconnecting ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color={colors.error} />
              <Text style={styles.disconnectBtnText}>Disconnecting Guardian...</Text>
            </View>
          ) : (
            <Text style={styles.disconnectBtnText}>DISCONNECT GUARDIAN</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ─── DISCONNECT CONFIRMATION MODAL (es59.txt Section 10) ─── */}
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
              Your Guardian will no longer receive supported Guardian notifications from this connection.
            </Text>
            <View style={styles.reassurancePill}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.reassurancePillText}>Your Emergency Detection will remain available.</Text>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalKeepBtn}
                onPress={() => setShowDisconnectModal(false)}
              >
                <Text style={styles.modalKeepBtnText}>KEEP CONNECTED</Text>
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
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s5 || 20,
    paddingBottom: 110,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  heroSection: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: 20,
    marginBottom: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarInitialsText: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  guardianNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  statusBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.status.taken.border,
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusBadgeText: {
    fontSize: 13,
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
  detailsBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
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
  },
  disconnectBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.error,
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
    maxWidth: 340,
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
    marginBottom: 14,
  },
  reassurancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 14,
    padding: 10,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
  },
  reassurancePillText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalKeepBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeepBtnText: {
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: '800',
    color: colors.error,
  },
});

export default GuardianConnectionManagementScreen;

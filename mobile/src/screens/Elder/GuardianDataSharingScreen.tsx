/**
 * GuardianDataSharingScreen.tsx — Screen ELDER-S75 (Guardian Data Sharing Screen)
 * Spec: es75.txt
 *
 * Requirements (es75.txt):
 *  1. Header: Back arrow (←), Title "Guardian Data Sharing".
 *  2. Guidance Text (es75.txt Section 2):
 *     - "Your Guardian can receive important information needed to help keep you safe."
 *  3. CURRENT GUARDIAN Card (es75.txt Section 3):
 *     - Status: "✓ Guardian connected"
 *     - Guardian Name: "Dilshan" (or active connected Guardian name)
 *  4. INFORMATION SHARED Section (es75.txt Section 36-47):
 *     - Medication Alerts: "Relevant medication reminders and missed-dose information."
 *     - Safety Alerts: "Important safety-related notifications."
 *     - Emergency Alerts: "Emergency events that require Guardian attention."
 *  5. Reassurance & Disconnect (es75.txt Section 16 & 554):
 *     - "Your Guardian does not have access to all information on your device."
 *     - [ DISCONNECT GUARDIAN ] CTA button with confirmation modal.
 *  6. 100% Offline-First (es75.txt Section 20 & 506)
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
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface GuardianDataSharingProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  guardianName?: string;
}

const GuardianDataSharingScreen: React.FC<GuardianDataSharingProps> = ({
  onBack,
  onNavigate,
  guardianName = 'Dilshan',
}) => {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const handleConfirmDisconnect = () => {
    setShowDisconnectModal(false);
    Toast.show({
      type: 'info',
      text1: 'Guardian Disconnected',
      text2: 'Guardian connection removed.',
      position: 'top',
    });
    onNavigate('guardianConnectionRemoved');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es75.txt Section 1) ─── */}
      <ScreenHeader title="Guardian Data Sharing" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es75.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          Your Guardian can receive important information needed to help keep you safe.
        </Text>

        {/* ─── CURRENT GUARDIAN CARD (es75.txt Section 3) ─── */}
        <Text style={styles.sectionHeaderTitle}>CURRENT GUARDIAN</Text>
        <View style={styles.card}>
          <View style={styles.connectedBadgeBox}>
            <View style={styles.greenDot} />
            <Text style={styles.connectedBadgeText}>Guardian connected</Text>
          </View>
          <Text style={styles.guardianNameText}>{guardianName}</Text>
        </View>

        {/* ─── INFORMATION SHARED SECTION (es75.txt Section 36-47) ─── */}
        <Text style={styles.sectionHeaderTitle}>INFORMATION SHARED</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoTitle}>Medication Alerts</Text>
            <Text style={styles.infoSubtitle}>Relevant medication reminders and missed-dose information.</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoTitle}>Safety Alerts</Text>
            <Text style={styles.infoSubtitle}>Important safety-related notifications.</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoTitle}>Emergency Alerts</Text>
            <Text style={styles.infoSubtitle}>Emergency events that require Guardian attention.</Text>
          </View>
        </View>

        {/* ─── REASSURANCE NOTE (es75.txt Section 159) ─── */}
        <Text style={styles.footerNoteText}>
          Your Guardian does not have access to all information on your device.
        </Text>

        {/* ─── DISCONNECT GUARDIAN BUTTON (es75.txt Section 16 & 554) ─── */}
        <TouchableOpacity
          style={styles.disconnectBtn}
          onPress={() => setShowDisconnectModal(true)}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Disconnect Guardian"
        >
          <Text style={styles.disconnectBtnText}>DISCONNECT GUARDIAN</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── DISCONNECT CONFIRMATION MODAL (es75.txt Section 17) ─── */}
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
              Your Guardian will no longer receive Guardian alerts from this device.
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
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s4 || 16,
    paddingBottom: 110,
  },
  guidanceText: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  connectedBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    borderRadius: 14,
    paddingVertical: 3,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.status.taken.border,
    gap: 6,
    marginBottom: 8,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
  },
  connectedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.success,
  },
  guardianNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
  },
  infoRow: {
    paddingVertical: 4,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 12,
  },
  footerNoteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 4,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
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
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
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

export default GuardianDataSharingScreen;

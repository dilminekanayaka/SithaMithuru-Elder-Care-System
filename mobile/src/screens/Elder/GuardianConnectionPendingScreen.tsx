/**
 * GuardianConnectionPendingScreen.tsx — Screen ELDER-S57 (Guardian Connection Pending Screen)
 * Spec: es57.txt
 *
 * Requirements (es57.txt):
 *  1. Header: Back arrow (←), Title "Guardian Connection".
 *  2. Hero Status Presentation (es57.txt Section 3):
 *     - Hourglass Icon (⏳ / hourglass-outline)
 *     - Main Title: "Waiting for Guardian"
 *     - Subtitle: "Your connection request has been sent to your Guardian. The connection will become active after your Guardian confirms it."
 *  3. Details Section (es57.txt Section 4, 5, 6):
 *     - Guardian Name ("Nimal Perera")
 *     - Request Sent Timestamp ("Today • 10:42 AM")
 *     - Status Badge ("⏳ Waiting for confirmation")
 *  4. Primary & Secondary Actions (es57.txt Section 8 & 14):
 *     - Primary: [ CHECK STATUS ] button (≥56dp height, triggers status refresh, moves to success if accepted)
 *     - Secondary: CANCEL REQUEST (shows confirmation modal "Cancel Connection Request?")
 *  5. 100% Offline-First (Section 16): Cached status viewing supported offline.
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

export interface PendingRequestData {
  guardianName: string;
  relationship?: string;
  sentTimestamp: string;
  statusText: string;
}

const DEFAULT_PENDING_DATA: PendingRequestData = {
  guardianName: 'Nimal Perera',
  relationship: 'Daughter',
  sentTimestamp: 'Today • 10:42 AM',
  statusText: '⏳ Waiting for confirmation',
};

interface GuardianConnectionPendingProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  requestData?: PendingRequestData;
}

const GuardianConnectionPendingScreen: React.FC<GuardianConnectionPendingProps> = ({
  onBack,
  onNavigate,
  requestData = DEFAULT_PENDING_DATA,
}) => {
  const [data] = useState<PendingRequestData>(requestData);
  const [isChecking, setIsChecking] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCheckStatus = () => {
    setIsChecking(true);

    // Simulate backend status check query
    setTimeout(() => {
      setIsChecking(false);
      Toast.show({
        type: 'info',
        text1: 'Status Updated',
        text2: 'Connection request is still waiting for Guardian confirmation.',
        position: 'top',
      });
    }, 1200);
  };

  const handleConfirmCancelRequest = () => {
    setShowCancelModal(false);
    Toast.show({
      type: 'info',
      text1: 'Request Cancelled',
      text2: 'Guardian connection request has been cancelled.',
      position: 'top',
    });
    onNavigate('guardianInfo');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es57.txt Section 1) ─── */}
      <ScreenHeader title="Guardian Connection" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── HERO STATUS (es57.txt Section 3) ─── */}
        <View style={styles.heroSection}>
          <View style={styles.hourglassCircle}>
            <MaterialCommunityIcons name="hourglass-sync" size={54} color={colors.warning} />
          </View>

          <Text style={styles.mainTitleText}>Waiting for Guardian</Text>
          <Text style={styles.mainSubtitleText}>
            Your connection request has been sent to your Guardian. The connection will become active after your Guardian confirms it.
          </Text>
        </View>

        {/* ─── REQUEST DETAILS CARD (es57.txt Section 4, 5, 6) ─── */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Guardian</Text>
            <Text style={styles.detailValue}>{data.guardianName}</Text>
          </View>

          <View style={styles.dividerLine} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Request sent</Text>
            <Text style={styles.detailValue}>{data.sentTimestamp}</Text>
          </View>

          <View style={styles.dividerLine} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: colors.warning }]}>{data.statusText}</Text>
          </View>
        </View>

        {/* ─── PRIMARY & SECONDARY ACTIONS (es57.txt Section 8 & 14) ─── */}
        <TouchableOpacity
          style={[styles.checkStatusBtn, isChecking && { opacity: 0.75 }]}
          onPress={handleCheckStatus}
          disabled={isChecking}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Check status"
        >
          {isChecking ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color={colors.onPrimary} />
              <Text style={styles.checkStatusBtnText}>Checking connection...</Text>
            </View>
          ) : (
            <Text style={styles.checkStatusBtnText}>CHECK STATUS</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelRequestBtn}
          onPress={() => setShowCancelModal(true)}
          disabled={isChecking}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Cancel request"
        >
          <Text style={styles.cancelRequestBtnText}>CANCEL REQUEST</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── CANCEL CONFIRMATION MODAL (es57.txt Section 14) ─── */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.modalTitle}>Cancel Connection Request?</Text>
            <Text style={styles.modalSubtitle}>
              The pending request will no longer be available to your Guardian.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalKeepBtn}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalKeepBtnText}>KEEP REQUEST</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={handleConfirmCancelRequest}
              >
                <Text style={styles.modalCancelBtnText}>CANCEL REQUEST</Text>
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
  hourglassCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.warningContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.status.upcoming.border,
  },
  mainTitleText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  mainSubtitleText: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  detailRow: {
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  dividerLine: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 4,
  },
  checkStatusBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...elevation.e2,
  },
  checkStatusBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  cancelRequestBtn: {
    width: '100%',
    height: 52,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelRequestBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.error,
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
    fontSize: 14,
    fontWeight: '800',
    color: colors.text.secondary,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: colors.status.missed.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.error,
  },
});

export default GuardianConnectionPendingScreen;

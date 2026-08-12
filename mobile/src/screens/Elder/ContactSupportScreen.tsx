/**
 * ContactSupportScreen.tsx — Screen ELDER-S85 (Contact Support Screen)
 * Spec: es85.txt
 *
 * Requirements (es85.txt):
 *  1. Header: Back arrow (←), Title "Contact Support".
 *  2. Guidance Text (es85.txt Section 2):
 *     - "Need help with SithaMithuru? Choose a support option below."
 *  3. CONTACT SUPPORT Section (es85.txt Section 4, 5, 7):
 *     - Call Support ("Speak with the support team.") -> Opens confirmation modal / dialer
 *     - Email Support ("Send a message to the support team.") -> Opens email app action
 *  4. BEFORE CONTACTING SUPPORT Section (es85.txt Section 15):
 *     - "Please have a short description of the problem ready."
 *     - "If possible, tell the support team which screen or feature you were using."
 *  5. IMPORTANT Emergency Warning (es85.txt Section 18):
 *     - "For an immediate emergency, use the emergency options available to you instead of waiting for support."
 *  6. Offline-Aware Support (es85.txt Section 11 & 31)
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
  Linking,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface ContactSupportProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const ContactSupportScreen: React.FC<ContactSupportProps> = ({
  onBack,
  onNavigate,
}) => {
  const [showCallModal, setShowCallModal] = useState(false);
  const supportPhone = '+94112345678';
  const supportEmail = 'support@sithamithuru.org';

  const handleConfirmCall = () => {
    setShowCallModal(false);
    Linking.openURL(`tel:${supportPhone}`).catch(() => {
      Toast.show({
        type: 'info',
        text1: 'Call Support',
        text2: `Calling ${supportPhone}...`,
        position: 'top',
      });
    });
  };

  const handleEmailSupport = () => {
    Linking.openURL(`mailto:${supportEmail}?subject=SithaMithuru Support Request`).catch(() => {
      Toast.show({
        type: 'info',
        text1: 'Email Support',
        text2: `Send email to ${supportEmail}`,
        position: 'top',
      });
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es85.txt Section 1) ─── */}
      <ScreenHeader title="Contact Support" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es85.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          Need help with SithaMithuru? Choose a support option below.
        </Text>

        {/* ─── CONTACT SUPPORT SECTION (es85.txt Section 4, 5, 7) ─── */}
        <Text style={styles.sectionHeaderTitle}>CONTACT SUPPORT</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => setShowCallModal(true)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Call Support"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.navTitle}>Call Support</Text>
              <Text style={styles.navSubtitle}>Speak with the support team.</Text>
            </View>
            <MaterialCommunityIcons name="phone" size={24} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={handleEmailSupport}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Email Support"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.navTitle}>Email Support</Text>
              <Text style={styles.navSubtitle}>Send a message to the support team.</Text>
            </View>
            <MaterialCommunityIcons name="email-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ─── BEFORE CONTACTING SUPPORT SECTION (es85.txt Section 15) ─── */}
        <Text style={styles.sectionHeaderTitle}>BEFORE CONTACTING SUPPORT</Text>

        <View style={styles.card}>
          <Text style={styles.bulletText}>
            • Please have a short description of the problem ready.
          </Text>
          <Text style={[styles.bulletText, { marginTop: 10 }]}>
            • If possible, tell the support team which screen or feature you were using.
          </Text>
        </View>

        {/* ─── IMPORTANT EMERGENCY WARNING (es85.txt Section 18) ─── */}
        <Text style={styles.sectionHeaderTitle}>IMPORTANT</Text>

        <View style={styles.warningCard}>
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.warningDark} />
          <Text style={styles.warningCardText}>
            For an immediate emergency, use the emergency options available to you instead of waiting for support.
          </Text>
        </View>
      </ScrollView>

      {/* ─── CALL CONFIRMATION MODAL (es85.txt Section 5) ─── */}
      <Modal
        visible={showCallModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCallModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="phone-outline" size={48} color={colors.primary} />
            <Text style={styles.modalTitle}>Call Support?</Text>
            <Text style={styles.modalSubtitle}>
              You are about to call the SithaMithuru support team.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCallModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCallBtn}
                onPress={handleConfirmCall}
              >
                <Text style={styles.modalCallBtnText}>CALL</Text>
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
    fontSize: 20,
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  navSubtitle: {
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
  bulletText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningContainer,
    borderRadius: radius.xxl || 24,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.status.upcoming.border,
    marginBottom: 20,
  },
  warningCardText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.warningDark,
    lineHeight: 20,
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
    marginTop: 12,
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
  modalCallBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCallBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.onPrimary,
  },
});

export default ContactSupportScreen;

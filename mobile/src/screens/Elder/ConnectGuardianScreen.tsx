/**
 * ConnectGuardianScreen.tsx — Screen ELDER-S32 (Connect Guardian Screen)
 * Spec: es32.txt
 *
 * Requirements (es32.txt):
 *  1. Header: Back arrow (←), Title "Connect Guardian".
 *  2. Main Layout (es32.txt Section 3 & 671-699):
 *     - Title "Connect someone you trust"
 *     - Subtitle "Your Guardian can receive important safety alerts and support information from your account."
 *     - 6-Digit Code Input Box ("Enter 6-digit code", e.g. 482731)
 *     - Primary Action: [ CONNECT GUARDIAN ] button (≥52dp height)
 *     - "or" divider
 *     - [ Scan QR Code ] button (navigates to QR scanner flow)
 *     - Reassurance text: "Only connect people you trust."
 *  3. Guardian Found Confirmation Modal (es32.txt Section 9 & 143-158):
 *     - "Guardian found" | Avatar circle | Name ("Nimal Perera") | Relationship ("Daughter")
 *     - "Connect this Guardian?" | [ CANCEL ] [ CONNECT ]
 *  4. Code Validation & Error States (es32.txt Section 7 & 8):
 *     - Handles invalid & expired codes with user-friendly error messages
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';
import ScreenHeader from '../../components/ScreenHeader';

interface ConnectGuardianProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  token?: string;
  onSessionExpired?: () => void;
  onConnectionSuccess?: (guardianData: any) => void;
}

const ConnectGuardianScreen: React.FC<ConnectGuardianProps> = ({
  onBack,
  onNavigate,
  token,
  onSessionExpired,
  onConnectionSuccess,
}) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleConnectGuardian = async () => {
    const trimmed = code.trim();
    if (trimmed.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Please enter the code shown in your guardian\'s app.',
        position: 'top',
      });
      return;
    }

    setIsVerifying(true);
    try {
      await apiFetch('/guardian/elders/connect-code', token, {
        method: 'POST',
        body: JSON.stringify({ invite_code: trimmed }),
      });

      Toast.show({
        type: 'success',
        text1: 'Guardian Connected',
        text2: 'Your account is now linked to your guardian.',
        position: 'top',
      });

      onConnectionSuccess?.({ code: trimmed });
      onNavigate('guardianConnectionSuccess');
    } catch (err: any) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      Toast.show({
        type: 'error',
        text1: 'Could Not Connect',
        text2: err?.message || 'This code is invalid or has expired. Please check with your guardian.',
        position: 'top',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es32.txt Section 1) ─── */}
      <ScreenHeader title="Connect Guardian" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── TITLE & REASSURANCE (es32.txt Section 3) ─── */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitleText}>Connect someone you trust</Text>
          <Text style={styles.mainSubtitleText}>
            Your Guardian can receive important safety alerts and support information from your account.
          </Text>
        </View>

        {/* ─── GUARDIAN CODE INPUT ─── */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Guardian Code</Text>
          <View style={styles.codeInputBox}>
            <TextInput
              style={styles.codeInputText}
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8))}
              placeholder="Enter code from your guardian"
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="characters"
              maxLength={8}
            />
          </View>
        </View>

        {/* ─── CONNECT GUARDIAN CTA ─── */}
        <TouchableOpacity
          style={[styles.connectBtn, isVerifying && { opacity: 0.7 }]}
          onPress={handleConnectGuardian}
          disabled={isVerifying}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Connect Guardian"
        >
          {isVerifying ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.connectBtnText}>CONNECT GUARDIAN</Text>
          )}
        </TouchableOpacity>

        {/* ─── OR DIVIDER (es32.txt Section 3 & 693) ─── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ─── SCAN QR CODE CTA (es32.txt Section 18 & 695) ─── */}
        <TouchableOpacity
          style={styles.scanQrBtn}
          onPress={() => onNavigate('scanGuardianQr')}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Scan QR Code"
        >
          <MaterialCommunityIcons name="qrcode-scan" size={22} color={colors.primary} />
          <Text style={styles.scanQrBtnText}>Scan QR Code</Text>
        </TouchableOpacity>

        <Text style={styles.trustWarningText}>Only connect people you trust.</Text>
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
  titleSection: {
    marginBottom: spacing.s5 || 20,
  },
  mainTitleText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  mainSubtitleText: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: spacing.s5 || 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  codeInputBox: {
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: radius.xl || 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  codeInputText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 2,
    padding: 0,
  },
  connectBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s5 || 20,
    ...elevation.e2,
  },
  connectBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s5 || 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.outline,
  },
  dividerText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '700',
  },
  scanQrBtn: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    gap: 8,
    marginBottom: 20,
    ...elevation.e1,
  },
  scanQrBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  trustWarningText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: '600',
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
    marginBottom: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitialsText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  previewNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  previewRelationText: {
    fontSize: 15,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalQuestionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
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
  modalConnectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConnectBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
});

export default ConnectGuardianScreen;

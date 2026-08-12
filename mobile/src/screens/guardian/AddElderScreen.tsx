/**
 * AddElderScreen.tsx — Screen G08 (Authentication / Onboarding Module — Pair Elder)
 * Spec: g08.txt
 *
 * Guardian generates a real, time-limited invite code + QR (via
 * POST /guardian/elders/generate-invite) and shows it to their elder. The elder
 * scans it (ScanGuardianQrScreen) or types the code manually (ConnectGuardianScreen),
 * which calls POST /guardian/elders/connect-code as the Elder to complete the link.
 * This screen polls the guardian's linked-elder list so it can detect the link
 * completing and advance automatically, rather than claiming success it hasn't verified.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

interface PairElderScreenProps {
  onBack: () => void;
  token?: string;
  onSessionExpired?: () => void;
  onSuccess?: () => void;
}

const POLL_INTERVAL_MS = 4000;

const PairElderScreen: React.FC<PairElderScreenProps> = ({
  onBack,
  token = '',
  onSessionExpired,
  onSuccess,
}) => {
  const [loading, setLoading]         = useState(true);
  const [inviteCode, setInviteCode]   = useState<string | null>(null);
  const [qrPayload, setQrPayload]     = useState<string | null>(null);
  const [expiresAt, setExpiresAt]     = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [linked, setLinked]           = useState(false);
  const initialElderCountRef = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateCode = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/guardian/elders/generate-invite', token, { method: 'POST' });
      setInviteCode(res?.invite_code || null);
      setQrPayload(res?.qr_payload || null);
      setExpiresAt(res?.expires_at || null);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      Toast.show({ type: 'error', text1: 'Could Not Generate Code', text2: 'Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [token, onSessionExpired]);

  useEffect(() => {
    generateCode();
  }, [generateCode]);

  // Detect the link completing by polling the guardian's own elder list — the
  // Elder-side scan/entry hits a separate device, so this screen has no other
  // way to know the pairing finished.
  useEffect(() => {
    let cancelled = false;

    const startPolling = async () => {
      try {
        const initial = await apiFetch('/guardian/elders', token);
        if (cancelled) return;
        initialElderCountRef.current = Array.isArray(initial) ? initial.length : 0;
      } catch {
        initialElderCountRef.current = 0;
      }

      pollRef.current = setInterval(async () => {
        try {
          const res = await apiFetch('/guardian/elders', token);
          const count = Array.isArray(res) ? res.length : 0;
          if (initialElderCountRef.current !== null && count > initialElderCountRef.current) {
            if (pollRef.current) clearInterval(pollRef.current);
            setLinked(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show({ type: 'success', text1: 'Elder Linked Successfully', text2: 'Your elder scanned the code and is now connected.' });
            setTimeout(() => {
              if (onSuccess) onSuccess();
              else onBack();
            }, 1200);
          }
        } catch {
          // Transient network errors during polling are not fatal — just retry next tick.
        }
      }, POLL_INTERVAL_MS);
    };

    startPolling();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRegenerate = () => {
    Haptics.selectionAsync();
    generateCode();
  };

  const formattedCode = inviteCode
    ? inviteCode.length > 4
      ? `${inviteCode.slice(0, Math.ceil(inviteCode.length / 2))}-${inviteCode.slice(Math.ceil(inviteCode.length / 2))}`
      : inviteCode
    : '';

  const expiresLabel = expiresAt
    ? new Date(expiresAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent />

      {/* HEADER BAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTag}>ONBOARDING STEP 5 OF 5</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO ICON & TITLES */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="account-network-outline" size={54} color={colors.primary} />
          </View>
          <Text style={styles.title}>Connect With Your Elder</Text>
          <Text style={styles.subtitle}>
            Show this code to your elder — they'll scan it (or type it in) from their app to link your accounts.
          </Text>
        </View>

        {/* QR CODE CARD */}
        <View style={styles.qrCard}>
          {loading ? (
            <View style={styles.qrLoadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : linked ? (
            <View style={styles.qrLoadingBox}>
              <MaterialCommunityIcons name="check-circle" size={64} color={colors.primary} />
              <Text style={styles.linkedText}>Elder Linked!</Text>
            </View>
          ) : qrPayload ? (
            <View style={styles.qrBox}>
              <QRCode value={qrPayload} size={200} backgroundColor={colors.surface} color={colors.text.primary} />
            </View>
          ) : (
            <View style={styles.qrLoadingBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={40} color={colors.text.tertiary} />
              <Text style={styles.linkedText}>Could not load code</Text>
            </View>
          )}

          {!loading && !linked && inviteCode && (
            <>
              <Text style={styles.codeLabel}>OR TYPE THIS CODE</Text>
              <Text style={styles.codeText}>{formattedCode}</Text>
              {expiresLabel && <Text style={styles.expiresText}>Expires at {expiresLabel}</Text>}
            </>
          )}
        </View>

        {!loading && !linked && (
          <TouchableOpacity style={styles.regenerateBtn} onPress={handleRegenerate}>
            <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />
            <Text style={styles.regenerateText}>Generate New Code</Text>
          </TouchableOpacity>
        )}

        {!linked && (
          <View style={styles.waitingRow}>
            <ActivityIndicator size="small" color={colors.text.tertiary} />
            <Text style={styles.waitingText}>Waiting for your elder to connect…</Text>
          </View>
        )}

        {/* NEED HELP / HOW TO PAIR LINK */}
        <TouchableOpacity style={styles.helpRow} onPress={() => setShowHelpModal(true)}>
          <MaterialCommunityIcons name="help-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.helpText}>How do I pair with my elder?</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* HOW TO PAIR HELP MODAL */}
      <Modal visible={showHelpModal} transparent animationType="slide" onRequestClose={() => setShowHelpModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pairing Instructions</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.guideStep}>
              <Text style={styles.stepNum}>1</Text>
              <Text style={styles.guideText}>Open SithaMithuru Elder App on your elder's smartphone.</Text>
            </View>
            <View style={styles.guideStep}>
              <Text style={styles.stepNum}>2</Text>
              <Text style={styles.guideText}>Tap "Scan Guardian QR Code" on their onboarding or settings screen.</Text>
            </View>
            <View style={styles.guideStep}>
              <Text style={styles.stepNum}>3</Text>
              <Text style={styles.guideText}>Scan the QR code above, or type the code shown beneath it.</Text>
            </View>
            <View style={styles.guideStep}>
              <Text style={styles.stepNum}>4</Text>
              <Text style={styles.guideText}>This screen will automatically continue once your elder confirms the link.</Text>
            </View>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowHelpModal(false)}>
              <Text style={styles.closeModalBtnText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: {
    padding: spacing.s1,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.s6,
    paddingVertical: spacing.s5,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.s5,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s3,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e2,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
  qrCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingVertical: spacing.s6,
    paddingHorizontal: spacing.s5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: spacing.s5,
    ...elevation.e2,
  },
  qrBox: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.s4,
  },
  qrLoadingBox: {
    height: 200,
    width: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  linkedText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 1,
  },
  codeText: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: 3,
    marginTop: 4,
  },
  expiresText: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 6,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: spacing.s4,
  },
  regenerateText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.s5,
  },
  waitingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  helpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  helpText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.s6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text.primary,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.s3,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    color: colors.primary,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
  },
  guideText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  closeModalBtn: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.s4,
  },
  closeModalBtnText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
});

export default PairElderScreen;

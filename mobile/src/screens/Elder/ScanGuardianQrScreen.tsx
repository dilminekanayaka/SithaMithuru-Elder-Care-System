/**
 * ScanGuardianQrScreen.tsx — Screen ELDER-S33 (Scan Guardian QR Code Screen)
 * Spec: es33.txt
 *
 * Real camera-based QR scanner (expo-camera). The elder scans the QR code their
 * guardian is shown on AddElderScreen (payload: {type:'SITHAMITHURU_INVITE',
 * guardianId, code}), then this screen calls POST /guardian/elders/connect-code
 * as the Elder to complete the real link — no data is fabricated or simulated.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';
import ScreenHeader from '../../components/ScreenHeader';

interface ScanGuardianQrProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  token?: string;
  onSessionExpired?: () => void;
  onConnectionSuccess?: (guardianData: any) => void;
}

const ScanGuardianQrScreen: React.FC<ScanGuardianQrProps> = ({
  onBack,
  onNavigate,
  token,
  onSessionExpired,
  onConnectionSuccess,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isVerifying, setIsVerifying] = useState(false);
  const scannedRef = useRef(false);

  const connectWithCode = async (code: string) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setIsVerifying(true);
    try {
      await apiFetch('/guardian/elders/connect-code', token, {
        method: 'POST',
        body: JSON.stringify({ invite_code: code }),
      });

      Toast.show({
        type: 'success',
        text1: 'Guardian Connected',
        text2: 'Your account is now linked to your guardian.',
        position: 'top',
      });

      onConnectionSuccess?.({ code });
      onNavigate('guardianConnectionSuccess');
    } catch (err: any) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      Toast.show({
        type: 'error',
        text1: 'Could Not Connect',
        text2: err?.message || 'This code is invalid or has expired. Ask your guardian for a new one.',
      });
      scannedRef.current = false;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scannedRef.current) return;
    try {
      const parsed = JSON.parse(result.data);
      if (parsed?.type === 'SITHAMITHURU_INVITE' && parsed?.code) {
        connectWithCode(String(parsed.code));
      } else {
        Toast.show({ type: 'error', text1: 'Not a Guardian QR Code', text2: 'Please scan the code shown in your guardian\'s app.' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Unrecognized QR Code', text2: 'Please scan the code shown in your guardian\'s app.' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER ─── */}
      <ScreenHeader title="Scan Guardian QR" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.mainTitleText}>Scan your Guardian's QR code</Text>

        {!permission ? (
          <View style={styles.permissionBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !permission.granted ? (
          /* ─── CAMERA PERMISSION REQUIRED ─── */
          <View style={styles.permissionBox}>
            <MaterialCommunityIcons name="camera-off-outline" size={54} color={colors.text.secondary} />
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionSubtitle}>
              Allow camera access to scan your Guardian's QR code.
            </Text>

            <TouchableOpacity
              style={styles.allowCameraBtn}
              onPress={() => requestPermission()}
              activeOpacity={0.85}
            >
              <Text style={styles.allowCameraBtnText}>ALLOW CAMERA</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ─── REAL CAMERA SCANNER VIEWFINDER ─── */
          <View style={styles.scannerContainer}>
            <View style={styles.scannerFrame}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={isVerifying ? undefined : handleBarcodeScanned}
              />

              <View style={styles.scannerCornerTL} pointerEvents="none" />
              <View style={styles.scannerCornerTR} pointerEvents="none" />
              <View style={styles.scannerCornerBL} pointerEvents="none" />
              <View style={styles.scannerCornerBR} pointerEvents="none" />

              {isVerifying && (
                <View style={styles.verifyingOverlay} pointerEvents="none">
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.verifyingText}>Connecting to guardian...</Text>
                </View>
              )}
            </View>

            <Text style={styles.instructionText}>Place the QR code inside the frame.</Text>
          </View>
        )}

        {/* ─── MANUAL CODE ALTERNATIVE ─── */}
        <TouchableOpacity
          style={styles.manualCodeBtn}
          onPress={() => onNavigate('connectGuardian')}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Enter code manually"
        >
          <MaterialCommunityIcons name="keyboard-outline" size={20} color={colors.primary} />
          <Text style={styles.manualCodeBtnText}>Enter code manually</Text>
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
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s5 || 20,
    paddingBottom: 110,
    alignItems: 'center',
  },
  mainTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  scannerContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  scannerFrame: {
    width: 240,
    height: 240,
    backgroundColor: '#000',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.outline,
    position: 'relative',
    overflow: 'hidden',
    ...elevation.e2,
  },
  scannerCornerTL: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: colors.primary,
  },
  scannerCornerTR: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.primary,
  },
  scannerCornerBL: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: colors.primary,
  },
  scannerCornerBR: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.primary,
  },
  verifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  verifyingText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 16,
    textAlign: 'center',
  },
  permissionBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 12,
    marginBottom: 6,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  allowCameraBtn: {
    height: 48,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allowCameraBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  manualCodeBtn: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    gap: 8,
    ...elevation.e1,
  },
  manualCodeBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
});

export default ScanGuardianQrScreen;

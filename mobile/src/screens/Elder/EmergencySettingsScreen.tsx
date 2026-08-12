/**
 * EmergencySettingsScreen.tsx — Screen ELDER-S26 (Emergency Detection Settings Screen)
 * Spec: es26.txt
 *
 * Requirements (es26.txt):
 *  1. Header: Back arrow (←), Title "Emergency Settings".
 *  2. Detection Toggle (es26.txt Section 3 & 4):
 *     - Detection Active [ ON / OFF ] switch (Default: ON).
 *     - Confirmation modal required before turning OFF ("Turn off emergency detection? Your phone will no longer listen for your emergency word.")
 *  3. Microphone Status Card (es26.txt Section 6): "Microphone access: Allowed ✓".
 *  4. Emergency Word Config Card (es26.txt Section 9, 10, 12): "Emergency Word: Sinhala / Tamil / English Configured ✓".
 *  5. Test Detection Action (es26.txt Section 14 & 15): "Test emergency detection >" (Simulates test mode without notifying Guardian).
 *  6. About & How It Works Section (es26.txt Section 23 & 24):
 *     - Step-by-step local detection explanation.
 *     - Privacy reassurance: "Audio processed locally on device, no continuous recording stored."
 *  7. 100% Offline-First
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Switch,
  Modal,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface EmergencySettingsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const EmergencySettingsScreen: React.FC<EmergencySettingsProps> = ({ onBack, onNavigate }) => {
  const [detectionEnabled, setDetectionEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<'Sinhala' | 'Tamil' | 'English'>('Sinhala');

  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleToggleDetection = (newValue: boolean) => {
    if (!newValue) {
      setShowDisableModal(true);
    } else {
      setDetectionEnabled(true);
      Toast.show({
        type: 'success',
        text1: 'Detection Activated',
        text2: 'Emergency keyword detection is active.',
        position: 'top',
      });
    }
  };

  const handleConfirmDisable = () => {
    setDetectionEnabled(false);
    setShowDisableModal(false);
    Toast.show({
      type: 'info',
      text1: 'Detection Disabled ⚠️',
      text2: 'Your phone will no longer listen for emergency words.',
      position: 'top',
    });
  };

  const handleRunTest = () => {
    setShowTestModal(true);
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      setTestResult('Test successful! Emergency keyword detected locally.');
    }, 2500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es26.txt Section 1) ─── */}
      <ScreenHeader title="Emergency Settings" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── SECTION 1: EMERGENCY DETECTION TOGGLE (es26.txt Section 3, 4, 5) ─── */}
        <Text style={styles.sectionHeader}>EMERGENCY DETECTION</Text>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitleText}>Detection Status</Text>
            <Text
              style={[
                styles.cardSubtitleText,
                { color: detectionEnabled ? colors.success : colors.error },
              ]}
            >
              {detectionEnabled ? 'Active ✓' : 'Disabled ⚠️'}
            </Text>
          </View>
          <Switch
            value={detectionEnabled}
            onValueChange={handleToggleDetection}
            trackColor={{ false: colors.outline, true: colors.successContainer }}
            thumbColor={detectionEnabled ? colors.success : colors.text.tertiary}
          />
        </View>

        {/* ─── SECTION 2: MICROPHONE ACCESS (es26.txt Section 6) ─── */}
        <Text style={styles.sectionHeader}>MICROPHONE</Text>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons name="microphone-check" size={24} color={colors.success} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardTitleText}>Microphone Access</Text>
            <Text style={[styles.cardSubtitleText, { color: colors.success }]}>Allowed ✓</Text>
          </View>
        </View>

        {/* ─── SECTION 3: EMERGENCY WORD CONFIG (es26.txt Section 9, 10, 12) ─── */}
        <Text style={styles.sectionHeader}>EMERGENCY WORD</Text>
        <View style={styles.cardBox}>
          <View style={styles.languageHeaderRow}>
            <MaterialCommunityIcons name="translate" size={22} color={colors.primary} />
            <Text style={styles.cardTitleText}>Configured Language</Text>
          </View>
          <View style={styles.langChipRow}>
            {(['Sinhala', 'Tamil', 'English'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langChip,
                  selectedLanguage === lang && styles.langChipSelected,
                ]}
                onPress={() => setSelectedLanguage(lang)}
              >
                <Text
                  style={[
                    styles.langChipText,
                    selectedLanguage === lang && styles.langChipTextSelected,
                  ]}
                >
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.langHelpText}>
            Configured ✓ (Supported by local TensorFlow Lite model)
          </Text>
        </View>

        {/* ─── SECTION 4: TEST DETECTION (es26.txt Section 14 & 15) ─── */}
        <Text style={styles.sectionHeader}>TEST DETECTION</Text>
        <TouchableOpacity
          style={styles.cardRowBtn}
          onPress={() => onNavigate('testEmergencyDetection')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="flask-outline" size={22} color={colors.primary} />
          <Text style={[styles.cardTitleText, { flex: 1, marginLeft: 10 }]}>
            Test emergency detection
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        {/* ─── SECTION 5: ABOUT & PRIVACY (es26.txt Section 23 & 24) ─── */}
        <Text style={styles.sectionHeader}>ABOUT EMERGENCY DETECTION</Text>
        <TouchableOpacity
          style={styles.cardRowBtn}
          onPress={() => onNavigate('emergencySafetyGuide')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="information-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardTitleText}>How it works</Text>
            <Text style={styles.cardSubtitleText}>Offline protection & privacy information</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        <View style={styles.privacyNoteBox}>
          <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.success} />
          <Text style={styles.privacyNoteText}>
            Audio is processed locally on device. No continuous recording is stored or sent to external servers.
          </Text>
        </View>
      </ScrollView>

      {/* ─── DISABLE CONFIRMATION MODAL (es26.txt Section 4) ─── */}
      <Modal
        visible={showDisableModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDisableModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.modalTitle}>Turn off emergency detection?</Text>
            <Text style={styles.modalSubtitle}>
              Your phone will no longer listen for your emergency word.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalKeepBtn}
                onPress={() => setShowDisableModal(false)}
              >
                <Text style={styles.modalKeepBtnText}>KEEP ON</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalTurnOffBtn}
                onPress={handleConfirmDisable}
              >
                <Text style={styles.modalTurnOffBtnText}>TURN OFF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── HOW IT WORKS MODAL (es26.txt Section 24) ─── */}
      <Modal
        visible={showHowItWorksModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHowItWorksModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>How Detection Works</Text>
            <ScrollView style={{ maxHeight: 240, width: '100%', marginVertical: 12 }}>
              <Text style={styles.stepText}>1. Phone listens locally for your emergency word.</Text>
              <Text style={styles.stepText}>2. Audio is processed directly on your device.</Text>
              <Text style={styles.stepText}>3. Trained ML model detects keyword probability.</Text>
              <Text style={styles.stepText}>4. 5-second confirmation countdown allows cancelling false alarms.</Text>
              <Text style={styles.stepText}>5. If confirmed, Guardian is notified with your GPS details.</Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowHowItWorksModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>GOT IT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── TEST MODE MODAL (es26.txt Section 15) ─── */}
      <Modal
        visible={showTestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.testBadge}>TEST MODE</Text>
            {isTesting ? (
              <>
                <MaterialCommunityIcons name="microphone-wave" size={48} color={colors.primary} />
                <Text style={styles.modalTitle}>Say your emergency word now</Text>
                <Text style={styles.modalSubtitle}>Listening locally on device...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle-outline" size={48} color={colors.success} />
                <Text style={styles.modalTitle}>Test Successful 🎉</Text>
                <Text style={styles.modalSubtitle}>{testResult}</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowTestModal(false)}
                >
                  <Text style={styles.modalCloseBtnText}>DONE</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <BottomNavBar activeTab="sos" onNavigate={onNavigate} />
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl || 20,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  cardRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl || 20,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  cardBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl || 20,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  cardTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  cardSubtitleText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  languageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  langChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  langChip: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langChipSelected: {
    backgroundColor: colors.primary,
  },
  langChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  langChipTextSelected: {
    color: colors.onPrimary,
  },
  langHelpText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  privacyNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    borderRadius: radius.lg || 16,
    padding: 14,
    marginTop: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.status.taken.border,
  },
  privacyNoteText: {
    flex: 1,
    fontSize: 13,
    color: colors.successDark,
    lineHeight: 18,
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
  modalKeepBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeepBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  modalTurnOffBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: colors.status.missed.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTurnOffBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.error,
  },
  modalCloseBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  stepText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: 8,
  },
  testBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
});

export default EmergencySettingsScreen;

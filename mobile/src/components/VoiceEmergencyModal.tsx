import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Vibration,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';

interface VoiceEmergencyModalProps {
  visible: boolean;
  detectedKeyword: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const VoiceEmergencyModal: React.FC<VoiceEmergencyModalProps> = ({
  visible,
  detectedKeyword,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(5);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    let timer: any = null;

    if (visible) {
      setCountdown(5);
      Vibration.vibrate([0, 400, 200, 400], true);

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            Vibration.cancel();
            onConfirm(); // Auto-confirm when timer hits 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      Vibration.cancel();
    }

    return () => {
      if (timer) clearInterval(timer);
      Vibration.cancel();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Animated.View
            style={[
              styles.warningCircle,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <MaterialCommunityIcons name="microphone-alert" size={48} color={colors.onPrimary} />
          </Animated.View>

          <Text style={styles.title}>🚨 Emergency Keyword Detected!</Text>
          
          <View style={styles.keywordChip}>
            <Text style={styles.keywordText}>"{detectedKeyword}"</Text>
          </View>

          <Text style={styles.subText}>
            Sending emergency SOS alert to guardian in
          </Text>

          <Text style={styles.timerText}>{countdown}s</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                Vibration.cancel();
                onCancel();
              }}
            >
              <Text style={styles.cancelText}>Cancel (False Alarm)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => {
                Vibration.cancel();
                onConfirm();
              }}
            >
              <Text style={styles.confirmText}>Send SOS Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  warningCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: colors.errorContainer,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  keywordChip: {
    backgroundColor: '#FFF0F0',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD0D0',
    marginBottom: 12,
  },
  keywordText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.error,
  },
  subText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.error,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F2F4F8',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCDFE6',
  },
  cancelText: {
    color: '#606266',
    fontWeight: '700',
    fontSize: 13,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
  },
  confirmText: {
    color: colors.onPrimary,
    fontWeight: '800',
    fontSize: 13,
  },
});

export default VoiceEmergencyModal;

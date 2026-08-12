import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Rect, Path } from 'react-native-svg';
import { colors } from '../theme';

interface QRCodeModalProps {
  visible: boolean;
  guardianEmail: string;
  guardianName: string;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  visible,
  guardianEmail,
  guardianName,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <MaterialCommunityIcons name="qrcode-scan" size={36} color={colors.primary} />
            <Text style={styles.title}>Scan to Link Elder</Text>
            <Text style={styles.subtitle}>
              Show this QR code to your elder's app to instantly link accounts
            </Text>
          </View>

          {/* QR Code Container */}
          <View style={styles.qrContainer}>
            <View style={styles.qrBox}>
              <MaterialCommunityIcons name="qrcode" size={160} color={colors.text.primary} />
            </View>
            <Text style={styles.guardianName}>{guardianName}</Text>
            <Text style={styles.emailBadge}>{guardianEmail}</Text>
          </View>

          <Text style={styles.instructions}>
            Elder can scan this QR code from Profile ➔ Link Guardian in their SithaMithuru app.
          </Text>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 10,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 16,
    width: '100%',
  },
  qrBox: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 12,
  },
  guardianName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  emailBadge: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  instructions: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
});

export default QRCodeModal;

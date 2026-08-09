import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppText from './AppText';
import { colors, radius, spacing, elevation } from '../theme';

interface VoiceDictationModalProps {
  visible: boolean;
  onClose: () => void;
  onTextDictated: (text: string) => void;
  fieldType: 'medication' | 'dosage' | 'journal_title' | 'journal_content' | 'task';
  fieldName: string;
}

export const VoiceDictationModal: React.FC<VoiceDictationModalProps> = ({
  visible,
  onClose,
  onTextDictated,
  fieldType,
  fieldName,
}) => {
  const [transcribingText, setTranscribingText] = useState('');
  const [isListening, setIsListening] = useState(true);
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Templates based on fieldType
  const templates: Record<string, string[]> = {
    medication: [
      'Metformin 500mg',
      'Atorvastatin 20mg',
      'Panadol 1g',
      'Losartan 50mg',
      'Aspirin 100mg',
      'Multivitamin',
    ],
    dosage: [
      '1 pill after lunch / දිවා ආහාරයෙන් පසු පෙති 1ක්',
      '2 pills before breakfast / උදේ ආහාරයට පෙර පෙති 2ක්',
      '1 pill at night / රාත්‍රියට පෙති 1ක්',
      'Take with water / ජලය සමඟ ගන්න',
      'Apply ointment / ආලේපනය ගල්වන්න',
    ],
    journal_title: [
      'A beautiful morning / සුන්දර උදෑසනක්',
      'Garden work / වත්තේ වැඩ කිරීම',
      'Had tea with family / පවුලේ අය සමඟ තේ බීම',
      'A peaceful evening walk / නිදහස් සන්ධ්‍යා ඇවිදීම',
    ],
    journal_content: [
      'Today I woke up feeling very energetic. I had tea and watered the roses in my garden.',
      'අද මම ඉතා සුවයෙන් අවදි වුණෙමි. වත්තේ පැළ වලට වතුර දමා නිදහසේ කාලය ගත කළෙමි.',
      'Spent a lovely afternoon talking to my grandchildren. I feel healthy and happy today.',
      'අද සිරුරට මදක් විඩාව දැනේ. සවස් කාලයේ විවේකීව පොතක් කියවමින් සිටියෙමි.',
    ],
    task: [
      'Walk in the garden for 15 mins / විනාඩි 15ක් වත්තේ ඇවිදීම',
      'Drink 2 glasses of water / වතුර වීදුරු 2ක් බීම',
      'Check blood pressure / රුධිර පීඩනය පරීක්ෂා කිරීම',
      'Read morning newspaper / පුවත්පත කියවීම',
      'Evening exercises / සන්ධ්‍යා ව්‍යායාම',
    ],
  };

  const fieldTemplates = templates[fieldType] || [];

  useEffect(() => {
    if (visible) {
      setTranscribingText('');
      setIsListening(true);
      
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Simulate transcription after delay
      const timer = setTimeout(() => {
        if (fieldTemplates.length > 0) {
          const randomPhrase = fieldTemplates[0].split(' / ')[0];
          setTranscribingText(randomPhrase);
          setIsListening(false);
        }
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleSelectTemplate = (text: string) => {
    const cleanText = text.split(' / ')[0];
    setTranscribingText(cleanText);
    setIsListening(false);
  };

  const handleConfirm = () => {
    onTextDictated(transcribingText);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          
          {/* Header */}
          <View style={styles.header}>
            <AppText style={styles.headerTitle} isHeader>Voice Input / හඬ ආදානය</AppText>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close voice modal" accessibilityRole="button">
              <MaterialCommunityIcons name="close" size={28} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Listening Indicator */}
          <View style={styles.micSection}>
            <Animated.View
              style={[
                styles.pulseCircle,
                {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: isListening ? colors.primaryContainer : colors.successContainer,
                },
              ]}
            >
              <View
                style={[
                  styles.innerCircle,
                  { backgroundColor: isListening ? colors.primary : colors.successDark },
                ]}
              >
                <MaterialCommunityIcons
                  name={isListening ? 'microphone' : 'microphone-check'}
                  size={36}
                  color="#FFFFFF"
                />
              </View>
            </Animated.View>
            <AppText style={styles.statusText}>
              {isListening ? 'Listening... Speak now / කතා කරන්න...' : 'Speech Detected / හඬ හඳුනාගත්තා'}
            </AppText>
          </View>

          {/* Real-time speech display */}
          <View style={styles.speechOutputContainer}>
            <AppText style={styles.speechOutputText}>
              {transcribingText || 'Speak or choose from templates below...'}
            </AppText>
          </View>

          {/* Quick-Dictate Templates */}
          <View style={styles.templateSection}>
            <AppText style={styles.sectionLabel}>Tap a template to input / පහතින් තෝරන්න:</AppText>
            <ScrollView
              style={styles.templateList}
              contentContainerStyle={styles.templateListContent}
              nestedScrollEnabled
            >
              {fieldTemplates.map((template, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.templateBtn}
                  onPress={() => handleSelectTemplate(template)}
                  accessibilityRole="button"
                  accessibilityLabel={template}
                >
                  <AppText style={styles.templateText}>{template}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtnCancel} onPress={onClose} accessibilityRole="button">
              <AppText style={styles.cancelBtnText}>Cancel / අවලංගු කරන්න</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtnConfirm, !transcribingText && styles.disabledBtn]}
              onPress={handleConfirm}
              disabled={!transcribingText}
              accessibilityRole="button"
            >
              <AppText style={styles.confirmBtnText}>Use This / යොදන්න</AppText>
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
    backgroundColor: 'rgba(26, 35, 50, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.s5,
    maxHeight: '85%',
    ...elevation.e4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeBtn: {
    padding: spacing.s1,
  },
  micSection: {
    alignItems: 'center',
    marginVertical: spacing.s4,
  },
  pulseCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  statusText: {
    marginTop: spacing.s3,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  speechOutputContainer: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.xl,
    padding: spacing.s4,
    minHeight: 80,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: spacing.s4,
  },
  speechOutputText: {
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '500',
    lineHeight: 24,
  },
  templateSection: {
    marginBottom: spacing.s5,
    maxHeight: 180,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginBottom: spacing.s2,
  },
  templateList: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    backgroundColor: '#FAFBFD',
  },
  templateListContent: {
    padding: spacing.s2,
    gap: spacing.s2,
  },
  templateBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.s3,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    minHeight: 48,
    justifyContent: 'center',
  },
  templateText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.s3,
  },
  actionBtnCancel: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.lg,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.secondary,
  },
  actionBtnConfirm: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e2,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onPrimary,
  },
  disabledBtn: {
    backgroundColor: colors.text.disabled,
    elevation: 0,
  },
});

export default VoiceDictationModal;

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Text from '../../components/AppText';
import AccessibleButton from '../../components/AccessibleButton';
import OversizedTimePicker from '../../components/OversizedTimePicker';
import VoiceDictationModal from '../../components/VoiceDictationModal';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

interface ElderAddMedicationProps {
  onBack: () => void;
  token: string;
  elderId: string;
  onSave?: () => void;
  onSessionExpired?: () => void;
}

const AddMedicationScreen: React.FC<ElderAddMedicationProps> = ({
  onBack,
  token,
  elderId,
  onSave,
  onSessionExpired,
}) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const d = new Date();
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  });
  const [saving, setSaving] = useState(false);
  const [dictationVisible, setDictationVisible] = useState(false);
  const [dictationField, setDictationField] = useState<'medication' | 'dosage'>('medication');

  // M-03: Load local draft form on mount
  React.useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const draft = await AsyncStorage.getItem('draft_add_medication');
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed.name) setName(parsed.name);
          if (parsed.dosage) setDosage(parsed.dosage);
        }
      } catch (e) {}
    })();
  }, []);

  // M-03: Auto-save draft inputs on change
  React.useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        if (name.trim() || dosage.trim()) {
          await AsyncStorage.setItem('draft_add_medication', JSON.stringify({ name, dosage }));
        }
      } catch (e) {}
    })();
  }, [name, dosage]);

  const formatTime = (date: Date): string => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Oops / පොඩ්ඩක් ඉන්න',
        text2: 'Please enter a medicine name before saving. / සුරැකීමට පෙර කරුණාකර ඖෂධයේ නම ඇතුළත් කරන්න.',
        position: 'top',
      });
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/medications', token, {
        method: 'POST',
        body: JSON.stringify({
          elderId: elderId,
          name: name.trim(),
          dosage: dosage.trim() || null,
          time_schedule: formatTime(selectedTime),
        }),
      });

      Toast.show({
        type: 'success',
        text1: 'Medicine Added / ඖෂධය ඇතුළත් කළා',
        text2: `${name.trim()} set for ${formatTime(selectedTime)}`,
        position: 'top',
      });

      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem('draft_add_medication');
      } catch (e) {}

      if (onSave) onSave();
      else onBack();
    } catch (error: any) {
      if (error instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Could not add medicine.',
        position: 'top',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTextDictated = (text: string) => {
    if (dictationField === 'medication') {
      setName(text);
    } else {
      setDosage(text);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <AccessibleButton
          onPress={onBack}
          style={styles.backBtn}
          accessibilityLabel="Back / ආපසු"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={32} color={colors.text.primary} />
        </AccessibleButton>
        <Text style={styles.headerTitle} isHeader>Add My Medicine</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="pill" size={36} color={colors.category.medicine.accent} />
          </View>

          <Text style={styles.title} isHeader>නව ඖෂධයක් එක් කරන්න</Text>
          <Text style={styles.subtitle}>
            Enter the name of your medicine and when you need to take it.
          </Text>

          <Text style={styles.label}>Medicine Name / ඖෂධයේ නම *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Metformin 500mg"
              placeholderTextColor={colors.text.disabled}
              value={name}
              onChangeText={setName}
              accessibilityLabel="Medicine name input"
              accessibilityRole="text"
            />
            <AccessibleButton
              style={styles.micInputBtn}
              onPress={() => {
                setDictationField('medication');
                setDictationVisible(true);
              }}
              accessibilityLabel="Dictate medicine name using voice"
              accessibilityRole="button"
              accessibilityHint="Opens voice input dictation helper"
            >
              <MaterialCommunityIcons name="microphone" size={28} color={colors.primary} />
            </AccessibleButton>
          </View>

          <Text style={styles.label}>Dosage / මාත්‍රාව (Optional)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1 pill after lunch"
              placeholderTextColor={colors.text.disabled}
              value={dosage}
              onChangeText={setDosage}
              accessibilityLabel="Dosage input"
              accessibilityRole="text"
            />
            <AccessibleButton
              style={styles.micInputBtn}
              onPress={() => {
                setDictationField('dosage');
                setDictationVisible(true);
              }}
              accessibilityLabel="Dictate dosage using voice"
              accessibilityRole="button"
              accessibilityHint="Opens voice input dictation helper"
            >
              <MaterialCommunityIcons name="microphone" size={28} color={colors.primary} />
            </AccessibleButton>
          </View>

          <Text style={styles.label}>Time / වේලාව *</Text>
          <OversizedTimePicker
            value={selectedTime}
            onChange={setSelectedTime}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.9}
          accessibilityLabel="Save medicine"
          accessibilityRole="button"
          accessibilityHint="Submits this medicine schedule to your care list"
        >
          {saving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <MaterialCommunityIcons name="check-bold" size={24} color={colors.onPrimary} />
              <Text style={styles.saveBtnText}>Save / සුරකින්න</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Voice Dictation Modal */}
      <VoiceDictationModal
        visible={dictationVisible}
        onClose={() => setDictationVisible(false)}
        onTextDictated={handleTextDictated}
        fieldType={dictationField}
        fieldName={dictationField === 'medication' ? 'Medicine Name' : 'Dosage'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s4,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.outlineVariant,
  },
  backBtn: {
    padding: spacing.s1,
  },
  headerTitle: {
    ...typography.headlineLarge,
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s6,
    paddingBottom: spacing.s12 + 60,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.s6,
    marginBottom: spacing.s6,
    ...elevation.e2,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.category.medicine.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s4,
  },
  title: {
    ...typography.headlineMedium,
    color: colors.text.primary,
    marginBottom: spacing.s1,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing.s6,
  },
  label: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.s2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: spacing.s5,
    paddingRight: spacing.s2,
  },
  input: {
    flex: 1,
    height: 64,
    paddingHorizontal: spacing.s4,
    fontSize: 18,
    color: colors.text.primary,
  },
  micInputBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.s3,
    ...elevation.e3,
  },
  saveBtnDisabled: {
    backgroundColor: colors.secondaryLight,
    elevation: 0,
  },
  saveBtnText: {
    ...typography.headlineSmall,
    color: colors.onPrimary,
  },
});

export default AddMedicationScreen;

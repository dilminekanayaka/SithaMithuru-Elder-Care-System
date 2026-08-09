import React, { useState } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import Text from "../../components/AppText";
import AccessibleButton from "../../components/AccessibleButton";
import VoiceDictationModal from "../../components/VoiceDictationModal";
import { colors, typography, spacing, radius, elevation } from "../../theme";

interface EditMedicationProps {
  onBack: () => void;
  onSaveSuccess?: () => void;
  onDeleteSuccess?: () => void;
  medicationId?: number;
  initialName?: string;
  initialDosage?: string;
  initialFrequency?: string;
  initialTimes?: string[];
  initialMealType?: string;
  initialStock?: number;
}

const FREQUENCIES = ["Daily", "Twice a Day", "Thrice a Day", "Weekly"];
const TIMES = ["08:00 AM", "01:00 PM", "07:00 PM", "10:00 PM"];
const MEAL_OPTIONS = ["Before Meal", "After Meal", "With Meal"];

const EditMedicationScreen: React.FC<EditMedicationProps> = ({
  onBack,
  onSaveSuccess,
  onDeleteSuccess,
  initialName = "Metformin",
  initialDosage = "500 mg - 1 Tablet",
  initialFrequency = "Twice a Day",
  initialTimes = ["08:00 AM", "07:00 PM"],
  initialMealType = "After Meal",
  initialStock = 14,
}) => {
  const [name, setName] = useState(initialName);
  const [dosage, setDosage] = useState(initialDosage);
  const [frequency, setFrequency] = useState(initialFrequency);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(initialTimes);
  const [mealType, setMealType] = useState(initialMealType);
  const [stock, setStock] = useState(String(initialStock));
  const [saving, setSaving] = useState(false);
  const [dictationVisible, setDictationVisible] = useState(false);
  const [dictationField, setDictationField] = useState<'medication' | 'dosage'>('medication');

  const toggleTime = (t: string) => {
    Haptics.selectionAsync();
    if (selectedTimes.includes(t)) {
      setSelectedTimes(selectedTimes.filter((item) => item !== t));
    } else {
      setSelectedTimes([...selectedTimes, t]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Oops / පොඩ්ඩක් ඉන්න",
        text2: "Please enter a medicine name before saving. / සුරැකීමට පෙර කරුණාකර ඖෂධයේ නම ඇතුළත් කරන්න.",
        position: "top",
      });
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);

    setTimeout(() => {
      setSaving(false);
      Toast.show({
        type: "success",
        text1: "Updated Successfully / සාර්ථකව යාවත්කාලීන කළා",
        text2: `${name} details have been saved.`,
        position: "top",
      });
      if (onSaveSuccess) {
        onSaveSuccess();
      } else {
        onBack();
      }
    }, 500);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Medicine? / ඖෂධය ඉවත් කරන්නද?",
      `Are you sure you want to remove ${name} from your reminders?`,
      [
        { text: "Cancel / එපා", style: "cancel" },
        {
          text: "Delete / ඔව්, ඉවත් කරන්න",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show({
              type: "info",
              text1: "Medicine Deleted / ඖෂධය ඉවත් කළා",
              text2: `${name} has been removed.`,
              position: "top",
            });
            if (onDeleteSuccess) {
              onDeleteSuccess();
            } else {
              onBack();
            }
          },
        },
      ]
    );
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

      {/* Header */}
      <View style={styles.header}>
        <AccessibleButton
          style={styles.backBtn}
          onPress={onBack}
          accessibilityLabel="Cancel editing / අවලංගු කරන්න"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="close"
            size={32}
            color={colors.text.primary}
          />
        </AccessibleButton>
        <Text style={styles.headerTitle} isHeader>Edit Medicine</Text>
        <AccessibleButton
          onPress={handleSave}
          disabled={saving}
          accessibilityLabel="Save changes / සුරකින්න"
          accessibilityRole="button"
        >
          <Text style={styles.headerSaveText}>Save</Text>
        </AccessibleButton>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Medicine Hero Box */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconBox}>
              <MaterialCommunityIcons
                name="pill"
                size={36}
                color={colors.primary}
              />
            </View>
            <Text style={styles.heroTitle} isHeader>Modify Schedule</Text>
            <Text style={styles.heroSubtitle}>
              Keep your medication dosage and time accurate.
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Medicine Name / ඖෂධයේ නම</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Metformin"
                placeholderTextColor={colors.text.disabled}
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

            <Text style={styles.label}>Dosage / මාත්‍රාව</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={dosage}
                onChangeText={setDosage}
                placeholder="e.g. 500 mg - 1 Tablet"
                placeholderTextColor={colors.text.disabled}
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

            <Text style={styles.label}>Frequency / වාර ගණන</Text>
            <View style={styles.chipRow}>
              {FREQUENCIES.map((f) => (
                <AccessibleButton
                  key={f}
                  style={[
                    styles.chip,
                    frequency === f && styles.chipActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFrequency(f);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Frequency ${f}`}
                  accessibilityState={{ selected: frequency === f }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      frequency === f && styles.chipTextActive,
                    ]}
                  >
                    {f}
                  </Text>
                </AccessibleButton>
              ))}
            </View>

            <Text style={styles.label}>Reminder Times / වේලාවන්</Text>
            <View style={styles.chipRow}>
              {TIMES.map((t) => {
                const active = selectedTimes.includes(t);
                return (
                  <AccessibleButton
                    key={t}
                    style={[
                      styles.chip,
                      active && styles.chipActive,
                    ]}
                    onPress={() => toggleTime(t)}
                    accessibilityRole="button"
                    accessibilityLabel={`Time ${t}`}
                    accessibilityState={{ selected: active }}
                  >
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={18}
                      color={active ? colors.surface : colors.text.secondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </AccessibleButton>
                );
              })}
            </View>

            <Text style={styles.label}>Meal Instructions / ආහාර උපදෙස්</Text>
            <View style={styles.chipRow}>
              {MEAL_OPTIONS.map((m) => (
                <AccessibleButton
                  key={m}
                  style={[
                    styles.chip,
                    mealType === m && styles.chipActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMealType(m);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Meal instruction ${m}`}
                  accessibilityState={{ selected: mealType === m }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      mealType === m && styles.chipTextActive,
                    ]}
                  >
                    {m}
                  </Text>
                </AccessibleButton>
              ))}
            </View>

            <Text style={styles.label}>Remaining Pill Count (Stock) / ඉතිරි පෙති ප්‍රමාණය</Text>
            <TextInput
              style={styles.input}
              value={stock}
              onChangeText={setStock}
              keyboardType="number-pad"
              placeholder="e.g. 14"
              placeholderTextColor={colors.text.disabled}
              accessibilityLabel="Stock count input"
              accessibilityRole="text"
            />
          </View>

          {/* Save CTA */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save changes button"
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={colors.surface}
            />
            <Text style={styles.saveBtnText}>Save Changes / සුරකින්න</Text>
          </TouchableOpacity>

          {/* Delete CTA */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete this medicine button"
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={22}
              color={colors.error}
            />
            <Text style={styles.deleteBtnText}>Delete This Medicine / ඉවත් කරන්න</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s4,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: {
    padding: spacing.s1,
  },
  headerTitle: {
    ...typography.headlineLarge,
    color: colors.text.primary,
  },
  headerSaveText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: "800",
    paddingHorizontal: spacing.s3,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s12 + 60,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s5,
    alignItems: "center",
    marginBottom: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e1,
  },
  heroIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.s3,
  },
  heroTitle: {
    fontSize: 20,
    color: colors.text.primary,
    fontWeight: "800",
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: 4,
  },
  formSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s5,
    marginBottom: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e1,
  },
  label: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: "700",
    marginTop: spacing.s3,
    marginBottom: spacing.s2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: spacing.s3,
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s2,
    marginVertical: spacing.s2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  chipTextActive: {
    color: colors.surface,
    fontWeight: "800",
  },
  saveBtn: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.s3,
    gap: spacing.s2,
    ...elevation.e2,
  },
  saveBtnText: {
    fontSize: 18,
    color: colors.surface,
    fontWeight: "800",
  },
  deleteBtn: {
    flexDirection: "row",
    backgroundColor: colors.errorContainer,
    borderRadius: radius.lg,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s2,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteBtnText: {
    fontSize: 18,
    color: colors.error,
    fontWeight: "800",
  },
});

export default EditMedicationScreen;

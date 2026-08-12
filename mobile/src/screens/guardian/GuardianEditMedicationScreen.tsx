import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { apiFetch, SessionExpiredError } from "../../services/api";
import { colors } from '../../theme';

interface GuardianEditMedicationProps {
  onBack: () => void;
  token: string;
  medication: any;
  onSaveSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onSessionExpired?: () => void;
}

const FORMS = ["PILL", "LIQUID", "INJECTION", "DROPS", "TOPICAL"];
const CATEGORIES = [
  "Blood Pressure",
  "Diabetes",
  "Supplements",
  "Pain Relief",
  "Heart Health",
  "General",
];
const SCHEDULE_TYPES = ["DAILY", "SPECIFIC_DAYS", "INTERVAL", "AS_NEEDED"];

const GuardianEditMedicationScreen: React.FC<GuardianEditMedicationProps> = ({
  onBack,
  token,
  medication,
  onSaveSuccess,
  onDeleteSuccess,
  onSessionExpired,
}) => {
  const [name, setName] = useState(medication?.name || "");
  const [dosage, setDosage] = useState(medication?.dosage || "");
  const [form, setForm] = useState(medication?.form || "PILL");
  const [strength, setStrength] = useState(medication?.strength || "");
  const [category, setCategory] = useState(medication?.category || "General");
  const [instructions, setInstructions] = useState(medication?.instructions || "");
  const [scheduleType, setScheduleType] = useState(medication?.schedule_type || "DAILY");
  const [times, setTimes] = useState<string[]>(
    Array.isArray(medication?.times) && medication.times.length > 0
      ? medication.times
      : medication?.time_schedule
      ? [medication.time_schedule]
      : ["08:00"]
  );

  const [showPicker, setShowPicker] = useState(false);
  const [selectedPickerDate, setSelectedPickerDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);

  const formatTime = (date: Date): string => {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const onTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (date) {
      const formatted = formatTime(date);
      if (!times.includes(formatted)) {
        setTimes([...times, formatted].sort());
      }
    }
  };

  const removeTime = (t: string) => {
    if (times.length <= 1) {
      Toast.show({
        type: "info",
        text1: "Minimum One Time",
        text2: "A medication must have at least one scheduled reminder time.",
        position: "top",
      });
      return;
    }
    setTimes(times.filter((item) => item !== t));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Medicine name is required.",
        position: "top",
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    try {
      await apiFetch(`/guardian/medications/${medication.id}`, token, {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          dosage: dosage.trim() || null,
          time_schedule: times[0] || "08:00",
          form,
          strength: strength.trim(),
          category,
          instructions: instructions.trim(),
          schedule_type: scheduleType,
          times,
        }),
      });

      Toast.show({
        type: "success",
        text1: "Prescription Updated",
        text2: `${name.trim()} schedule updated successfully.`,
        position: "top",
      });

      if (onSaveSuccess) {
        onSaveSuccess();
      } else {
        onBack();
      }
    } catch (error: any) {
      if (error instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to update medication",
        position: "top",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Archive Medication?",
      `Are you sure you want to archive ${name}? Adherence history will be preserved.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            try {
              await apiFetch(`/guardian/medications/${medication.id}`, token, {
                method: "DELETE",
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Toast.show({
                type: "info",
                text1: "Medication Archived",
                text2: `${name} has been archived safely.`,
                position: "top",
              });
              if (onDeleteSuccess) {
                onDeleteSuccess();
              } else {
                onBack();
              }
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: error.message || "Failed to delete medication",
                position: "top",
              });
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Prescription</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.headerSaveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Box */}
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="pill" size={32} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Medication Schedule</Text>
            <Text style={styles.cardSubtitle}>
              Update clinical dosage strength, instructions, and reminder times.
            </Text>

            {/* Name */}
            <Text style={styles.label}>Medicine Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Paracetamol"
              placeholderTextColor={colors.text.secondary}
            />

            {/* Form */}
            <Text style={styles.label}>Dosage Form</Text>
            <View style={styles.chipRow}>
              {FORMS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, form === f && styles.chipActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setForm(f);
                  }}
                >
                  <Text
                    style={[styles.chipText, form === f && styles.chipTextActive]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Strength */}
            <Text style={styles.label}>Strength / Dose</Text>
            <TextInput
              style={styles.input}
              value={strength}
              onChangeText={setStrength}
              placeholder="e.g. 500mg or 10ml"
              placeholderTextColor={colors.text.secondary}
            />

            {/* Category */}
            <Text style={styles.label}>Clinical Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCategory(cat);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === cat && styles.chipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Schedule Type */}
            <Text style={styles.label}>Schedule Type</Text>
            <View style={styles.chipRow}>
              {SCHEDULE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    scheduleType === type && styles.chipActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setScheduleType(type);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      scheduleType === type && styles.chipTextActive,
                    ]}
                  >
                    {type.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reminder Times */}
            <Text style={styles.label}>Reminder Times (24H)</Text>
            <View style={styles.chipRow}>
              {times.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, styles.chipActive]}
                  onPress={() => removeTime(t)}
                >
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={16}
                    color={colors.onPrimary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.chipText, styles.chipTextActive]}>
                    {t} ✕
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addTimeChip}
                onPress={() => setShowPicker(true)}
              >
                <Text style={styles.addTimeChipText}>+ Add Time</Text>
              </TouchableOpacity>
            </View>

            {showPicker && (
              <DateTimePicker
                value={selectedPickerDate}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onTimeChange}
                is24Hour={true}
              />
            )}

            {showPicker && Platform.OS === "ios" && (
              <TouchableOpacity
                style={styles.pickerDoneBtn}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}

            {/* Instructions */}
            <Text style={styles.label}>Instructions</Text>
            <TextInput
              style={styles.input}
              value={instructions}
              onChangeText={setInstructions}
              placeholder="e.g. Take after dinner with full glass of water"
              placeholderTextColor={colors.text.secondary}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.disabledBtn]}
              onPress={handleSave}
              disabled={saving}
            >
              <MaterialCommunityIcons name="check" size={20} color={colors.onPrimary} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <MaterialCommunityIcons
                name="archive-outline"
                size={20}
                color={colors.error}
              />
              <Text style={styles.deleteBtnText}>Archive Prescription</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FA" },
  header: {
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: colors.text.primary },
  headerSaveText: { fontSize: 16, fontWeight: "800", color: colors.primary },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 24,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text.primary,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 20,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.primary,
  },
  chipTextActive: {
    color: colors.onPrimary,
    fontWeight: "700",
  },
  addTimeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addTimeChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  pickerDoneBtn: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pickerDoneText: {
    color: colors.onPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  buttonContainer: { gap: 12 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  disabledBtn: { backgroundColor: colors.text.tertiary },
  saveBtnText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
  deleteBtn: {
    backgroundColor: colors.errorContainer,
    borderRadius: 30,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FEB2B2",
  },
  deleteBtnText: { color: colors.error, fontSize: 16, fontWeight: "700" },
});

export default GuardianEditMedicationScreen;

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
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

interface AddMedicationScreenProps {
  onBack: () => void;
  token: string;
  elderId: string;
  onSave?: () => void;
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

const CLINICAL_DICTIONARY = [
  { name: "Paracetamol", form: "PILL", defaultStrength: "500mg", category: "Pain Relief", instructions: "Take after meals" },
  { name: "Metformin", form: "PILL", defaultStrength: "500mg", category: "Diabetes", instructions: "Take with food" },
  { name: "Atorvastatin", form: "PILL", defaultStrength: "20mg", category: "Heart Health", instructions: "Take at bedtime" },
  { name: "Amlodipine", form: "PILL", defaultStrength: "5mg", category: "Blood Pressure", instructions: "Take in the morning" },
  { name: "Omeprazole", form: "PILL", defaultStrength: "20mg", category: "General", instructions: "Take before breakfast" },
  { name: "Aspirin", form: "PILL", defaultStrength: "75mg", category: "Heart Health", instructions: "Take with food" },
  { name: "Losartan", form: "PILL", defaultStrength: "50mg", category: "Blood Pressure", instructions: "Take daily" },
  { name: "Metoprolol", form: "PILL", defaultStrength: "25mg", category: "Blood Pressure", instructions: "Take with meals" },
  { name: "Gabapentin", form: "PILL", defaultStrength: "300mg", category: "Pain Relief", instructions: "Take as directed" },
  { name: "Furosemide", form: "PILL", defaultStrength: "40mg", category: "Heart Health", instructions: "Take in morning to avoid nocturia" },
  { name: "Levothyroxine", form: "PILL", defaultStrength: "50mcg", category: "General", instructions: "Take on empty stomach" },
  { name: "Vitamin D3", form: "PILL", defaultStrength: "1000 IU", category: "Supplements", instructions: "Take with food" },
  { name: "Insulin Glargine", form: "INJECTION", defaultStrength: "10 units", category: "Diabetes", instructions: "Subcutaneous injection at same time daily" },
  { name: "Cough Syrup", form: "LIQUID", defaultStrength: "10ml", category: "General", instructions: "Take every 6 hours as needed" },
  { name: "Eye Drops (Lubricant)", form: "DROPS", defaultStrength: "2 drops", category: "General", instructions: "Instill into affected eye" },
];

const AddMedicationScreen: React.FC<AddMedicationScreenProps> = ({
  onBack,
  token,
  elderId,
  onSave,
  onSessionExpired,
}) => {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [form, setForm] = useState("PILL");
  const [strength, setStrength] = useState("");
  const [category, setCategory] = useState("General");
  const [instructions, setInstructions] = useState("");
  const [scheduleType, setScheduleType] = useState("DAILY");
  const [times, setTimes] = useState<string[]>(["08:00"]);

  const [showPicker, setShowPicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
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

  const selectDictionaryItem = (item: any) => {
    Haptics.selectionAsync();
    setName(item.name);
    setForm(item.form);
    setStrength(item.defaultStrength);
    setCategory(item.category);
    setInstructions(item.instructions);
    Toast.show({
      type: "info",
      text1: `${item.name} Selected`,
      text2: `Auto-filled ${item.defaultStrength} (${item.category})`,
      position: "top",
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Required Field",
        text2: "Medicine name is required",
        position: "top",
      });
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/guardian/medications", token, {
        method: "POST",
        body: JSON.stringify({
          elderId: elderId,
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
        text1: "Medication Added",
        text2: `${name.trim()} scheduled with ${times.length} daily reminder(s).`,
        position: "top",
      });

      if (onSave) {
        onSave();
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
        text2: error.message || "Failed to add medication",
        position: "top",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Medication</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="pill" size={32} color={colors.primary} />
          </View>
          <Text style={styles.cardTitle}>New Prescription</Text>
          <Text style={styles.cardSubtitle}>
            Configure clinical schedule, dosage strength, and reminder times.
          </Text>

          {/* Quick Select Dictionary */}
          <Text style={styles.label}>Clinical Quick Select</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dictScroll}
            contentContainerStyle={styles.dictContainer}
          >
            {CLINICAL_DICTIONARY.map((item) => (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.dictChip,
                  name === item.name && styles.dictChipActive,
                ]}
                onPress={() => selectDictionaryItem(item)}
              >
                <Text
                  style={[
                    styles.dictChipText,
                    name === item.name && styles.dictChipTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Medicine Name */}
          <Text style={styles.label}>Medicine Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Paracetamol 500mg"
            placeholderTextColor={colors.text.secondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
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
            placeholder="e.g. 500mg or 10ml"
            placeholderTextColor={colors.text.secondary}
            value={strength}
            onChangeText={setStrength}
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
              value={selectedTime}
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
            placeholder="e.g. Take after meals with full glass of water"
            placeholderTextColor={colors.text.secondary}
            value={instructions}
            onChangeText={setInstructions}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.disabledBtn]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color={colors.onPrimary} />
                <Text style={styles.saveBtnText}>Save Medication</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onBack}
            disabled={saving}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  dictScroll: { marginBottom: 16 },
  dictContainer: { gap: 8 },
  dictChip: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D2CFFF",
  },
  dictChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dictChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  dictChipTextActive: {
    color: colors.onPrimary,
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
  cancelBtn: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.text.tertiary,
    backgroundColor: colors.surface,
  },
  cancelBtnText: { color: colors.text.secondary, fontSize: 16, fontWeight: "700" },
});

export default AddMedicationScreen;


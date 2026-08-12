/**
 * AddTaskScreen.tsx — Screen ELDER-S16 (Add Task Form Screen)
 * Spec: es16.txt
 *
 * Requirements (es16.txt):
 *  1. Header: Back arrow (←), Title "Add Task".
 *  2. Unsaved Changes Alert: Modal asking "Leave without saving?" if modified and Back is pressed.
 *  3. Form Fields:
 *     - What do you need to do? (Task Title Input + Voice Dictation)
 *     - Date Picker (Today, Tomorrow, Saturday 15 August)
 *     - Time Picker (11:00 AM / Specific time)
 *     - Reminder Picker (No reminder, At task time, 15 mins before, 30 mins before, 1 hour before, 1 day before)
 *     - Multi-Reminder Support (+ Add reminder)
 *     - Repeat Picker (Does not repeat, Every day, Every week, Specific days)
 *     - Notes (Optional text box, e.g. "Bring my bank book")
 *  4. Save Button: [ SAVE TASK ] CTA (≥52dp touch target).
 *  5. Success & Navigation: Toast notification "Task added" -> Returns to Daily Tasks Dashboard.
 *  6. 100% Offline-First
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import VoiceDictationModal from '../../components/VoiceDictationModal';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';

interface AddTaskProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onSave?: (task: any) => void;
  elderId?: string;
  token?: string;
}

const AddTaskScreen: React.FC<AddTaskProps> = ({ onBack, onNavigate, onSave }) => {
  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedTime, setSelectedTime] = useState('11:00 AM');
  const [selectedReminders, setSelectedReminders] = useState<string[]>(['1 day before']);
  const [repeatOption, setRepeatOption] = useState('Does not repeat');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [dictationVisible, setDictationVisible] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);

  const REMINDER_OPTIONS = [
    'No reminder',
    'At task time',
    '15 minutes before',
    '30 minutes before',
    '1 hour before',
    '1 day before',
  ];

  const REPEAT_OPTIONS = [
    'Does not repeat',
    'Every day',
    'Every week',
    'Specific days',
  ];

  const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const isFormDirty = title.trim().length > 0 || notes.trim().length > 0;

  const handleBackPress = () => {
    if (isFormDirty) {
      setShowUnsavedModal(true);
    } else {
      onBack();
    }
  };

  const handleAddReminder = (option: string) => {
    if (option === 'No reminder') {
      setSelectedReminders(['No reminder']);
    } else {
      const filtered = selectedReminders.filter((r) => r !== 'No reminder');
      if (!filtered.includes(option)) {
        setSelectedReminders([...filtered, option]);
      }
    }
    setShowReminderPicker(false);
  };

  const handleRemoveReminder = (index: number) => {
    const updated = selectedReminders.filter((_, i) => i !== index);
    setSelectedReminders(updated.length > 0 ? updated : ['No reminder']);
  };

  const toggleSpecificDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Title Required',
        text2: 'Please enter what you need to do.',
        position: 'top',
      });
      return;
    }

    const newTask = {
      id: `task_${Date.now()}`,
      title: title.trim(),
      date: selectedDate,
      time: selectedTime,
      reminders: selectedReminders,
      repeat: repeatOption,
      specificDays: selectedDays,
      notes: notes.trim(),
      status: 'UPCOMING',
    };

    if (onSave) onSave(newTask);

    Toast.show({
      type: 'success',
      text1: 'Task Added! 📅',
      text2: `Scheduled for ${selectedDate} at ${selectedTime}`,
      position: 'top',
    });

    onBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es16.txt Section 1 & 3) ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackPress}
          accessible={true}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Add Task</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── TASK TITLE INPUT (es16.txt Section 3 & 4) ─── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>What do you need to do? *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Go to the bank"
              placeholderTextColor={colors.text.tertiary}
              accessible={true}
              accessibilityLabel="Task title input"
            />
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => setDictationVisible(true)}
              accessible={true}
              accessibilityLabel="Dictate title with voice"
            >
              <MaterialCommunityIcons name="microphone" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── TASK DATE (es16.txt Section 7) ─── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Date</Text>
          <View style={styles.chipRow}>
            {['Today', 'Tomorrow', 'Saturday, 15 Aug'].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.choiceChip, selectedDate === d && styles.choiceChipSelected]}
                onPress={() => setSelectedDate(d)}
              >
                <MaterialCommunityIcons
                  name="calendar"
                  size={18}
                  color={selectedDate === d ? colors.onPrimary : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.choiceChipText,
                    selectedDate === d && styles.choiceChipTextSelected,
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── TASK TIME (es16.txt Section 8) ─── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Time</Text>
          <View style={styles.chipRow}>
            {['8:00 AM', '11:00 AM', '2:00 PM', '6:00 PM'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.choiceChip, selectedTime === t && styles.choiceChipSelected]}
                onPress={() => setSelectedTime(t)}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={18}
                  color={selectedTime === t ? colors.onPrimary : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.choiceChipText,
                    selectedTime === t && styles.choiceChipTextSelected,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── REMINDER OPTIONS (es16.txt Section 10 & 11) ─── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Reminder</Text>
          {selectedReminders.map((rem, idx) => (
            <View key={idx} style={styles.selectedOptionBox}>
              <MaterialCommunityIcons name="bell-ring-outline" size={20} color={colors.primary} />
              <Text style={styles.selectedOptionText}>{rem}</Text>
              <TouchableOpacity onPress={() => handleRemoveReminder(idx)}>
                <MaterialCommunityIcons name="close" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addOptionBtn}
            onPress={() => setShowReminderPicker(true)}
          >
            <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
            <Text style={styles.addOptionBtnText}>Add Reminder</Text>
          </TouchableOpacity>
        </View>

        {/* ─── REPEAT OPTIONS (es16.txt Section 14, 17) ─── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Repeat</Text>
          <TouchableOpacity
            style={styles.dropdownBox}
            onPress={() => setShowRepeatPicker(true)}
          >
            <MaterialCommunityIcons name="repeat" size={20} color={colors.primary} />
            <Text style={styles.dropdownText}>{repeatOption}</Text>
            <MaterialCommunityIcons name="chevron-down" size={22} color={colors.text.secondary} />
          </TouchableOpacity>

          {repeatOption === 'Specific days' && (
            <View style={styles.daysContainer}>
              {DAYS_OF_WEEK.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    selectedDays.includes(day) && styles.dayChipSelected,
                  ]}
                  onPress={() => toggleSpecificDay(day)}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      selectedDays.includes(day) && styles.dayChipTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ─── NOTES (OPTIONAL) (es16.txt Section 6) ─── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Bring my bank book."
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* ─── SAVE TASK CTA BUTTON (es16.txt Section 3 & 43) ─── */}
        <TouchableOpacity
          style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!title.trim()}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Save Task"
        >
          <Text style={styles.saveBtnText}>SAVE TASK</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── UNSAVED CHANGES MODAL (es16.txt Section 31) ─── */}
      <Modal
        visible={showUnsavedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnsavedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.warning} />
            <Text style={styles.modalTitle}>Leave without saving?</Text>
            <Text style={styles.modalSubtitle}>Your task information has not been saved.</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalStayBtn}
                onPress={() => setShowUnsavedModal(false)}
              >
                <Text style={styles.modalStayBtnText}>STAY</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalLeaveBtn}
                onPress={() => {
                  setShowUnsavedModal(false);
                  onBack();
                }}
              >
                <Text style={styles.modalLeaveBtnText}>LEAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* REMINDER PICKER MODAL */}
      <Modal
        visible={showReminderPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReminderPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReminderPicker(false)}
        >
          <View style={styles.pickerBox}>
            <Text style={styles.pickerTitle}>Select Reminder</Text>
            {REMINDER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.pickerItem}
                onPress={() => handleAddReminder(opt)}
              >
                <Text style={styles.pickerItemText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* REPEAT PICKER MODAL */}
      <Modal
        visible={showRepeatPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRepeatPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRepeatPicker(false)}
        >
          <View style={styles.pickerBox}>
            <Text style={styles.pickerTitle}>Select Repeat</Text>
            {REPEAT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.pickerItem}
                onPress={() => {
                  setRepeatOption(opt);
                  setShowRepeatPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Voice Dictation Modal */}
      <VoiceDictationModal
        visible={dictationVisible}
        onClose={() => setDictationVisible(false)}
        onTextDictated={(t) => setTitle(t)}
        fieldType="task"
        fieldName="Task Name"
      />

      <BottomNavBar activeTab="tasks" onNavigate={onNavigate} />
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
  },
  fieldGroup: {
    marginBottom: spacing.s5 || 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: colors.text.primary,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  choiceChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  choiceChipTextSelected: {
    color: colors.onPrimary,
  },
  selectedOptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryContainer,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  selectedOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
    marginLeft: 10,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  addOptionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: 14,
    height: 52,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    marginLeft: 10,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text.secondary,
  },
  dayChipTextSelected: {
    color: colors.onPrimary,
  },
  saveBtn: {
    height: 54,
    backgroundColor: colors.success,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    ...elevation.e3,
  },
  saveBtnDisabled: {
    backgroundColor: colors.outline,
    elevation: 0,
  },
  saveBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
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
    marginTop: 12,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalStayBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalStayBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  modalLeaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLeaveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  pickerBox: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    ...elevation.e3,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 14,
    textAlign: 'center',
  },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.outlineVariant,
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
});

export default AddTaskScreen;

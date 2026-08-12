/**
 * MoodScreen.tsx — Screen ELDER-S19 (Mood Check-In Screen)
 * Spec: es19.txt
 *
 * Requirements (es19.txt):
 *  1. Header: Back arrow (←), Title "How Are You Feeling?".
 *  2. Question Banner: "How are you feeling today? Choose the feeling that fits you best."
 *  3. 6 Primary Mood Choices (≥64dp touch target):
 *     - 😊 Happy
 *     - 😐 Okay
 *     - 😔 Sad
 *     - 😟 Worried
 *     - 😴 Tired
 *     - 😄 Excited
 *  4. Single selection with checkmark (✓) visual indicator.
 *  5. Optional Text Input: "Tell us more (optional)" + Voice dictation support.
 *  6. Actions:
 *     - Primary CTA: [ SAVE MOOD ] (≥52dp height)
 *     - Secondary CTA: [ Skip ] (No forced check-in)
 *  7. Gentle Wellbeing Suggestions Modal after Save (es19.txt Section 13, 14, 15):
 *     - Sad: "Thank you for sharing. You might enjoy looking through your favorite memories." -> [ VIEW MEMORIES ]
 *     - Happy: "Thank you for sharing! Save this happy moment." -> [ VIEW MEMORIES ]
 *  8. 100% Offline-First
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

interface MoodProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  elderId?: string;
  token?: string;
  isOnline?: boolean;
}

export interface MoodOption {
  id: 'HAPPY' | 'OKAY' | 'SAD' | 'WORRIED' | 'TIRED' | 'EXCITED';
  emoji: string;
  label: string;
  iconName: string;
  color: string;
  accent: string;
  suggestionTitle: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'HAPPY',
    emoji: '😊',
    label: 'Happy',
    iconName: 'emoticon-happy-outline',
    color: colors.successContainer,
    accent: colors.success,
    suggestionTitle: 'You might enjoy saving this happy moment in your memories.',
  },
  {
    id: 'OKAY',
    emoji: '😐',
    label: 'Okay',
    iconName: 'emoticon-neutral-outline',
    color: colors.warningContainer,
    accent: colors.warning,
    suggestionTitle: 'You might enjoy looking through your daily activities.',
  },
  {
    id: 'SAD',
    emoji: '😔',
    label: 'Sad',
    iconName: 'emoticon-sad-outline',
    color: colors.primaryContainer,
    accent: colors.primary,
    suggestionTitle: 'You might enjoy looking through one of your favorite memories.',
  },
  {
    id: 'WORRIED',
    emoji: '😟',
    label: 'Worried',
    iconName: 'emoticon-confused-outline',
    color: colors.category.journal.bg,
    accent: colors.category.journal.accent,
    suggestionTitle: 'Take a few quiet minutes or listen to calming music.',
  },
  {
    id: 'TIRED',
    emoji: '😴',
    label: 'Tired',
    iconName: 'sleep',
    color: colors.surfaceVariant,
    accent: colors.text.secondary,
    suggestionTitle: 'Take a short rest and drink a glass of water.',
  },
  {
    id: 'EXCITED',
    emoji: '😄',
    label: 'Excited',
    iconName: 'emoticon-excited-outline',
    color: colors.errorContainer,
    accent: colors.error,
    suggestionTitle: 'Write a short journal entry about what made you happy today.',
  },
];

const MoodScreen: React.FC<MoodProps> = ({ onBack, onNavigate, elderId, token }) => {
  const [selectedMood, setSelectedMood] = useState<MoodOption>(MOOD_OPTIONS[0]);
  const [note, setNote] = useState('');
  const [dictationVisible, setDictationVisible] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  // Handle Save Mood (es19.txt Section 8 & 15)
  const handleSaveMood = async () => {
    AccessibilityInfo.announceForAccessibility(
      `Mood recorded as ${selectedMood.label}. Opening suggestion.`
    );

    Toast.show({
      type: 'success',
      text1: 'Mood Recorded 😊',
      text2: 'Thank you for sharing how you feel.',
      position: 'top',
    });

    // Offline-First: Write mood log to SQLite offline queue
    try {
      const { getDB } = require('../../database/db');
      const { syncService } = require('../../services/syncService');
      const db = await getDB();
      const logId = `moodlog_${Date.now()}`;
      const logDate = new Date().toISOString().split('T')[0];

      await db.runAsync(
        `INSERT INTO mood_logs_offline (id, mood_type, elder_id, logged_date, action_timestamp, synced)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [logId, selectedMood.label, elderId || 'elder_default', logDate, new Date().toISOString()]
      );

      // Trigger background sync if token provided
      if (elderId && token) {
        syncService.syncOfflineQueue(elderId, token).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to log mood to SQLite offline queue:', e);
    }

    setShowSuggestionModal(true);
  };

  const handleSkip = () => {
    onBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es19.txt Section 1) ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          accessible={true}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>How Are You Feeling?</Text>

        <TouchableOpacity
          style={styles.historyNavBtn}
          onPress={() => onNavigate('moodHistory')}
          accessible={true}
          accessibilityLabel="View Mood History"
        >
          <MaterialCommunityIcons name="history" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── QUESTION BANNER (es19.txt Section 2 & 3) ─── */}
        <View style={styles.bannerBox}>
          <Text style={styles.questionTitle}>How are you feeling today?</Text>
          <Text style={styles.questionSubtitle}>Choose the feeling that fits you best.</Text>
        </View>

        {/* ─── 6 MOOD CHOICES GRID (es19.txt Section 4, 5, 31) ─── */}
        <View style={styles.moodGrid}>
          {MOOD_OPTIONS.map((mood) => {
            const isSelected = selectedMood.id === mood.id;
            return (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodCard,
                  { backgroundColor: mood.color },
                  isSelected && { borderColor: mood.accent, borderWidth: 3 },
                ]}
                onPress={() => setSelectedMood(mood)}
                activeOpacity={0.8}
                accessible={true}
                accessibilityLabel={`${mood.label} mood`}
                accessibilityState={{ selected: isSelected }}
              >
                {isSelected && (
                  <View style={[styles.checkCircle, { backgroundColor: mood.accent }]}>
                    <MaterialCommunityIcons name="check" size={16} color={colors.onPrimary} />
                  </View>
                )}

                <Text style={styles.emojiText}>{mood.emoji}</Text>
                <Text style={[styles.moodLabelText, { color: mood.accent }]}>{mood.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── OPTIONAL TEXT INPUT (es19.txt Section 6 & 7) ─── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Tell us more (optional)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={note}
              onChangeText={setNote}
              placeholder="I am feeling..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => setDictationVisible(true)}
              accessible={true}
              accessibilityLabel="Dictate note with voice"
            >
              <MaterialCommunityIcons name="microphone" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── SAVE MOOD CTA (es19.txt Section 8 & 31) ─── */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveMood}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Save Mood"
        >
          <Text style={styles.saveBtnText}>SAVE MOOD</Text>
        </TouchableOpacity>

        {/* ─── SKIP BUTTON (es19.txt Section 23) ─── */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── POST-SAVE WELLBEING SUGGESTION MODAL (es19.txt Section 13, 14, 15) ─── */}
      <Modal
        visible={showSuggestionModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSuggestionModal(false);
          onBack();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.suggestionEmoji}>{selectedMood.emoji}</Text>
            <Text style={styles.modalTitle}>Thank you for sharing.</Text>
            <Text style={styles.modalSubtitle}>{selectedMood.suggestionTitle}</Text>

            <TouchableOpacity
              style={styles.viewMemoriesBtn}
              onPress={() => {
                setShowSuggestionModal(false);
                onNavigate('memories');
              }}
            >
              <MaterialCommunityIcons name="image-multiple-outline" size={20} color={colors.onPrimary} />
              <Text style={styles.viewMemoriesBtnText}>VIEW MEMORIES</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.maybeLaterBtn}
              onPress={() => {
                setShowSuggestionModal(false);
                onBack();
              }}
            >
              <Text style={styles.maybeLaterBtnText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Voice Dictation Modal */}
      <VoiceDictationModal
        visible={dictationVisible}
        onClose={() => setDictationVisible(false)}
        onTextDictated={(t) => setNote(t)}
        fieldType="journal_content"
        fieldName="Mood Note"
      />

      <BottomNavBar activeTab="mood" onNavigate={onNavigate} />
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
  historyNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s5 || 20,
    paddingBottom: 110,
  },
  bannerBox: {
    alignItems: 'center',
    marginBottom: spacing.s5 || 20,
  },
  questionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  questionSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.s5 || 20,
    gap: 12,
  },
  moodCard: {
    width: '47%',
    height: 110,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
    ...elevation.e1,
  },
  checkCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 42,
    marginBottom: 4,
  },
  moodLabelText: {
    fontSize: 16,
    fontWeight: '800',
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
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    height: 70,
    textAlignVertical: 'top',
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...elevation.e3,
  },
  saveBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  skipBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
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
  suggestionEmoji: {
    fontSize: 54,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  viewMemoriesBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  viewMemoriesBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  maybeLaterBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maybeLaterBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
  },
});

export default MoodScreen;

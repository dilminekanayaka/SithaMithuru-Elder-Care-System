import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';
import Text from '../../components/AppText';
import AccessibleButton from '../../components/AccessibleButton';
import VoiceDictationModal from '../../components/VoiceDictationModal';
import { colors, radius, spacing, elevation } from '../../theme';

const { width } = Dimensions.get('window');

interface JournalProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  elderId?: string;
  token?: string;
  userName?: string;
}

interface JournalEntry {
  id: number;
  date: string;
  title: string;
  content: string;
  mood?: string;
}

const JournalScreen: React.FC<JournalProps> = ({ onBack, onNavigate, elderId, token, userName = "Sanath" }) => {
  const [viewMode, setViewMode] = useState<'list' | 'write'>('list');
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: 1,
      date: 'Jan 24, 2026',
      title: 'A beautiful morning',
      content: 'Today I woke up feeling very energetic. The birds were singing and the sun was shining bright.',
      mood: 'Happy'
    },
  ]);
  const [loading, setLoading] = useState(false);

  // Load live journal entries dynamically from SQLite DB & API
  const loadJournalEntries = React.useCallback(async () => {
    setLoading(true);
    try {
      const { getDB } = require('../../database/db');
      const { apiFetch } = require('../../services/api');
      const db = await getDB();

      const localJournals = await db.getAllAsync(
        'SELECT * FROM journal_entries_local WHERE elder_id = ? OR elder_id = ? ORDER BY created_at DESC',
        [elderId ? String(elderId) : 'elder_default', 'elder_default']
      );

      let fetchedEntries = localJournals || [];

      if (elderId && token) {
        try {
          const res = await apiFetch(`/journal/elder/${elderId}`, token);
          if (res && Array.isArray(res.entries)) {
            fetchedEntries = res.entries;
          }
        } catch {
          // Fallback to SQLite cache
        }
      }

      if (fetchedEntries.length > 0) {
        const formatted: JournalEntry[] = fetchedEntries.map((j: any, idx: number) => ({
          id: j.id || idx + 1,
          date: j.created_at ? new Date(j.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
          title: j.title || 'Memory',
          content: j.content || '',
          mood: j.mood_tag || 'Neutral',
        }));
        setEntries(formatted);
      }
    } catch (e) {
      console.warn('Failed to load journal entries from SQLite:', e);
    } finally {
      setLoading(false);
    }
  }, [elderId, token]);

  React.useEffect(() => {
    loadJournalEntries();
  }, [loadJournalEntries]);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [dictationVisible, setDictationVisible] = useState(false);
  const [dictationField, setDictationField] = useState<'journal_title' | 'journal_content'>('journal_title');

  const handleSave = async () => {
    if (newTitle.trim() && newContent.trim()) {
      const entryId = Date.now();
      const newEntry: JournalEntry = {
        id: entryId,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        title: newTitle.trim(),
        content: newContent.trim(),
        mood: 'Neutral'
      };
      setEntries([newEntry, ...entries]);
      setNewTitle('');
      setNewContent('');
      setViewMode('list');

      // Offline-First: Write journal entry to SQLite local table
      try {
        const { getDB } = require('../../database/db');
        const { syncService } = require('../../services/syncService');
        const db = await getDB();

        await db.runAsync(
          `INSERT INTO journal_entries_local (id, elder_id, title, content, mood_tag, audio_url, created_at, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
          [`journal_${entryId}`, elderId || 'elder_default', newEntry.title, newEntry.content, 'Neutral', null, new Date().toISOString()]
        );

        // Trigger background sync if token provided
        if (elderId && token) {
          syncService.syncOfflineQueue(elderId, token).catch(() => {});
        }
      } catch (e) {
        console.warn('Failed to save journal entry to SQLite local table:', e);
      }
    }
  };

  const handleTextDictated = (text: string) => {
    if (dictationField === 'journal_title') {
      setNewTitle(text);
    } else {
      setNewContent(text);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <AccessibleButton
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Back / ආපසු"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={32} color={colors.text.primary} />
        </AccessibleButton>
        <Text style={styles.headerTitle} isHeader>{viewMode === 'list' ? 'My Journal' : 'New Entry'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {viewMode === 'list' ? (
          <>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
               <View style={styles.introSection}>
                  <Text style={styles.greeting} isHeader>Hello, {userName}</Text>
                  <Text style={styles.subGreeting}>Capture your memories and thoughts.</Text>
               </View>

               <TouchableOpacity
                 style={styles.composeButton}
                 onPress={() => setViewMode('write')}
                 accessibilityRole="button"
                 accessibilityLabel="Write New Journal Entry button"
               >
                   <View style={styles.composeIcon}>
                       <MaterialCommunityIcons name="plus" size={32} color={colors.onPrimary} />
                   </View>
                   <Text style={styles.composeText}>Write New Entry / අලුත් සටහනක්</Text>
               </TouchableOpacity>

               <Text style={styles.sectionTitle} isHeader>Recent Entries</Text>

               <View style={styles.entriesList}>
                  {entries.map((entry) => (
                      <View key={entry.id} style={styles.entryCard} accessibilityLabel={`Journal entry on ${entry.date}: ${entry.title}`}>
                          <View style={styles.entryHeader}>
                              <Text style={styles.entryDate}>{entry.date}</Text>
                              <MaterialCommunityIcons name="bookmark-outline" size={20} color={colors.text.secondary} />
                          </View>
                          <Text style={styles.entryTitle} isHeader>{entry.title}</Text>
                          <Text style={styles.entryContent} numberOfLines={3}>{entry.content}</Text>
                      </View>
                  ))}
               </View>
            </ScrollView>
          </>
        ) : (
          <ScrollView contentContainerStyle={styles.writeContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.dateDisplay}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                   style={styles.titleInput}
                   placeholder="Title your memory / මාතෘකාව..."
                   placeholderTextColor={colors.text.disabled}
                   value={newTitle}
                   onChangeText={setNewTitle}
                   accessibilityLabel="Journal Title input"
                   accessibilityRole="text"
                />
                <AccessibleButton
                  style={styles.micInputBtn}
                  onPress={() => {
                    setDictationField('journal_title');
                    setDictationVisible(true);
                  }}
                  accessibilityLabel="Dictate title using voice"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="microphone" size={28} color={colors.primary} />
                </AccessibleButton>
              </View>

              {/* Large Voice Dictation Trigger for Journal Content */}
              <TouchableOpacity
                style={styles.voiceButton}
                onPress={() => {
                  setDictationField('journal_content');
                  setDictationVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Dictate journal body using voice"
                accessibilityHint="Opens voice input dictation helper"
              >
                  <View style={styles.micCircle}>
                     <MaterialCommunityIcons name="microphone" size={28} color={colors.onPrimary} />
                  </View>
                  <Text style={styles.voiceText}>Dictate Entry / හඬින් සටහන් කරන්න</Text>
              </TouchableOpacity>

              <TextInput
                 style={styles.contentInput}
                 placeholder="Start writing here / මෙතැනින් ලියන්න..."
                 placeholderTextColor={colors.text.disabled}
                 multiline
                 textAlignVertical="top"
                 value={newContent}
                 onChangeText={setNewContent}
                 accessibilityLabel="Journal Content input"
                 accessibilityRole="text"
              />

              <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setViewMode('list')} accessibilityRole="button">
                      <Text style={styles.cancelText}>Cancel / එපා</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, (!newTitle.trim() || !newContent.trim()) && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={!newTitle.trim() || !newContent.trim()}
                    accessibilityRole="button"
                  >
                      <Text style={styles.saveText}>Save Entry / සුරකින්න</Text>
                  </TouchableOpacity>
              </View>
          </ScrollView>
        )}
      </View>

      {/* Voice Dictation Modal */}
      <VoiceDictationModal
        visible={dictationVisible}
        onClose={() => setDictationVisible(false)}
        onTextDictated={handleTextDictated}
        fieldType={dictationField}
        fieldName={dictationField === 'journal_title' ? 'Journal Title' : 'Journal Content'}
      />
      
      <BottomNavBar activeTab="" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s4,
    borderBottomWidth: 1,
    borderColor: colors.outlineVariant,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s12 + 60,
  },
  introSection: {
    marginBottom: spacing.s5,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.s1,
  },
  subGreeting: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  composeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.s4,
    borderRadius: radius.xl,
    marginBottom: spacing.s5,
    ...elevation.e2,
  },
  composeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s4,
  },
  composeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onPrimary,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.s4,
  },
  entriesList: {
    gap: spacing.s4,
  },
  entryCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.xl,
    padding: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s2,
  },
  entryDate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  entryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.s2,
  },
  entryContent: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 22,
  },
  writeContent: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s12 + 60,
  },
  dateDisplay: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.s4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    marginBottom: spacing.s4,
    paddingRight: spacing.s2,
  },
  titleInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    paddingVertical: spacing.s2,
  },
  micInputBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    padding: spacing.s3,
    borderRadius: radius.lg,
    marginBottom: spacing.s4,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  micCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s3,
  },
  voiceText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  contentInput: {
    fontSize: 18,
    color: colors.text.primary,
    lineHeight: 28,
    minHeight: 220,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.lg,
    padding: spacing.s4,
    backgroundColor: colors.background,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.s5,
  },
  cancelButton: {
    flex: 0.45,
    height: 56,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  saveButton: {
    flex: 0.45,
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.e2,
  },
  disabledButton: {
    backgroundColor: colors.text.disabled,
    elevation: 0,
  },
  saveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onPrimary,
  },
});

export default JournalScreen;

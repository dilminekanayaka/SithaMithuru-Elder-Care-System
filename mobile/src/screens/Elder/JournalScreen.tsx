import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';

const { width } = Dimensions.get('window');

interface JournalProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

interface JournalEntry {
  id: number;
  date: string;
  title: string;
  content: string;
  mood?: string;
}

const JournalScreen: React.FC<JournalProps> = ({ onBack, onNavigate }) => {
  const [viewMode, setViewMode] = useState<'list' | 'write'>('list');
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: 1,
      date: 'Jan 24, 2026',
      title: 'A beautiful morning',
      content: 'Today I woke up feeling very energetic. The birds were singing and the sun was shining bright. I had tea with my daughter.',
      mood: 'Happy'
    },
    {
      id: 2,
      date: 'Jan 22, 2026',
      title: 'Garden work',
      content: 'Spent some time in the garden watering the plants. The roses are blooming beautifully this year.',
      mood: 'Calm'
    }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleSave = () => {
    if (newTitle.trim() && newContent.trim()) {
      const newEntry: JournalEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        title: newTitle,
        content: newContent,
        mood: 'Neutral' // Could be integrated with Mood selector
      };
      setEntries([newEntry, ...entries]);
      setNewTitle('');
      setNewContent('');
      setViewMode('list');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{viewMode === 'list' ? 'My Journal' : 'New Entry'}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {viewMode === 'list' ? (
          <>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
               <View style={styles.introSection}>
                  <Text style={styles.greeting}>Hello, Sanath</Text>
                  <Text style={styles.subGreeting}>Capture your memories and thoughts.</Text>
               </View>

               <TouchableOpacity style={styles.composeButton} onPress={() => setViewMode('write')}>
                   <View style={styles.composeIcon}>
                       <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
                   </View>
                   <Text style={styles.composeText}>Write New Entry</Text>
               </TouchableOpacity>

               <Text style={styles.sectionTitle}>Recent Entries</Text>

               <View style={styles.entriesList}>
                  {entries.map((entry) => (
                      <View key={entry.id} style={styles.entryCard}>
                          <View style={styles.entryHeader}>
                              <Text style={styles.entryDate}>{entry.date}</Text>
                              <MaterialCommunityIcons name="bookmark-outline" size={20} color="#BDC3C7" />
                          </View>
                          <Text style={styles.entryTitle}>{entry.title}</Text>
                          <Text style={styles.entryContent} numberOfLines={3}>{entry.content}</Text>
                      </View>
                  ))}
               </View>
            </ScrollView>
          </>
        ) : (
          <ScrollView contentContainerStyle={styles.writeContent}>
              <Text style={styles.dateDisplay}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              
              <TextInput
                 style={styles.titleInput}
                 placeholder="Title your memory..."
                 placeholderTextColor="#BDC3C7"
                 value={newTitle}
                 onChangeText={setNewTitle}
              />

              <TextInput
                 style={styles.contentInput}
                 placeholder="Start writing here..."
                 placeholderTextColor="#BDC3C7"
                 multiline
                 textAlignVertical="top"
                 value={newContent}
                 onChangeText={setNewContent}
              />

              <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setViewMode('list')}>
                      <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                      <Text style={styles.saveText}>Save Entry</Text>
                  </TouchableOpacity>
              </View>
          </ScrollView>
        )}
      </View>
      
      {/* Pass empty activeTab to not highlight any specific bottom nav item */}
      <BottomNavBar activeTab="" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  introSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  composeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  composeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  composeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  entriesList: {
    gap: 16,
  },
  entryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#95A5A6',
    textTransform: 'uppercase',
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  entryContent: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 22,
  },
  // Write Mode Styles
  writeContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  dateDisplay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#95A5A6',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  contentInput: {
    fontSize: 18,
    color: '#2C3E50',
    lineHeight: 28,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  cancelButton: {
    flex: 0.45,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  saveButton: {
    flex: 0.45,
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default JournalScreen;

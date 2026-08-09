import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import Text from '../../components/AppText';
import AccessibleButton from '../../components/AccessibleButton';
import VoiceDictationModal from '../../components/VoiceDictationModal';
import { colors, typography, spacing, radius, elevation } from '../../theme';

interface MoodProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  elderId?: string;
  token?: string;
  isOnline?: boolean;
}

const MoodScreen: React.FC<MoodProps> = ({ onBack, onNavigate }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>('Happy');
  const [note, setNote] = useState('');
  const [dictationVisible, setDictationVisible] = useState(false);

  const moods = [
    { id: 'Happy', icon: 'emoticon-happy-outline', color: '#D4F5E9', accent: '#27AE60', label: 'Happy' },
    { id: 'Okay', icon: 'emoticon-neutral-outline', color: '#FFF5D6', accent: '#F1C40F', label: 'Okay' },
    { id: 'Sad', icon: 'emoticon-sad-outline', color: '#EBF2FF', accent: '#2D8CFF', label: 'Sad' },
    { id: 'Tired', icon: 'sleep', color: '#F2E6FF', accent: '#9D4DFF', label: 'Tired' },
  ];

  const recentMoods = [
    { day: 'Wed', icon: 'emoticon-happy-outline', color: '#27AE60' },
    { day: 'Tue', icon: 'emoticon-neutral-outline', color: '#F1C40F' },
    { day: 'Mon', icon: 'emoticon-happy-outline', color: '#27AE60' },
  ];

  const handleTextDictated = (text: string) => {
    setNote(text);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
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
        <Text style={styles.headerTitle} isHeader>Your Mood</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            <Text style={styles.questionTitle} isHeader>How are you feeling?</Text>
            <Text style={styles.questionSubtitle}>Select the face that matches your mood.</Text>

            <View style={styles.moodGrid}>
              {moods.map((mood) => (
                  <TouchableOpacity
                      key={mood.id}
                      style={[
                          styles.moodCard,
                          { backgroundColor: mood.color },
                          selectedMood === mood.id && styles.moodCardSelected
                      ]}
                      onPress={() => setSelectedMood(mood.id)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Feel ${mood.label}`}
                      accessibilityState={{ selected: selectedMood === mood.id }}
                  >
                      <MaterialCommunityIcons 
                          name={mood.icon} 
                          size={64} 
                          color={mood.accent} 
                      />
                      <Text style={[styles.moodLabel, { color: mood.accent }]} isHeader>{mood.label}</Text>
                  </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputSection}>
               <Text style={styles.inputLabel} isHeader>Add a Note (Optional)</Text>
               
               {/* Voice Note Trigger */}
               <TouchableOpacity
                 style={styles.voiceButton}
                 onPress={() => setDictationVisible(true)}
                 accessibilityRole="button"
                 accessibilityLabel="Dictate mood note using voice"
                 accessibilityHint="Opens voice input dictation helper"
               >
                   <View style={styles.micCircle}>
                      <MaterialCommunityIcons name="microphone" size={28} color="#FFFFFF" />
                   </View>
                   <Text style={styles.voiceText}>Tap to Dictate Note / හඬින් ඇතුළත් කරන්න</Text>
               </TouchableOpacity>

               <TextInput
                  style={styles.textInput}
                  placeholder="Or type here..."
                  placeholderTextColor={colors.text.disabled}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={note}
                  onChangeText={setNote}
                  accessibilityLabel="Mood note text description"
                  accessibilityRole="text"
               />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                Toast.show({
                  type: 'success',
                  text1: 'Mood Saved / සිතුවිලි සුරැකුණා',
                  text2: 'Thank you for sharing how you feel.',
                  position: 'top',
                });
              }}
              accessibilityRole="button"
              accessibilityLabel="Save My Mood button"
            >
                <Text style={styles.saveButtonText}>Save My Mood / සුරකින්න</Text>
            </TouchableOpacity>

            <View style={styles.historySection}>
                 <Text style={styles.historyTitle} isHeader>Past 3 Days</Text>
                 <View style={styles.historyRow}>
                     {recentMoods.map((item, idx) => (
                         <View key={idx} style={styles.historyItem} accessibilityLabel={`Mood was ${item.day}`}>
                             <Text style={styles.historyDay}>{item.day}</Text>
                             <MaterialCommunityIcons name={item.icon} size={36} color={item.color} />
                         </View>
                     ))}
                 </View>
             </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Voice Dictation Modal */}
      <VoiceDictationModal
        visible={dictationVisible}
        onClose={() => setDictationVisible(false)}
        onTextDictated={handleTextDictated}
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
    backgroundColor: '#FFFFFF',
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
  scrollContent: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s3,
    paddingBottom: spacing.s12 + 60,
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.s2,
  },
  questionSubtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    marginBottom: spacing.s5,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.s5,
  },
  moodCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    marginBottom: spacing.s4,
  },
  moodCardSelected: {
    borderColor: colors.text.primary,
    borderWidth: 3,
    ...elevation.e3,
  },
  moodLabel: {
    marginTop: spacing.s2,
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputSection: {
      marginBottom: spacing.s5,
  },
  inputLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.s3,
  },
  voiceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      padding: spacing.s4,
      borderRadius: radius.xl,
      marginBottom: spacing.s4,
      borderWidth: 1,
      borderColor: colors.outline,
  },
  micCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.s4,
  },
  voiceText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: radius.xl,
    padding: spacing.s4,
    height: 120,
    fontSize: 18,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  saveButton: {
    backgroundColor: colors.text.primary,
    height: 64,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e2,
    marginBottom: spacing.s6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  historySection: {
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
      paddingTop: spacing.s5,
  },
  historyTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text.secondary,
      marginBottom: spacing.s3,
      textTransform: 'uppercase',
  },
  historyRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
  },
  historyItem: {
      alignItems: 'center',
  },
  historyDay: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: spacing.s2,
      fontWeight: '600',
  },
});

export default MoodScreen;

import React, { useState } from 'react';
import {
  View,
  Text,
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
import BottomNavBar from '../../components/BottomNavBar';

interface MoodProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const MoodScreen: React.FC<MoodProps> = ({ onBack, onNavigate }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>('Happy');
  const [note, setNote] = useState('');

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={32} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Mood</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.questionTitle}>How are you feeling?</Text>
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
                >
                    <MaterialCommunityIcons 
                        name={mood.icon} 
                        size={56} 
                        color={mood.accent} 
                    />
                    <Text style={[styles.moodLabel, { color: mood.accent }]}>{mood.label}</Text>
                </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputSection}>
             <Text style={styles.inputLabel}>Add a Note (Optional)</Text>
             
             {/* Voice Note Placeholder */}
             <TouchableOpacity style={styles.voiceButton}>
                 <View style={styles.micCircle}>
                    <MaterialCommunityIcons name="microphone" size={28} color="#FFFFFF" />
                 </View>
                 <Text style={styles.voiceText}>Tap to Record Voice Note</Text>
             </TouchableOpacity>

             <TextInput
                style={styles.textInput}
                placeholder="Or type here..."
                placeholderTextColor="#BDC3C7"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={note}
                onChangeText={setNote}
             />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={() => console.log('Mood Saved')}>
              <Text style={styles.saveButtonText}>Save My Mood</Text>
          </TouchableOpacity>

          <View style={styles.historySection}>
               <Text style={styles.historyTitle}>Past 3 Days</Text>
               <View style={styles.historyRow}>
                   {recentMoods.map((item, idx) => (
                       <View key={idx} style={styles.historyItem}>
                           <Text style={styles.historyDay}>{item.day}</Text>
                           <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
                       </View>
                   ))}
               </View>
          </View>

      </ScrollView>
      </KeyboardAvoidingView>

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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120, // Increased for BottomNavBar
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 30,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  moodCard: {
    width: '48%', // 2 columns
    aspectRatio: 1, // Square
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    marginBottom: 16,
  },
  moodCardSelected: {
    borderColor: '#2C3E50',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  moodLabel: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputSection: {
      marginBottom: 30,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  voiceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F0F3F4',
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
  },
  micCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#6C63FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
  },
  voiceText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#2C3E50',
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    height: 120,
    fontSize: 16,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#2C3E50',
    paddingVertical: 20,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2C3E50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 40,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  historySection: {
      borderTopWidth: 1,
      borderTopColor: '#F0F0F0',
      paddingTop: 24,
  },
  historyTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#7F8C8D',
      marginBottom: 16,
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
      color: '#95A5A6',
      marginBottom: 8,
      fontWeight: '600',
  },
});

export default MoodScreen;

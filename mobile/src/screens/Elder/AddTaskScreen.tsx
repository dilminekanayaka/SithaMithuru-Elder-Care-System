import React, { useState } from 'react';
import {
  View,
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
import Text from '../../components/AppText';
import AccessibleButton from '../../components/AccessibleButton';
import VoiceDictationModal from '../../components/VoiceDictationModal';
import { colors, radius, spacing, elevation } from '../../theme';

const { width } = Dimensions.get('window');

interface AddTaskProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onSave?: (task: any) => void;
  elderId?: string;
  token?: string;
}

const AddTaskScreen: React.FC<AddTaskProps> = ({ onBack, onNavigate, onSave }) => {
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Health');
  const [time, setTime] = useState('');
  const [dictationVisible, setDictationVisible] = useState(false);
  const [dictationField, setDictationField] = useState<'task' | 'dosage'>('task');

  const categories = [
    { id: 'Health', icon: 'heart-pulse', color: '#EBF5FF', accent: '#2D8CFF' },
    { id: 'Home', icon: 'home', color: '#F2E6FF', accent: '#9D4DFF' },
    { id: 'Social', icon: 'account-group', color: '#FFF5D6', accent: '#F1C40F' },
    { id: 'Leisure', icon: 'book-open-variant', color: '#FFE5E5', accent: '#FF4D4D' },
  ];

  const handleSave = () => {
    if (!title.trim()) return;
    
    const newTask = {
      title,
      category: selectedCategory,
      time,
      completed: false,
    };
    
    console.log('Saving Task:', newTask);
    if (onSave) onSave(newTask);
    onBack();
  };

  const handleTextDictated = (text: string) => {
    if (dictationField === 'task') {
      setTitle(text);
    } else {
      setTime(text);
    }
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
        <Text style={styles.headerTitle} isHeader>Add New Task</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
         
         <View style={styles.formContainer}>
            
            {/* Task Title Input */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Task Name / කර්තව්‍යය</Text>
                <View style={styles.inputContainer}>
                  <TextInput 
                      style={styles.input} 
                      value={title} 
                      onChangeText={setTitle} 
                      placeholder="e.g. Drink Water"
                      placeholderTextColor={colors.text.disabled}
                      accessibilityLabel="Task Name input"
                      accessibilityRole="text"
                  />
                  <AccessibleButton
                    style={styles.micInputBtn}
                    onPress={() => {
                      setDictationField('task');
                      setDictationVisible(true);
                    }}
                    accessibilityLabel="Dictate task name using voice"
                    accessibilityRole="button"
                    accessibilityHint="Opens voice input dictation helper"
                  >
                    <MaterialCommunityIcons name="microphone" size={28} color={colors.primary} />
                  </AccessibleButton>
                </View>
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Category / වර්ගය</Text>
                <View style={styles.categoryGrid}>
                    {categories.map((cat) => (
                        <TouchableOpacity 
                            key={cat.id} 
                            style={[
                                styles.categoryCard, 
                                selectedCategory === cat.id && styles.categoryCardSelected,
                                { borderColor: selectedCategory === cat.id ? cat.accent : colors.outline }
                            ]}
                            onPress={() => setSelectedCategory(cat.id)}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel={`Category ${cat.id}`}
                            accessibilityState={{ selected: selectedCategory === cat.id }}
                        >
                            <View style={[
                                styles.iconBox, 
                                { backgroundColor: selectedCategory === cat.id ? cat.accent : cat.color }
                            ]}>
                                <MaterialCommunityIcons 
                                    name={cat.icon} 
                                    size={24} 
                                    color={selectedCategory === cat.id ? '#FFFFFF' : cat.accent} 
                                />
                            </View>
                            <Text style={[
                                styles.categoryText, 
                                selectedCategory === cat.id && { color: cat.accent, fontWeight: 'bold' }
                            ]}>{cat.id}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Time / Note Input */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Time or Note / වේලාව හෝ සටහන (Optional)</Text>
                <View style={styles.inputContainer}>
                  <TextInput 
                      style={styles.input} 
                      value={time} 
                      onChangeText={setTime} 
                      placeholder="e.g. 2:00 PM"
                      placeholderTextColor={colors.text.disabled}
                      accessibilityLabel="Time or Note input"
                      accessibilityRole="text"
                  />
                  <AccessibleButton
                    style={styles.micInputBtn}
                    onPress={() => {
                      setDictationField('dosage'); // Re-use dosage template configuration for simple strings
                      setDictationVisible(true);
                    }}
                    accessibilityLabel="Dictate time or note using voice"
                    accessibilityRole="button"
                    accessibilityHint="Opens voice input dictation helper"
                  >
                    <MaterialCommunityIcons name="microphone" size={28} color={colors.primary} />
                  </AccessibleButton>
                </View>
            </View>

         </View>

         <TouchableOpacity 
            style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={!title.trim()}
            accessibilityLabel="Create task button"
            accessibilityRole="button"
         >
             <Text style={styles.saveText}>Create Task / එක් කරන්න</Text>
         </TouchableOpacity>

      </ScrollView>

      {/* Voice Dictation Modal */}
      <VoiceDictationModal
        visible={dictationVisible}
        onClose={() => setDictationVisible(false)}
        onTextDictated={handleTextDictated}
        fieldType={dictationField === 'task' ? 'task' : 'dosage'}
        fieldName={dictationField === 'task' ? 'Task Name' : 'Time or Note'}
      />

      <BottomNavBar activeTab="tasks" onNavigate={onNavigate} />
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
    paddingBottom: spacing.s12 + 60, 
  },
  formContainer: {
    marginTop: spacing.s4,
    marginBottom: spacing.s5,
  },
  inputGroup: {
    marginBottom: spacing.s5,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.s3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outline,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.s3,
  },
  categoryCard: {
    width: (width - 52) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.s3,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  categoryCardSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s3,
  },
  categoryText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.successDark,
    height: 64,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s4,
    ...elevation.e2,
  },
  saveButtonDisabled: {
    backgroundColor: colors.text.disabled,
    elevation: 0,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddTaskScreen;

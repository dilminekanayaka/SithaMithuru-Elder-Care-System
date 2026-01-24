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

interface AddTaskProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onSave?: (task: any) => void;
}

const AddTaskScreen: React.FC<AddTaskProps> = ({ onBack, onNavigate, onSave }) => {
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Health');
  const [time, setTime] = useState('');

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Task</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         
         <View style={styles.formContainer}>
            
            {/* Task Title Input */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Task Name</Text>
                <TextInput 
                    style={styles.input} 
                    value={title} 
                    onChangeText={setTitle} 
                    placeholder="e.g. Drink Water"
                    placeholderTextColor="#95A5A6"
                />
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryGrid}>
                    {categories.map((cat) => (
                        <TouchableOpacity 
                            key={cat.id} 
                            style={[
                                styles.categoryCard, 
                                selectedCategory === cat.id && styles.categoryCardSelected,
                                { borderColor: selectedCategory === cat.id ? cat.accent : '#E2E8F0' }
                            ]}
                            onPress={() => setSelectedCategory(cat.id)}
                            activeOpacity={0.8}
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
                <Text style={styles.label}>Time / Note (Optional)</Text>
                <TextInput 
                    style={styles.input} 
                    value={time} 
                    onChangeText={setTime} 
                    placeholder="e.g. 2:00 PM"
                    placeholderTextColor="#95A5A6"
                />
            </View>

         </View>

         <TouchableOpacity 
            style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={!title.trim()}
         >
             <Text style={styles.saveText}>Create Task</Text>
         </TouchableOpacity>

      </ScrollView>

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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, 
  },
  formContainer: {
      marginTop: 20,
      marginBottom: 30,
  },
  inputGroup: {
      marginBottom: 24,
  },
  label: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#2C3E50',
      marginBottom: 12,
  },
  input: {
      backgroundColor: '#F8F9FA',
      borderRadius: 16,
      padding: 18,
      fontSize: 16,
      color: '#2C3E50',
      borderWidth: 1,
      borderColor: '#E2E8F0',
  },
  categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
  },
  categoryCard: {
      width: (width - 52) / 2,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 0,
  },
  categoryCardSelected: {
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
  },
  iconBox: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
  },
  categoryText: {
      fontSize: 14,
      color: '#7F8C8D',
      fontWeight: '500',
  },
  saveButton: {
      backgroundColor: '#27AE60',
      paddingVertical: 18,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: '#27AE60',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
  },
  saveButtonDisabled: {
      backgroundColor: '#BDC3C7',
      shadowOpacity: 0,
      elevation: 0,
  },
  saveText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
  },
});

export default AddTaskScreen;

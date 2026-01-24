import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';

const { width } = Dimensions.get('window');

interface TasksProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const TasksScreen: React.FC<TasksProps> = ({ onBack, onNavigate }) => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Drink Water (8 glasses)', completed: false, category: 'Health', icon: 'cup-water', color: '#EBF5FF', accent: '#2D8CFF' },
    { id: 2, title: 'Take a short walk', completed: false, category: 'Health', icon: 'walk', color: '#E5F9E5', accent: '#27AE60' },
    { id: 3, title: 'Call Grama Niladhari', completed: true, category: 'Social', icon: 'phone', color: '#FFF5D6', accent: '#F1C40F' },
    { id: 4, title: 'Water the plants', completed: false, category: 'Home', icon: 'flower', color: '#F2E6FF', accent: '#9D4DFF' },
    { id: 5, title: 'Read a Book', completed: false, category: 'Leisure', icon: 'book-open-variant', color: '#FFE5E5', accent: '#FF4D4D' },
  ]);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = (completedCount / tasks.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Tasks</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summarySection}>
          <Text style={styles.dateLabel}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          
          <View style={styles.progressContainer}>
             <View style={styles.progressHeader}>
                <View style={styles.progressTextView}>
                    <Text style={styles.progressLabel}>Daily Goals</Text>
                    <Text style={styles.progressValue}>{completedCount} of {tasks.length} Completed</Text>
                </View>
                {progressPercent === 100 && (
                    <View style={styles.starBadge}>
                         <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
                    </View>
                )}
             </View>
             <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
             </View>
          </View>
        </View>

        <View style={styles.subHeaderRow}>
            <Text style={styles.subHeader}>Today's List</Text>
            <TouchableOpacity style={styles.addTaskButton} onPress={() => onNavigate('addTask')}>
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.addTaskText}>Add Task</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.taskList}>
           {tasks.map((task) => (
             <TouchableOpacity 
                key={task.id} 
                style={[
                    styles.taskCard,
                    task.completed && styles.taskCardCompleted
                ]}
                activeOpacity={0.8}
                onPress={() => toggleTask(task.id)}
             >
                <View style={[styles.iconBox, { backgroundColor: task.completed ? '#F0F0F0' : task.color }]}>
                     <MaterialCommunityIcons name={task.icon} size={28} color={task.completed ? '#BDC3C7' : task.accent} />
                </View>

                <View style={styles.taskInfo}>
                    <Text style={[
                          styles.categoryLabel,
                          task.completed && { color: '#BDC3C7' }
                        ]}>
                        {task.category}
                    </Text>
                    <Text style={[
                          styles.taskTitle,
                          task.completed && styles.taskTitleCompleted
                        ]}
                    >
                        {task.title}
                    </Text>
                </View>

                <View style={[
                      styles.checkbox,
                      task.completed ? styles.checkboxChecked : styles.checkboxUnchecked
                    ]}
                >
                    {task.completed && <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />}
                </View>
             </TouchableOpacity>
           ))}
        </View>

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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Added padding for navbar
  },
  summarySection: {
    marginTop: 10,
    marginBottom: 30,
  },
  dateLabel: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  progressContainer: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTextView: {
     flex: 1,
  },
  progressLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  progressValue: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  starBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFF9C4',
      justifyContent: 'center',
      alignItems: 'center',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 6,
  },
  subHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
  },
  subHeader: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#2C3E50',
  },
  addTaskButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#27AE60',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      shadowColor: '#27AE60',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
  },
  addTaskText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
      marginLeft: 4,
  },
  taskList: {
    gap: 16,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardCompleted: {
    backgroundColor: '#FAFAFA',
    borderColor: '#F0F0F0',
  },
  iconBox: {
      width: 48,
      height: 48,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
  },
  taskInfo: {
      flex: 1,
  },
  categoryLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: '#95A5A6',
      textTransform: 'uppercase',
      marginBottom: 4,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 2,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxUnchecked: {
    borderColor: '#BDC3C7',
  },
  checkboxChecked: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#BDC3C7',
  },
});

export default TasksScreen;

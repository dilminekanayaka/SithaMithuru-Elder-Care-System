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
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';

const { width } = Dimensions.get('window');

interface MedicinesProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  elderId?: string;
  token?: string;
  isOnline?: boolean;
}

const MedicinesScreen: React.FC<MedicinesProps> = ({ onBack, onNavigate }) => {
  // Group medicines by session for clearer categorization
  const [sessions, setSessions] = useState([
      {
          id: 'morning',
          title: 'Morning',
          icon: 'weather-sunny',
          color: '#FFB800',
          bgColor: '#FFFBE6',
          timeRange: '8:00 AM - 10:00 AM',
          medicines: [
             { id: 1, name: 'Blood Pressure', dosage: '1 Pill', taken: true, icon: 'pill' },
             { id: 2, name: 'Vitamin D', dosage: '1 Capsule', taken: true, icon: 'pill' },
          ]
      },
      {
          id: 'afternoon',
          title: 'Afternoon',
          icon: 'weather-partly-cloudy',
          color: '#2D8CFF',
          bgColor: '#E6F0FF',
          timeRange: '12:00 PM - 2:00 PM',
          medicines: [
             { id: 3, name: 'Diabetes', dosage: '1 Pill', taken: false, icon: 'pill' },
          ]
      },
      {
          id: 'night',
          title: 'Night',
          icon: 'weather-night',
          color: '#6C63FF',
          bgColor: '#F2E6FF',
          timeRange: '8:00 PM - 10:00 PM',
          medicines: [
             { id: 4, name: 'Cholesterol', dosage: '1 Pill', taken: false, icon: 'pill' },
             { id: 5, name: 'Sleep Aid', dosage: '1/2 Pill', taken: false, icon: 'pill' },
          ]
      }
  ]);

  const toggleMedicine = (sessionId: string, medId: string) => {
      setSessions(prev => prev.map(session => {
          if (session.id === sessionId) {
              return {
                  ...session,
                  medicines: session.medicines.map(med => 
                      med.id === medId ? { ...med, taken: !med.taken } : med
                  )
              };
          }
          return session;
      }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={32} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Medicines</Text>
        <View style={{ width: 32 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.summaryCard}>
            <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>Today's Progress</Text>
                <Text style={styles.summarySubtitle}>You have taken 2 of 5 medicines.</Text>
            </View>
            <View style={styles.circularProgress}>
                 <MaterialCommunityIcons name="trophy-variant-outline" size={32} color="#FFFFFF" />
            </View>
        </View>

        {sessions.map((session) => (
            <View key={session.id} style={styles.sessionContainer}>
                
                <View style={styles.sessionHeader}>
                    <View style={[styles.sessionIconBox, { backgroundColor: session.bgColor }]}>
                        <MaterialCommunityIcons name={session.icon} size={28} color={session.color} />
                    </View>
                    <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle}>{session.title}</Text>
                        <Text style={styles.sessionTime}>{session.timeRange}</Text>
                    </View>
                </View>

                {session.medicines.map((med) => (
                    <TouchableOpacity 
                        key={med.id} 
                        style={[
                            styles.medCard, 
                            med.taken && styles.medCardTaken,
                            med.taken && { borderColor: session.color }
                        ]}
                        activeOpacity={0.8}
                        onPress={() => toggleMedicine(session.id, med.id)}
                    >
                        {/* Big Checkbox */}
                        <View style={[
                            styles.checkbox, 
                            med.taken && { backgroundColor: session.color, borderColor: session.color }
                        ]}>
                             {med.taken && <MaterialCommunityIcons name="check" size={24} color="#FFFFFF" />}
                        </View>

                        <View style={styles.medIconBox}>
                             <MaterialCommunityIcons name={med.icon} size={32} color={med.taken ? session.color : '#BDC3C7'} />
                        </View>

                        <View style={styles.medDetails}>
                             <Text style={[styles.medName, med.taken && styles.textTaken]}>{med.name}</Text>
                             <Text style={styles.medDosage}>{med.dosage}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

            </View>
        ))}

      </ScrollView>
      <BottomNavBar activeTab="medicines" onNavigate={onNavigate} />
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
    paddingBottom: 120, // Added padding for navbar
  },
  summaryCard: {
      backgroundColor: '#6C63FF',
      borderRadius: 24,
      padding: 24,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 30,
      shadowColor: '#6C63FF',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
  },
  summaryText: {
      flex: 1,
  },
  summaryTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 6,
  },
  summarySubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.9)',
  },
  circularProgress: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  sessionContainer: {
      marginBottom: 30,
  },
  sessionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
  },
  sessionIconBox: {
      width: 48,
      height: 48,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
  },
  sessionInfo: {
      flex: 1,
  },
  sessionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#2C3E50',
  },
  sessionTime: {
      fontSize: 14,
      color: '#4A5568',
  },
  medCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8F9FA',
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: '#F0F0F0',
  },
  medCardTaken: {
      backgroundColor: '#FFFFFF',
  },
  checkbox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#BDC3C7',
      marginRight: 16,
      justifyContent: 'center',
      alignItems: 'center',
  },
  medIconBox: {
      marginRight: 16,
      width: 40,
      alignItems: 'center',
  },
  medDetails: {
      flex: 1,
  },
  medName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2C3E50',
  },
  textTaken: {
      textDecorationLine: 'line-through',
      color: '#95A5A6',
  },
  medDosage: {
      fontSize: 14,
      color: '#4A5568',
      marginTop: 2,
  },
});

export default MedicinesScreen;

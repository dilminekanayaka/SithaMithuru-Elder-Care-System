import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  Vibration,
  Linking,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';

const { width } = Dimensions.get('window');

interface EmergencySOSProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const EmergencySOSScreen: React.FC<EmergencySOSProps> = ({ onBack, onNavigate }) => {
  const [isPressing, setIsPressing] = useState(false);
  const [progress] = useState(new Animated.Value(0));
  const [sosSent, setSosSent] = useState(false);

  const startSOS = () => {
    setIsPressing(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        sendSOS();
      }
    });
  };

  const cancelSOS = () => {
    setIsPressing(false);
    progress.setValue(0);
    progress.stopAnimation();
  };

  const sendSOS = () => {
    setSosSent(true);
    Vibration.vibrate([0, 500, 200, 500]); 
    console.log('SOS ALARM SENT');
  };

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const emergencyContacts = [
    { id: 1, name: 'Daughter', number: '071XXXXXXX', icon: 'account-child-circle', color: '#6C63FF' },
    { id: 2, name: 'Son', number: '077XXXXXXX', icon: 'face-man-profile', color: '#2D8CFF' },
    { id: 3, name: 'Doctor', number: '011XXXXXXX', icon: 'doctor', color: '#27AE60' },
    { id: 4, name: 'Ambulance', number: '1990', icon: 'ambulance', color: '#E74C3C' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={32} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!sosSent ? (
          <>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Emergency Help</Text>
              <Text style={styles.subtitle}>
                Press and hold button for 3 seconds
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                activeOpacity={1}
                onPressIn={startSOS}
                onPressOut={cancelSOS}
                style={[
                  styles.sosButton,
                  isPressing && styles.sosButtonPressed
                ]}
              >
                <View style={styles.innerCircle}>
                    <MaterialCommunityIcons name="alert" size={72} color="#FFFFFF" />
                    <Text style={styles.sosText}>SOS</Text>
                </View>
                <Animated.View 
                    style={[
                        styles.progressOverlay, 
                        { height: widthInterpolated } 
                    ]} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
               <MaterialCommunityIcons name="map-marker-radius" size={24} color="#7F8C8D" /> 
               <Text style={styles.infoText}>
                 Sharing live location with 2 guardians.
               </Text>
            </View>

            <Text style={styles.sectionTitle}>Quick Call</Text>
            <View style={styles.gridContainer}>
                {emergencyContacts.map((contact) => (
                    <TouchableOpacity 
                        key={contact.id} 
                        style={[styles.contactCard, { borderColor: contact.color }]}
                        onPress={() => console.log(`Calling ${contact.name}...`)}
                    >
                        <MaterialCommunityIcons name={contact.icon} size={40} color={contact.color} />
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.contactNumber}>{contact.number}</Text>
                    </TouchableOpacity>
                ))}
            </View>
          </>
        ) : (
          <View style={styles.sentContainer}>
            <View style={styles.successIcon}>
               <MaterialCommunityIcons name="check" size={60} color="#FFFFFF" />
            </View>
            <Text style={styles.sentTitle}>Help is on the way!</Text>
            <Text style={styles.sentSubtitle}>
                We have notified your guardians. Stay calm.
            </Text>
            <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => { setSosSent(false); setIsPressing(false); progress.setValue(0); }}
            >
                <Text style={styles.cancelButtonText}>I am safe now</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <BottomNavBar activeTab="sos" onNavigate={onNavigate} />
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
    paddingBottom: 120, 
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800', 
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  sosButton: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FF4D4D', 
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden', 
    borderWidth: 8,
    borderColor: '#FFE5E5',
  },
  sosButtonPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: '#E74C3C',
  },
  innerCircle: {
    alignItems: 'center',
    zIndex: 2,
  },
  sosText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 5,
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 1,
  },
  infoBox: {
    backgroundColor: '#F0F3F4',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  infoText: {
    marginLeft: 12,
    color: '#2C3E50',
    fontSize: 16,
    flex: 1,
    fontWeight: '600',
  },
  sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#2C3E50',
      alignSelf: 'flex-start',
      marginBottom: 16,
  },
  gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      width: '100%',
  },
  contactCard: {
      width: (width - 60) / 2, // 2 columns with spacing
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 2,
      // Shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
  },
  contactName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2C3E50',
      marginTop: 8,
  },
  contactNumber: {
      fontSize: 14,
      color: '#7F8C8D',
      marginTop: 4,
  },
  sentContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  sentTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  sentSubtitle: {
    fontSize: 18,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 26,
  },
  cancelButton: {
    paddingVertical: 20,
    paddingHorizontal: 50,
    backgroundColor: '#ECF0F1',
    borderRadius: 40,
  },
  cancelButtonText: {
    color: '#2C3E50',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EmergencySOSScreen;

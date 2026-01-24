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
  Image,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';

const { width } = Dimensions.get('window');

interface EditProfileProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onSave?: (data: any) => void;
}

const EditProfileScreen: React.FC<EditProfileProps> = ({ onBack, onNavigate, onSave }) => {
  const [name, setName] = useState('Sanath Jayaweera');
  const [age, setAge] = useState('72');
  const [phone, setPhone] = useState('0712345678');
  const [bloodType, setBloodType] = useState('O+');
  const [weight, setWeight] = useState('65');
  const [emergencyContact, setEmergencyContact] = useState('Dilmin Ekanayaka');

  const handleSave = () => {
     console.log('Profile Saved');
     if (onSave) {
         onSave({ name, age, phone, bloodType, weight, emergencyContact });
     }
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         
         <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
                <MaterialCommunityIcons name="account" size={60} color="#BDC3C7" />
                 <TouchableOpacity style={styles.cameraButton}>
                    <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
            <Text style={styles.changePhotoText}>Change Photo</Text>
         </View>

         <View style={styles.formContainer}>
            <Text style={styles.sectionLabel}>Personal Details</Text>
            
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput 
                    style={styles.input} 
                    value={name} 
                    onChangeText={setName} 
                    placeholder="Enter your name"
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 0.45 }]}>
                    <Text style={styles.label}>Age</Text>
                    <TextInput 
                        style={styles.input} 
                        value={age} 
                        onChangeText={setAge} 
                        keyboardType="numeric"
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 0.45 }]}>
                    <Text style={styles.label}>Weight (kg)</Text>
                    <TextInput 
                        style={styles.input} 
                        value={weight} 
                        onChangeText={setWeight} 
                        keyboardType="numeric"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput 
                    style={styles.input} 
                    value={phone} 
                    onChangeText={setPhone} 
                    keyboardType="phone-pad"
                />
            </View>

             <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Medical Info</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Blood Type</Text>
                 <View style={styles.bloodTypeRow}>
                     {['A+', 'B+', 'O+', 'AB+'].map(type => (
                         <TouchableOpacity 
                            key={type} 
                            style={[
                                styles.bloodTypeChip,
                                bloodType === type && styles.bloodTypeChipSelected
                            ]}
                            onPress={() => setBloodType(type)}
                         >
                             <Text style={[
                                 styles.bloodTypeText,
                                 bloodType === type && styles.bloodTypeTextSelected
                             ]}>{type}</Text>
                         </TouchableOpacity>
                     ))}
                 </View>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Guardian Info</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Guardian Name</Text>
                 <TextInput 
                    style={styles.input} 
                    value={emergencyContact} 
                    onChangeText={setEmergencyContact} 
                    placeholder="Primary Guardian Name"
                />
            </View>

         </View>

         <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
             <Text style={styles.saveText}>Save Changes</Text>
         </TouchableOpacity>

      </ScrollView>

      <BottomNavBar activeTab="profile" onNavigate={onNavigate} />
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
  avatarSection: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F6FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#2C3E50',
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
  },
  changePhotoText: {
      color: '#6C63FF',
      fontSize: 14,
      fontWeight: '600',
  },
  formContainer: {
      marginBottom: 30,
  },
  sectionLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2C3E50',
      marginBottom: 16,
  },
  inputGroup: {
      marginBottom: 16,
  },
  row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
  label: {
      fontSize: 14,
      color: '#7F8C8D',
      marginBottom: 8,
      fontWeight: '500',
  },
  input: {
      backgroundColor: '#F8F9FA',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: '#2C3E50',
      borderWidth: 1,
      borderColor: '#E2E8F0',
  },
  bloodTypeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
  },
  bloodTypeChip: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E2E8F0',
  },
  bloodTypeChipSelected: {
      backgroundColor: '#E74C3C',
      borderColor: '#E74C3C',
  },
  bloodTypeText: {
      fontSize: 16,
      color: '#7F8C8D',
      fontWeight: '600',
  },
  bloodTypeTextSelected: {
      color: '#FFFFFF',
  },
  saveButton: {
      backgroundColor: '#2C3E50',
      paddingVertical: 18,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: '#2C3E50',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
  },
  saveText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
  },
});

export default EditProfileScreen;

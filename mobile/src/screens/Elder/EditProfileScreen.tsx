import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { API_URL } from '../../services/api';

const { width } = Dimensions.get('window');

interface EditProfileProps {
  userData: any;
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onSave: (updatedUser: any) => Promise<void>;
  token?: string;
}

const EditProfileScreen: React.FC<EditProfileProps> = ({ userData, onBack, onNavigate, onSave, token }) => {
  const [name, setName] = useState(userData?.name || '');
  const [age, setAge] = useState(userData?.age?.toString() || '');
  const [phone, setPhone] = useState(userData?.phone_number || '');
  const [bloodType, setBloodType] = useState(userData?.blood_type || '');
  const [weight, setWeight] = useState(userData?.weight?.toString() || '');
  const [avatar, setAvatar] = useState(userData?.avatar_url || null);
  const [selectedGuardian, setSelectedGuardian] = useState(userData?.primary_guardian_id || null);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingGuardians, setIsFetchingGuardians] = useState(false);

  useEffect(() => {
    fetchGuardians();
  }, []);

  const fetchGuardians = async () => {
    setIsFetchingGuardians(true);
    try {
      const response = await fetch(`${API_URL}/users/guardians/all`);
      const data = await response.json();
      if (response.ok) {
        setGuardians(data);
      }
    } catch (error) {
      console.error('Error fetching guardians:', error);
    } finally {
      setIsFetchingGuardians(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setAvatar(null);
  };

  const handleSave = async () => {
    if (!name) {
      Toast.show({ type: 'error', text1: 'Name is required' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${userData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          age: age ? parseInt(age) : null,
          blood_type: bloodType,
          weight: weight ? parseFloat(weight) : null,
          phone_number: phone,
          avatar_url: avatar,
          primary_guardian_id: selectedGuardian
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile updated successfully'
        });
        if (onSave) {
          onSave(data.user);
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: data.message || 'Error updating profile'
        });
      }
    } catch (error) {
      console.error('Update Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not connect to server'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
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
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitials}>{getInitials(name)}</Text>
                )}
                 <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                    <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <TouchableOpacity onPress={pickImage}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
              {avatar && (
                <TouchableOpacity onPress={removeImage}>
                  <Text style={[styles.changePhotoText, { color: '#E74C3C' }]}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
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
                        placeholder="72"
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 0.45 }]}>
                    <Text style={styles.label}>Weight (kg)</Text>
                    <TextInput 
                        style={styles.input} 
                        value={weight} 
                        onChangeText={setWeight} 
                        keyboardType="numeric"
                        placeholder="65"
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
                    placeholder="07XXXXXXXX"
                />
            </View>

             <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Medical Info</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Blood Type</Text>
                 <View style={styles.bloodTypeRow}>
                     {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => (
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

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Primary Guardian</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Guardian</Text>
                {isFetchingGuardians ? (
                  <ActivityIndicator color="#6C63FF" />
                ) : (
                  <View style={styles.guardianList}>
                    {guardians.map(g => (
                      <TouchableOpacity 
                        key={g.id} 
                        style={[
                          styles.guardianChip,
                          selectedGuardian === g.id && styles.guardianChipSelected
                        ]}
                        onPress={() => setSelectedGuardian(g.id)}
                      >
                        <Text style={[
                          styles.guardianChipText,
                          selectedGuardian === g.id && styles.guardianChipTextSelected
                        ]}>{g.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {guardians.length === 0 && <Text style={{ color: '#4A5568' }}>No guardians found</Text>}
                  </View>
                )}
            </View>

         </View>

         <TouchableOpacity 
            style={[styles.saveButton, isLoading && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={isLoading}
          >
             {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Save Changes</Text>}
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
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
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
      color: '#4A5568',
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
      paddingHorizontal: 15,
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
      fontSize: 14,
      color: '#4A5568',
      fontWeight: '600',
  },
  bloodTypeTextSelected: {
      color: '#FFFFFF',
  },
  guardianList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  guardianChip: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guardianChipSelected: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  guardianChipText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '600',
  },
  guardianChipTextSelected: {
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

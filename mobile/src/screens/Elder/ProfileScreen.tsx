import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';

interface ProfileProps {
  userData: any;
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const ProfileScreen: React.FC<ProfileProps> = ({ userData, onBack, onNavigate }) => {
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
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => onNavigate('editProfile')}>
             <MaterialCommunityIcons name="pencil" size={24} color="#2C3E50" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {userData?.avatar_url ? (
                <Image source={{ uri: userData.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{getInitials(userData?.name)}</Text>
              )}
            </View>
            <Text style={styles.userName}>{userData?.name || "User Name"}</Text>
            <Text style={styles.userAge}>{userData?.age ? `${userData.age} Years Old` : "Age Not Set"}</Text>
          </View>

         {/* Info Cards */}
         <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Info</Text>
            <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <View style={styles.iconBox}>
                       <MaterialCommunityIcons name="water" size={24} color="#E74C3C" />
                    </View>
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Blood Type</Text>
                        <Text style={styles.infoValue}>{userData?.blood_type || "N/A"}</Text>
                    </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                    <View style={[styles.iconBox, { backgroundColor: '#EBF5FF' }]}>
                       <MaterialCommunityIcons name="scale" size={24} color="#2D8CFF" />
                    </View>
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Weight</Text>
                        <Text style={styles.infoValue}>{userData?.weight ? `${userData.weight} kg` : "N/A"}</Text>
                    </View>
                </View>
            </View>
         </View>

         <View style={styles.section}>
            <Text style={styles.sectionTitle}>Primary Guardian</Text>
            {userData?.guardian_name ? (
              <View style={styles.guardianCard}>
                   <View style={styles.guardianAvatar}>
                      <Text style={styles.avatarInitialsSmall}>{getInitials(userData.guardian_name)}</Text>
                   </View>
                   <View style={styles.guardianInfo}>
                       <Text style={styles.guardianName}>{userData.guardian_name}</Text>
                       <Text style={styles.guardianRelation}>{userData.guardian_role || "Guardian"}</Text>
                   </View>
                   <TouchableOpacity style={styles.callButton}>
                       <MaterialCommunityIcons name="phone" size={24} color="#FFFFFF" />
                   </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>No Primary Guardian Assigned</Text>
              </View>
            )}
         </View>

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
    paddingHorizontal: 24,
    paddingBottom: 120, // Increased for BottomNavBar
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  avatarInitialsSmall: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  userAge: {
    fontSize: 16,
    color: '#4A5568',
    marginTop: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#4A5568',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  guardianCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
  },
  guardianAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  guardianInfo: {
    flex: 1,
  },
  guardianName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  guardianRelation: {
    fontSize: 14,
    color: '#4A5568',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
});

export default ProfileScreen;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';

import { Alert } from 'react-native';

interface SettingsProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
  onDeleteAccount?: () => void; // Phase 14
}

const SettingsScreen: React.FC<SettingsProps> = ({ onBack, onLogout, onNavigate, onDeleteAccount }) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone and will erase your medical history from active view.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDeleteAccount && onDeleteAccount() }
      ]
    );
  };

  const renderSettingItem = (icon: string, title: string, value: boolean, onValueChange: (val: boolean) => void) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={icon} size={24} color="#6C63FF" />
        </View>
        <Text style={styles.settingText}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E2E8F0', true: '#C3B5FD' }}
        thumbColor={value ? '#6C63FF' : '#F5F5F5'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         
         <Text style={styles.sectionHeader}>Preferences</Text>
         <View style={styles.card}>
            {renderSettingItem('bell-outline', 'Notifications', notifications, setNotifications)}
            <View style={styles.divider} />
            {renderSettingItem('theme-light-dark', 'Dark Mode', darkMode, setDarkMode)}
            <View style={styles.divider} />
            {renderSettingItem('map-marker-radius', 'Share Live Location', locationSharing, setLocationSharing)}
         </View>

         <Text style={styles.sectionHeader}>Account</Text>
         <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem}>
                <View style={[styles.menuIconBox, { backgroundColor: '#EBF5FF' }]}>
                    <MaterialCommunityIcons name="translate" size={24} color="#2D8CFF" />
                </View>
                <Text style={styles.menuText}>Language</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#BDC3C7" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.menuItem}>
                 <View style={[styles.menuIconBox, { backgroundColor: '#FFF5D6' }]}>
                    <MaterialCommunityIcons name="shield-check-outline" size={24} color="#F1C40F" />
                 </View>
                <Text style={styles.menuText}>Privacy & Security</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#BDC3C7" />
            </TouchableOpacity>
         </View>

         <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
             <Text style={styles.logoutText}>Log Out</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.deleteButton} onPress={confirmDeleteAccount}>
             <MaterialCommunityIcons name="delete-outline" size={20} color="#E53E3E" style={{ marginRight: 8 }} />
             <Text style={styles.deleteText}>Delete Account</Text>
         </TouchableOpacity>

         <Text style={styles.versionText}>Version 1.0.0</Text>

      </ScrollView>

      <BottomNavBar activeTab="settings" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA', // Slightly gray background for settings
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
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
    paddingTop: 20,
    paddingBottom: 120, // Increased for BottomNavBar
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logoutText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#BDC3C7',
    marginTop: 30,
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  deleteText: {
    color: '#E53E3E',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';
import { colors } from '../../theme';

interface SettingsProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
  onDeleteAccount?: () => void;
  biometricEnabled?: boolean;
  onEnableBiometrics?: () => Promise<boolean>;
}

const SettingsScreen: React.FC<SettingsProps> = ({
  onBack,
  onLogout,
  onNavigate,
  onDeleteAccount,
  biometricEnabled,
  onEnableBiometrics,
}) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);

  const handleToggleBiometrics = async (val: boolean) => {
    if (!val || !onEnableBiometrics) return;
    await onEnableBiometrics();
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and will erase your medical history from active view.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteAccount && onDeleteAccount() },
      ]
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    value: boolean,
    onValueChange: (val: boolean) => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
        </View>
        <Text style={styles.settingText}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.outline, true: colors.primaryContainer }}
        thumbColor={value ? colors.primary : colors.background}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text.primary} />
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
          {onEnableBiometrics && (
            <>
              <View style={styles.divider} />
              {renderSettingItem('fingerprint', 'Biometric Login', !!biometricEnabled, handleToggleBiometrics)}
            </>
          )}
        </View>

        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('languageSettings')}>
            <View style={[styles.menuIconBox, { backgroundColor: colors.primaryContainer }]}>
              <MaterialCommunityIcons name="translate" size={24} color={colors.primary} />
            </View>
            <Text style={styles.menuText}>Language</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('privacyData')}>
            <View style={[styles.menuIconBox, { backgroundColor: colors.warningContainer }]}>
              <MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.warning} />
            </View>
            <Text style={styles.menuText}>Privacy & Security</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={confirmDeleteAccount}>
          <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.outline,
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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    fontSize: 16,
    color: colors.text.primary,
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
    color: colors.text.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.outline,
    marginVertical: 12,
  },
  logoutButton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: colors.text.tertiary,
    marginTop: 30,
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: colors.errorContainer,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  deleteText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GuardianSettingsScreenProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  value: boolean;
}

const STORAGE_KEY = '@sithamithuru_guardian_settings';

const GuardianSettingsScreen: React.FC<GuardianSettingsScreenProps> = ({
  onBack,
  onLogout,
  onNavigate,
  onDeleteAccount,
}) => {
  const [toggles, setToggles] = useState<SettingToggle[]>([
    {
      id: 'sos_alerts',
      label: 'SOS Push Alerts',
      description: 'Receive instant push notification when elder triggers SOS',
      icon: 'bell-alert-outline',
      color: '#FF3B30',
      value: true,
    },
    {
      id: 'med_reminders',
      label: 'Medication Reminders',
      description: 'Get notified when elder misses a scheduled medication',
      icon: 'pill',
      color: '#6C63FF',
      value: true,
    },
    {
      id: 'mood_alerts',
      label: 'Mood Check Alerts',
      description: 'Alert when elder logs a negative mood (Sad, Anxious)',
      icon: 'emoticon-sad-outline',
      color: '#FF9500',
      value: false,
    },
    {
      id: 'activity_summary',
      label: 'Daily Summary',
      description: 'Daily digest of elder activity at 8:00 PM',
      icon: 'clipboard-text-outline',
      color: '#34C759',
      value: true,
    },
  ]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: SettingToggle[] = JSON.parse(stored);
          setToggles(parsed);
        }
      } catch (e) {
        // use defaults if loading fails
      }
    };
    loadSettings();
  }, []);

  const handleToggle = async (id: string) => {
    const updated = toggles.map((t) => (t.id === id ? { ...t, value: !t.value } : t));
    setToggles(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      Toast.show({ type: 'success', text1: 'Preference saved', position: 'top', visibilityTime: 1500 });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to save preference', position: 'top', visibilityTime: 1500 });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8FA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Notification Preferences */}
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <View style={styles.card}>
          {toggles.map((toggle, index) => (
            <View
              key={toggle.id}
              style={[styles.settingRow, index < toggles.length - 1 && styles.settingDivider]}
            >
              <View style={[styles.settingIcon, { backgroundColor: toggle.color + '15' }]}>
                <MaterialCommunityIcons name={toggle.icon} size={22} color={toggle.color} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{toggle.label}</Text>
                <Text style={styles.settingDesc}>{toggle.description}</Text>
              </View>
              <Switch
                value={toggle.value}
                onValueChange={() => handleToggle(toggle.id)}
                trackColor={{ false: '#E2E8F0', true: '#BDB5FF' }}
                thumbColor={toggle.value ? '#6C63FF' : '#F5F5F5'}
                accessibilityLabel={`Toggle ${toggle.label}`}
              />
            </View>
          ))}
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          {[
            {
              label: 'My Profile',
              icon: 'account-outline',
              color: '#6C63FF',
              screen: 'guardianProfile',
            },
            {
              label: 'Notifications History',
              icon: 'bell-outline',
              color: '#34C759',
              screen: 'guardianNotifications',
            },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.linkRow, i < arr.length - 1 && styles.settingDivider]}
              onPress={() => onNavigate(item.screen)}
              accessibilityLabel={`Navigate to ${item.label}`}
            >
              <View style={[styles.settingIcon, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={styles.linkLabel}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#BDC3C7" />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={[styles.infoRow, styles.settingDivider]}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>Production</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={onLogout}
          accessibilityLabel="Log out"
        >
          <MaterialCommunityIcons name="logout" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          style={[styles.logoutBtn, { marginTop: 12, borderColor: '#FFD2D2', backgroundColor: '#FFF5F5' }]}
          onPress={() => {
            Alert.alert(
              "Delete Account",
              "Are you sure you want to permanently delete your account? This action cannot be undone and will sever ties with all linked Elders.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => onDeleteAccount && onDeleteAccount() }
              ]
            );
          }}
          accessibilityLabel="Delete Account"
        >
          <MaterialCommunityIcons name="delete-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── BOTTOM NAVIGATION (Floating Rounded Nav Bar) ── */}
      <View style={styles.bottomNavWrapper}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("guardianDashboard")}>
            <MaterialCommunityIcons name="home-outline" size={24} color="#4A5568" />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("guardianNotifications")}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#4A5568" />
            <Text style={styles.navLabel}>Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("elderActivity")}>
            <MaterialCommunityIcons name="history" size={24} color="#4A5568" />
            <Text style={styles.navLabel}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("guardianSettings")}>
            <MaterialCommunityIcons name="cog" size={26} color="#6C63FF" />
            <Text style={[styles.navLabel, { color: "#6C63FF" }]}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#2C3E50' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 110 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#95A5A6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  settingDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '700', color: '#2C3E50' },
  settingDesc: { fontSize: 12, color: '#4A5568', marginTop: 2, lineHeight: 16 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  linkLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: '#2C3E50' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  infoLabel: { fontSize: 15, color: '#4A5568', fontWeight: '600' },
  infoValue: { fontSize: 15, color: '#2C3E50', fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FFD2D2',
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#FF3B30' },
  // ── Bottom Nav ──
  bottomNavWrapper: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 72,
    borderRadius: 36,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4A5568",
    marginTop: 4,
  },
});

export default GuardianSettingsScreen;

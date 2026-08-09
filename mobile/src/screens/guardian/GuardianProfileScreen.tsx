import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { apiFetch } from '../../services/api';
import { SessionExpiredError } from '../../services/api';

interface GuardianProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
  onSessionExpired: () => void;
  userData: any;
  token: string;
  onSave: (updatedUser: any) => void;
}

const GuardianProfileScreen: React.FC<GuardianProfileScreenProps> = ({
  onBack,
  onLogout,
  onSessionExpired,
  userData,
  token,
  onSave,
}) => {
  const [name, setName] = useState(userData?.name || '');
  const [phone, setPhone] = useState(userData?.phone_number || '');
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const initials = name
    ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'G';

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Name is required', position: 'top' });
      return;
    }
    setSaving(true);
    try {
      const updated = await apiFetch(`/users/${userData.id}`, token, {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), phone_number: phone.trim() || null }),
      });
      Toast.show({ type: 'success', text1: 'Profile Updated', position: 'top' });
      onSave(updated);
      setEditMode(false);
    } catch (error: any) {
      if (error instanceof SessionExpiredError) { onSessionExpired(); return; }
      Toast.show({ type: 'error', text1: 'Update Failed', text2: error.message, position: 'top' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={26} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          onPress={() => editMode ? handleSave() : setEditMode(true)}
          style={styles.editBtn}
          accessibilityLabel={editMode ? 'Save profile' : 'Edit profile'}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#6C63FF" />
          ) : (
            <Text style={styles.editBtnText}>{editMode ? 'Save' : 'Edit'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.roleBadge}>Guardian</Text>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Information</Text>

          <Text style={styles.label}>Full Name</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor="#95A5A6"
              autoCapitalize="words"
              accessibilityLabel="Full name input"
            />
          ) : (
            <Text style={styles.value}>{userData?.name || '—'}</Text>
          )}

          <Text style={styles.label}>Email</Text>
          <Text style={[styles.value, styles.mutedValue]}>{userData?.email || '—'}</Text>

          <Text style={styles.label}>Phone Number</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +94 77 123 4567"
              placeholderTextColor="#95A5A6"
              keyboardType="phone-pad"
              accessibilityLabel="Phone number input"
            />
          ) : (
            <Text style={styles.value}>{userData?.phone_number || '—'}</Text>
          )}
        </View>

        {/* Guardian ID Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Guardian ID</Text>
          <View style={styles.idRow}>
            <MaterialCommunityIcons name="shield-account-outline" size={20} color="#6C63FF" />
            <Text style={styles.idText}>#{userData?.id}</Text>
          </View>
          <Text style={styles.idHint}>
            Share your email with elders so they can link with your account.
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          accessibilityLabel="Log out"
        >
          <MaterialCommunityIcons name="logout" size={20} color="#E74C3C" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#2C3E50' },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0EEFF',
    borderRadius: 20,
  },
  editBtnText: { fontSize: 14, fontWeight: '700', color: '#6C63FF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarText: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' },
  roleBadge: {
    backgroundColor: '#F0EEFF',
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#95A5A6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#95A5A6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 12,
  },
  value: { fontSize: 16, fontWeight: '600', color: '#2C3E50', paddingVertical: 4 },
  mutedValue: { color: '#4A5568' },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  idText: { fontSize: 18, fontWeight: '800', color: '#6C63FF' },
  idHint: { fontSize: 13, color: '#4A5568', lineHeight: 18 },
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
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#E74C3C' },
});

export default GuardianProfileScreen;

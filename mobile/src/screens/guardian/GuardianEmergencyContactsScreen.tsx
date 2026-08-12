/**
 * GuardianEmergencyContactsScreen.tsx — Module 6 (Screen 23 Emergency Contacts Management)
 *
 * Priorities:
 *  • Complete list of emergency contact personnel & order of priority
 *  • Quick phone dial trigger
 *  • Add / Edit emergency contacts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface ContactItem {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  is_primary: boolean;
}

interface GuardianEmergencyContactsScreenProps {
  onBack: () => void;
}

const GuardianEmergencyContactsScreen: React.FC<GuardianEmergencyContactsScreenProps> = ({ onBack }) => {
  const [contacts, setContacts] = useState<ContactItem[]>([
    { id: '1', name: 'Dr. Priyantha Silva', relationship: 'Primary Physician', phone: '+94771234567', is_primary: true },
    { id: '2', name: 'Chamari Nimesha', relationship: 'Daughter / Guardian', phone: '+94719876543', is_primary: true },
    { id: '3', name: 'Suwaseriya Ambulance Service', relationship: 'National Emergency', phone: '1990', is_primary: false },
  ]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Toast.show({ type: 'error', text1: 'Dialer Error', text2: 'Could not place call' });
    });
  };

  const renderItem = ({ item, index }: { item: ContactItem; index: number }) => (
    <View style={styles.card}>
      <View style={styles.priorityBadge}>
        <Text style={styles.priorityText}>#{index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.contactName}>{item.name}</Text>
          {item.is_primary && (
            <View style={styles.primaryChip}>
              <Text style={styles.chipText}>PRIMARY</Text>
            </View>
          )}
        </View>
        <Text style={styles.contactSub}>{item.relationship} • {item.phone}</Text>
      </View>

      <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(item.phone)}>
        <MaterialCommunityIcons name="phone" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <ScreenHeader title="Emergency Contacts" onBack={onBack} />

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: { padding: spacing.s1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  listContent: { padding: spacing.s5, gap: spacing.s3 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    backgroundColor: colors.surface,
    padding: spacing.s4,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e1,
  },
  priorityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: { fontSize: 12, fontWeight: '900', color: colors.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactName: { fontSize: 16, fontWeight: '800', color: colors.text.primary },
  contactSub: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  primaryChip: { backgroundColor: colors.primaryContainer, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  chipText: { fontSize: 9, fontWeight: '900', color: colors.primary },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GuardianEmergencyContactsScreen;

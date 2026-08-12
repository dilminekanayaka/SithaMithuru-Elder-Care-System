/**
 * MyEldersScreen.tsx — Guardian Mode (Module 3.1 My Elders)
 *
 * Priorities:
 *  • Complete list of all linked elders with real-time health badges
 *  • Instant search filtering by name or phone
 *  • Quick call action & navigation to Elder Overview / Manage Elder
 *  • Add / Connect Elder CTA button
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

interface MyEldersScreenProps {
  onBack: () => void;
  token: string;
  onNavigate: (screen: string) => void;
  onSelectElder: (elderId: string) => void;
  onSessionExpired?: () => void;
}

export interface ElderItem {
  id: string;
  name: string;
  phone_number?: string;
  age?: number;
  is_online?: boolean;
  active_emergency?: boolean;
}

const MyEldersScreen: React.FC<MyEldersScreenProps> = ({
  onBack,
  token,
  onNavigate,
  onSelectElder,
  onSessionExpired,
}) => {
  const [elders, setElders] = useState<ElderItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchElders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await apiFetch('/guardian/elders', token);
      const list = Array.isArray(res) ? res : res?.data || [];
      setElders(list);
    } catch (e: any) {
      if (e instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setElders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, onSessionExpired]);

  useEffect(() => {
    fetchElders();
  }, [fetchElders]);

  const filteredElders = elders.filter((e) =>
    (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.phone_number || '').includes(search)
  );

  const handleCall = (phone?: string) => {
    Haptics.selectionAsync();
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  const handleElderPress = (elder: ElderItem) => {
    onSelectElder(elder.id);
    onNavigate('elderOverview');
  };

  const renderItem = ({ item }: { item: ElderItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleElderPress(item)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Elder ${item.name}`}
    >
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account-check" size={32} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.elderName}>{item.name}</Text>
            {item.active_emergency && (
              <View style={styles.sosChip}>
                <Text style={styles.sosText}>SOS</Text>
              </View>
            )}
          </View>
          <Text style={styles.elderSub}>
            {item.age ? `${item.age} yrs old • ` : ''}{item.phone_number || 'No phone set'}
          </Text>
        </View>

        {item.phone_number ? (
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => handleCall(item.phone_number)}
            accessibilityLabel={`Call ${item.name}`}
          >
            <MaterialCommunityIcons name="phone" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Elders</Text>
        <TouchableOpacity onPress={() => onNavigate('addElder')} style={styles.addHeaderBtn}>
          <MaterialCommunityIcons name="account-plus-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor={colors.text.disabled}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredElders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchElders(true)} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="account-search-outline" size={64} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No Linked Elders Found</Text>
              <Text style={styles.emptySub}>
                Tap the button below to add an elder account via 6-digit code or QR pairing.
              </Text>
              <TouchableOpacity style={styles.addCtaBtn} onPress={() => onNavigate('addElder')}>
                <MaterialCommunityIcons name="account-plus" size={20} color="#FFF" />
                <Text style={styles.addCtaText}>Add / Connect Elder</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: {
    padding: spacing.s1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  addHeaderBtn: {
    padding: spacing.s1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.s5,
    marginTop: spacing.s3,
    paddingHorizontal: spacing.s3,
    paddingVertical: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  listContent: {
    padding: spacing.s5,
    gap: spacing.s3,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.s4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  elderName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  elderSub: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  sosChip: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sosText: {
    color: colors.error,
    fontSize: 10,
    fontWeight: '900',
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s16,
    paddingHorizontal: spacing.s5,
    gap: spacing.s2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  addCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.xl,
    marginTop: spacing.s4,
  },
  addCtaText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default MyEldersScreen;

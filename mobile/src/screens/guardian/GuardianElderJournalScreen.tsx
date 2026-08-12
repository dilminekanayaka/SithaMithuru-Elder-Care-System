import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { apiFetch } from '../../services/api';
import GuardianBottomNav from '../../components/GuardianBottomNav';
import { colors } from '../../theme';

interface GuardianElderJournalScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  elderId?: string | number;
  token?: string;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood_tag?: string;
  created_at: string;
}

const GuardianElderJournalScreen: React.FC<GuardianElderJournalScreenProps> = ({
  onBack,
  onNavigate,
  elderId,
  token = '',
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchJournal = useCallback(async () => {
    if (!elderId || !token) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch(`/journal/elder/${elderId}`, token);
      setEntries(Array.isArray(res) ? res : []);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load journal',
        text2: err.message,
        position: 'top',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, token]);

  useEffect(() => {
    fetchJournal();
  }, [fetchJournal]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJournal();
  };

  const filteredEntries = entries.filter((e) =>
    (e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Go back">
            <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Elder's Daily Journal</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.text.tertiary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search journal notes..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading elder's journal...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          >
            {filteredEntries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="book-open-blank-variant" size={56} color={colors.text.disabled} />
                <Text style={styles.emptyTitle}>No Journal Entries Found</Text>
                <Text style={styles.emptySub}>
                  {searchQuery ? 'No entries match your search query.' : 'The elder has not written any daily journal entries yet.'}
                </Text>
              </View>
            ) : (
              filteredEntries.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.entryTitle}>{item.title || 'Daily Entry'}</Text>
                    {item.mood_tag ? (
                      <View style={styles.moodBadge}>
                        <Text style={styles.moodText}>{item.mood_tag}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.entryDate}>
                    {new Date(item.created_at).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.entryContent}>{item.content}</Text>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Bottom Nav */}
        <GuardianBottomNav activeTab="guardianDashboard" onNavigate={onNavigate} />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.text.secondary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.outline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
  },
  moodBadge: {
    backgroundColor: '#6C63FF15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  entryDate: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 10,
  },
  entryContent: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 22,
  },
});

export default GuardianElderJournalScreen;

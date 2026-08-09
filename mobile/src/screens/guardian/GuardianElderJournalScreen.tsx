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

interface GuardianElderJournalScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  elderId?: number;
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
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Go back">
            <MaterialCommunityIcons name="arrow-left" size={26} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Elder's Daily Journal</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={22} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search journal notes..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.loadingText}>Loading elder's journal...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']} />}
          >
            {filteredEntries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="book-open-blank-variant" size={56} color="#CBD5E1" />
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
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
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
    color: '#334155',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#1E293B',
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
    color: '#6C63FF',
  },
  entryDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 10,
  },
  entryContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
});

export default GuardianElderJournalScreen;

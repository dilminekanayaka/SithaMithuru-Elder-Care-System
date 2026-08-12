import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch } from '../../services/api';
import { getDB } from '../../database/db';

interface HistoryItem {
  id: string;
  name: string;
  time: string;
  date: string;
  status: 'Taken' | 'Missed' | 'Skipped';
}

interface ReminderHistoryProps {
  onBack: () => void;
  elderId?: string | number;
  token?: string;
}

const ReminderHistoryScreen: React.FC<ReminderHistoryProps> = ({ onBack, elderId, token }) => {
  const [filter, setFilter] = useState<'All' | 'Taken' | 'Missed'>('All');
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      let fetchedLogs: HistoryItem[] = [];

      if (elderId && token) {
        try {
          const res = await apiFetch(`/medications/elder/${elderId}/history?days=30`, token);
          if (res && Array.isArray(res.events)) {
            fetchedLogs = res.events
              .filter((e: any) => e.status !== 'UPCOMING')
              .map((e: any, idx: number) => ({
                id: `${e.medication_id}_${e.date}_${idx}`,
                name: e.name,
                time: e.taken_at || e.scheduled_time || '08:00 AM',
                date: e.date === new Date().toISOString().split('T')[0] ? 'Today' : e.date,
                status: e.status === 'TAKEN' ? 'Taken' : 'Missed',
              }));
          }
        } catch {
          // Fallback to SQLite local logs
        }
      }

      if (fetchedLogs.length === 0) {
        try {
          const db = await getDB();
          const localLogs = await db.getAllAsync(`
            SELECT ml.*, m.name
            FROM medication_logs_local ml
            LEFT JOIN medications_local m ON m.id = ml.medication_id
            ORDER BY ml.created_at DESC
          `);
          if (Array.isArray(localLogs) && localLogs.length > 0) {
            fetchedLogs = localLogs.map((l: any, idx: number) => ({
              id: String(l.id || `local_${idx}`),
              name: l.name || 'Medication',
              time: l.created_at ? new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:00 AM',
              date: l.created_at ? new Date(l.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today',
              status: l.taken === 1 ? 'Taken' : 'Missed',
            }));
          }
        } catch {
          // Keep empty if DB has no logs
        }
      }

      setHistoryList(fetchedLogs);
    } catch (err) {
      console.warn('Error loading medication reminder history:', err);
    } finally {
      setLoading(false);
    }
  }, [elderId, token]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredList = historyList.filter((item) => {
    if (filter === 'All') return true;
    return item.status === filter;
  });

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const isTaken = item.status === 'Taken';
    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isTaken
                  ? colors.successContainer
                  : colors.errorContainer,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={isTaken ? 'check-circle' : 'alert-circle'}
              size={28}
              color={isTaken ? colors.successDark : colors.errorDark}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.medName}>{item.name}</Text>
            <Text style={styles.medTime}>
              {item.date} • {item.time}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.chip,
            isTaken ? styles.chipTaken : styles.chipMissed,
          ]}
        >
          <Text
            style={[
              styles.chipText,
              { color: isTaken ? colors.successDark : colors.errorDark },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={32} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminder History</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['All', 'Taken', 'Missed'] as const).map((tab) => {
          const isSelected = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterBtn, isSelected && styles.filterBtnSelected]}
              onPress={() => setFilter(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  isSelected && styles.filterTextSelected,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.emptyBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="history" size={64} color={colors.text.disabled} />
              <Text style={styles.emptyText}>No reminder logs found</Text>
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
    paddingVertical: spacing.s4,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.outlineVariant,
  },
  backBtn: {
    padding: spacing.s1,
  },
  headerTitle: {
    ...typography.headlineLarge,
    color: colors.text.primary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    backgroundColor: colors.surface,
    gap: spacing.s3,
    borderBottomWidth: 1,
    borderColor: colors.outlineVariant,
  },
  filterBtn: {
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s2,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceVariant,
  },
  filterBtnSelected: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...typography.titleMedium,
    color: colors.text.secondary,
  },
  filterTextSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.s5,
    gap: spacing.s3,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s4,
    ...elevation.e1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    flex: 1,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medName: {
    ...typography.titleLarge,
    color: colors.text.primary,
  },
  medTime: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  chip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderRadius: radius.pill,
    marginLeft: spacing.s2,
  },
  chipTaken: {
    backgroundColor: colors.successContainer,
  },
  chipMissed: {
    backgroundColor: colors.errorContainer,
  },
  chipText: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s16,
  },
  emptyText: {
    ...typography.titleLarge,
    color: colors.text.tertiary,
    marginTop: spacing.s3,
  },
});

export default ReminderHistoryScreen;

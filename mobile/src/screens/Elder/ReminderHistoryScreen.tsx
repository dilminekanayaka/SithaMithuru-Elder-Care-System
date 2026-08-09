import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius, elevation } from '../../theme';

interface HistoryItem {
  id: string;
  name: string;
  time: string;
  date: string;
  status: 'Taken' | 'Missed' | 'Skipped';
}

interface ReminderHistoryProps {
  onBack: () => void;
}

const SAMPLE_HISTORY: HistoryItem[] = [
  { id: '1', name: 'Paracetamol 500mg', time: '08:00 AM', date: 'Today', status: 'Taken' },
  { id: '2', name: 'Metformin 500mg', time: '01:00 PM', date: 'Today', status: 'Taken' },
  { id: '3', name: 'Vitamin D3', time: '08:00 PM', date: 'Yesterday', status: 'Missed' },
  { id: '4', name: 'Paracetamol 500mg', time: '08:00 AM', date: 'Yesterday', status: 'Taken' },
  { id: '5', name: 'Blood Pressure Pill', time: '08:00 PM', date: '2 days ago', status: 'Taken' },
];

const ReminderHistoryScreen: React.FC<ReminderHistoryProps> = ({ onBack }) => {
  const [filter, setFilter] = useState<'All' | 'Taken' | 'Missed'>('All');

  const filteredList = SAMPLE_HISTORY.filter((item) => {
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
          <View>
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
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
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

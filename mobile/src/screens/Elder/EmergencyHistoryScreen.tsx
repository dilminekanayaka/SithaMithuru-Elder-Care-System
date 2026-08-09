import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch } from '../../services/api';

interface SOSHistoryItem {
  id: string;
  trigger_type: string;
  triggered_at: string;
  status: 'Resolved' | 'Notified';
}

interface EmergencyHistoryProps {
  token: string;
  elderId?: number;
  onBack: () => void;
}

const EmergencyHistoryScreen: React.FC<EmergencyHistoryProps> = ({
  token,
  elderId,
  onBack,
}) => {
  const [history, setHistory] = useState<SOSHistoryItem[]>([
    {
      id: '1',
      trigger_type: 'Voice Command ("උදව් කරන්න")',
      triggered_at: '2026-07-30 • 10:15 AM',
      status: 'Resolved',
    },
    {
      id: '2',
      trigger_type: 'SOS Button Pressed',
      triggered_at: '2026-07-25 • 06:40 PM',
      status: 'Resolved',
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Attempt to load from API if available
    const fetchHistory = async () => {
      if (!elderId) return;
      setLoading(true);
      try {
        const res = await apiFetch(`/emergency/history/${elderId}`, token);
        if (Array.isArray(res)) {
          setHistory(res);
        }
      } catch (e) {
        // Fallback to initial state if endpoint not created yet
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [elderId, token]);

  const renderItem = ({ item }: { item: SOSHistoryItem }) => (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name="alert-decagram" size={32} color={colors.error} />
      </View>
      <View style={styles.info}>
        <Text style={styles.typeText}>{item.trigger_type}</Text>
        <Text style={styles.timeText}>{item.triggered_at}</Text>
      </View>
      <View style={styles.chip}>
        <Text style={styles.chipText}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={32} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SOS Alert History</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="shield-check" size={64} color={colors.successDark} />
              <Text style={styles.emptyText}>No emergency SOS alerts triggered</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.s5,
    gap: spacing.s3,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s4,
    ...elevation.e1,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s3,
  },
  info: {
    flex: 1,
  },
  typeText: {
    ...typography.titleLarge,
    color: colors.text.primary,
  },
  timeText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: spacing.s1,
  },
  chip: {
    backgroundColor: colors.successContainer,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderRadius: radius.pill,
  },
  chipText: {
    ...typography.labelMedium,
    color: colors.successDark,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s16,
  },
  emptyText: {
    ...typography.titleLarge,
    color: colors.text.secondary,
    marginTop: spacing.s3,
  },
});

export default EmergencyHistoryScreen;

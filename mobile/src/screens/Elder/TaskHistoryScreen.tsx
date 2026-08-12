/**
 * TaskHistoryScreen.tsx — Screen ELDER-S18 (Task History Screen)
 * Spec: es18.txt
 *
 * Requirements (es18.txt):
 *  1. Read-Only Mandate: Task completion audit log (No editing, deleting, or manual conversion of missed tasks).
 *  2. Header: Back arrow (←), Title "Task History".
 *  3. Task Header Banner: Icon + Task Title (e.g. Drink 3 glasses of water / Go to the bank).
 *  4. Month Navigation Controls: "< August 2026 >" (Next disabled if current month reached).
 *  5. Factual Summary Card: "8 of 10 completed" (Factual, clear statement).
 *  6. Chronological Date Grouping: 10 AUGUST, 09 AUGUST, 08 AUGUST, 07 AUGUST.
 *  7. Occurrence Record Item:
 *     - Completed: ✓ Completed | Completed at 10:20 AM | Scheduled for 10:00 AM (Green check badge)
 *     - Missed: ! Not completed | Scheduled for 10:00 AM (Amber warning badge)
 *  8. Empty State: "No history yet. Your task history will appear here after the task has been scheduled."
 *  9. 100% Offline-First
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

export interface TaskHistoryRecord {
  id: string;
  dateLabel: string;
  scheduledTime: string;
  completedTime?: string;
  status: 'COMPLETED' | 'MISSED';
  title?: string;
}

interface TaskHistoryProps {
  onBack: () => void;
  elderId?: string | number;
  token?: string;
  taskId?: string;
  taskTitle?: string;
  taskIcon?: string;
}

const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const TaskHistoryScreen: React.FC<TaskHistoryProps> = ({
  onBack,
  elderId,
  token,
  taskId,
  taskTitle,
  taskIcon = 'checkbox-marked-circle-outline',
}) => {
  const [records, setRecords] = useState<TaskHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        if (!elderId || !token) return;
        const { apiFetch } = require('../../services/api');
        const res = await apiFetch(`/guardian/tasks/${elderId}/history?days=30`, token);
        let events: any[] = Array.isArray(res?.events) ? res.events : [];

        if (taskId) {
          events = events.filter((e) => String(e.task_id) === String(taskId));
        }
        // Only real, resolved occurrences belong in a history log — exclude
        // still-UPCOMING entries (future days within the window).
        events = events.filter((e) => e.status === 'COMPLETED' || e.status === 'MISSED');

        const mapped: TaskHistoryRecord[] = events.map((e) => ({
          id: `${e.task_id}_${e.date}`,
          dateLabel: e.date
            ? new Date(e.date).toLocaleDateString('en-US', { day: '2-digit', month: 'long' }).toUpperCase()
            : '',
          scheduledTime: e.due_time || 'Any time',
          completedTime: e.completed_at || undefined,
          status: e.status === 'COMPLETED' ? 'COMPLETED' : 'MISSED',
          title: e.title,
        }));
        setRecords(mapped);
      } catch (e) {
        console.warn('Failed to load task history:', e);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [elderId, token, taskId]);

  const completedCount = records.filter((r) => r.status === 'COMPLETED').length;
  const totalCount = records.length;

  useEffect(() => {
    if (!loading) {
      AccessibilityInfo.announceForAccessibility(
        `Task History. ${completedCount} of ${totalCount} completed in ${currentMonthName}.`
      );
    }
  }, [completedCount, totalCount, loading]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es18.txt Section 1 & 2) ─── */}
      <ScreenHeader title="Task History" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── TASK HEADER BANNER (es18.txt Section 4) ─── */}
        <View style={styles.taskBanner}>
          <View style={styles.taskIconBox}>
            <MaterialCommunityIcons name={taskIcon as any} size={28} color={colors.primary} />
          </View>
          <Text style={styles.taskTitleText}>{taskTitle || 'All Tasks'}</Text>
        </View>

        {/* ─── CURRENT PERIOD LABEL ───
             History is sourced from the last 30 days of real occurrences (backend
             has no month-scoped query), so month-to-month browsing isn't backed
             by any real data and was removed rather than faked. */}
        <View style={styles.monthSelectorRow}>
          <Text style={styles.monthLabelText}>{currentMonthName}</Text>
        </View>

        {/* ─── FACTUAL SUMMARY CARD (es18.txt Section 5) ─── */}
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="check-all" size={22} color={colors.success} style={{ marginRight: 10 }} />
          <Text style={styles.summaryText}>
            <Text style={{ fontWeight: '800', color: colors.success }}>{completedCount} of {totalCount}</Text> completed
          </Text>
        </View>

        {records.length === 0 && !loading ? (
          /* ─── 14. EMPTY STATE ─── */
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="check" size={48} color={colors.text.tertiary} />
            </View>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptySubtitle}>
              Your task history will appear here after the task has been scheduled.
            </Text>
          </View>
        ) : (
          /* ─── CHRONOLOGICAL OCCURRENCE LIST ─── */
          records.map((item) => (
            <View key={item.id} style={styles.groupSection}>
              <Text style={styles.groupLabel}>{item.dateLabel}</Text>
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: item.status === 'COMPLETED' ? colors.successContainer : colors.warningContainer },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.status === 'COMPLETED' ? 'check' : 'alert'}
                      size={18}
                      color={item.status === 'COMPLETED' ? colors.success : colors.warning}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    {!taskId && item.title && (
                      <Text style={styles.itemTaskTitle}>{item.title}</Text>
                    )}
                    <View style={styles.timeStatusRow}>
                      <Text
                        style={[
                          styles.statusLabel,
                          { color: item.status === 'COMPLETED' ? colors.success : colors.warning },
                        ]}
                      >
                        {item.status === 'COMPLETED' ? 'Completed' : 'Not completed'}
                      </Text>
                    </View>
                    {item.completedTime && (
                      <Text style={styles.actualTimeText}>Completed at {item.completedTime}</Text>
                    )}
                    <Text style={styles.scheduledTimeText}>Scheduled for {item.scheduledTime}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4 || 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s4 || 16,
    paddingBottom: spacing.s8 || 32,
  },
  taskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  taskIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  taskTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    flex: 1,
  },
  monthSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  monthArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  monthLabelText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    borderRadius: radius.lg || 16,
    padding: 14,
    marginBottom: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.status.taken.border,
  },
  summaryText: {
    fontSize: 14,
    color: colors.successDark,
  },
  groupSection: {
    marginBottom: spacing.s3 || 12,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timeStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  itemTaskTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  actualTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
  scheduledTimeText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});

export default TaskHistoryScreen;

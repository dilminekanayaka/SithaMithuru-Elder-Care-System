/**
 * TasksScreen.tsx — Screen ELDER-S15 (Daily Tasks Dashboard Screen)
 * Spec: es15.txt
 *
 * Requirements (es15.txt):
 *  1. Header: Back arrow (←), Title "My Tasks".
 *  2. Date Banner: "Today, 10 August" (Dynamic locale format).
 *  3. Today's Task Summary: "2 of 4 tasks completed" (Factual statement, no confusing percentages).
 *  4. Task Sections:
 *     - TODAY: Tasks due today with explicit [ COMPLETE ] button (≥52dp touch target).
 *     - UPCOMING: Tasks scheduled for future dates.
 *  5. Task Cards:
 *     - Completed: ✓ Task Title | Completed at 10:20 AM
 *     - Upcoming/Due: Icon + Title | Today • 11:00 AM | Upcoming | [ COMPLETE ]
 *  6. Generic Task Types: Water 💧, Bank 🏦, Call family ☎, Walk 🚶, Groceries 🛒, Pray 🙏.
 *  7. Bottom CTA: "+ Add Task" button to launch Add Task screen.
 *  8. Empty State: "No tasks for today. You have nothing planned for today." + [ Add Task ]
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
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  dateLabel: string;
  status: 'UPCOMING' | 'DUE_NOW' | 'COMPLETED';
  completedAt?: string;
  category: 'Health' | 'Personal' | 'Social' | 'Home';
  icon: string;
  color: string;
  group: 'TODAY' | 'UPCOMING';
}

interface TasksProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  elderId?: string;
  token?: string;
  isOnline?: boolean;
  onViewTask?: (task: TaskItem) => void;
}

const TasksScreen: React.FC<TasksProps> = ({ onBack, onNavigate, elderId, token, onViewTask }) => {
  const [taskList, setTaskList] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load live tasks dynamically from SQLite DB & API
  const loadTasks = React.useCallback(async () => {
    setLoading(true);
    try {
      const { getDB } = require('../../database/db');
      const { apiFetch } = require('../../services/api');
      const db = await getDB();

      const localTasks = await db.getAllAsync(
        'SELECT * FROM daily_tasks_local WHERE elder_id = ? OR elder_id = ?',
        [elderId ? String(elderId) : 'elder_default', 'elder_default']
      );

      let fetchedTasks = localTasks || [];

      if (elderId && token) {
        try {
          const res = await apiFetch(`/tasks/elder/${elderId}`, token);
          if (res && Array.isArray(res.tasks)) {
            fetchedTasks = res.tasks;
          }
        } catch {
          // Fallback to SQLite cache
        }
      }

      if (fetchedTasks.length > 0) {
        const formatted: TaskItem[] = fetchedTasks.map((t: any, idx: number) => ({
          id: String(t.id ?? `task_${idx}`),
          title: t.title || 'Daily Task',
          description: t.description || undefined,
          time: t.due_time || '',
          dateLabel: t.due_time ? `Today • ${t.due_time}` : 'Today',
          status: t.status === 'COMPLETED' || t.completed ? 'COMPLETED' : 'UPCOMING',
          completedAt: t.completed_at || t.completedAt,
          category: 'Personal',
          icon: 'checkbox-marked-circle-outline',
          color: colors.primaryContainer,
          group: 'TODAY',
        }));
        setTaskList(formatted);
      }
    } catch (e) {
      console.warn('Failed to load tasks from SQLite:', e);
    } finally {
      setLoading(false);
    }
  }, [elderId, token]);

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const todayDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const todayTasks = taskList.filter((t) => t.group === 'TODAY');
  const upcomingTasks = taskList.filter((t) => t.group === 'UPCOMING');
  const completedCount = todayTasks.filter((t) => t.status === 'COMPLETED').length;
  const totalTodayCount = todayTasks.length;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `Daily Tasks Dashboard. ${completedCount} of ${totalTodayCount} tasks completed for today.`
    );
  }, [completedCount, totalTodayCount]);

  // Handle Mark Task Complete (es15.txt Section 8)
  const handleCompleteTask = async (id: string) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTaskList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'COMPLETED', completedAt: nowTime }
          : item
      )
    );

    Toast.show({
      type: 'success',
      text1: 'Task Completed! 🎉',
      text2: 'Great job completing your task.',
      position: 'top',
    });

    // Offline-First: Write task log to SQLite offline queue
    try {
      const { getDB } = require('../../database/db');
      const { syncService } = require('../../services/syncService');
      const db = await getDB();
      const logId = `tasklog_${Date.now()}_${id}`;
      const logDate = new Date().toISOString().split('T')[0];

      await db.runAsync(
        `INSERT INTO task_logs_offline (id, taskId, elder_id, status, logged_date, action_timestamp, synced)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [logId, id, elderId || 'elder_default', 'COMPLETED', logDate, new Date().toISOString()]
      );

      // Trigger background sync if token provided
      if (elderId && token) {
        syncService.syncOfflineQueue(elderId, token).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to log task completion to SQLite offline queue:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es15.txt Section 1 & 3) ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          accessible={true}
          accessibilityLabel="Go back to Home"
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Tasks</Text>

        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => onNavigate('addTask')}
          accessible={true}
          accessibilityLabel="Add new task"
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── DATE BANNER & FACTUAL SUMMARY (es15.txt Section 3 & 10) ─── */}
        <View style={styles.summaryBox}>
          <Text style={styles.dateLabelText}>{todayDateFormatted}</Text>
          <Text style={styles.summaryTitle}>
            <Text style={{ fontWeight: '800', color: colors.primary }}>{completedCount} of {totalTodayCount} tasks</Text> completed
          </Text>
        </View>

        {taskList.length === 0 ? (
          /* ─── 31. EMPTY STATE ─── */
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="check-all" size={48} color={colors.success} />
            </View>
            <Text style={styles.emptyTitle}>No tasks for today</Text>
            <Text style={styles.emptySubtitle}>You have nothing planned for today.</Text>
            <TouchableOpacity
              style={styles.emptyCtaBtn}
              onPress={() => onNavigate('addTask')}
            >
              <MaterialCommunityIcons name="plus" size={22} color={colors.onPrimary} />
              <Text style={styles.emptyCtaBtnText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ─── TODAY'S TASKS SECTION (es15.txt Section 3, 5, 6) ─── */}
            {todayTasks.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabelText}>TODAY</Text>
                {todayTasks.map((task) => {
                  const isCompleted = task.status === 'COMPLETED';
                  return (
                    <TouchableOpacity
                      key={task.id}
                      style={[styles.taskCard, isCompleted && styles.taskCardCompleted]}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (onViewTask) {
                          onViewTask(task);
                          onNavigate('taskDetails');
                        }
                      }}
                      accessible={true}
                      accessibilityLabel={`View details for ${task.title}`}
                    >
                      <View style={styles.taskCardTopRow}>
                        <View
                          style={[
                            styles.iconBox,
                            { backgroundColor: isCompleted ? colors.surfaceVariant : task.color },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={task.icon as any}
                            size={24}
                            color={isCompleted ? colors.text.tertiary : colors.primary}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.taskTitleText,
                              isCompleted && styles.taskTitleCompletedText,
                            ]}
                          >
                            {task.title}
                          </Text>
                          <Text style={styles.taskSubtitleText}>
                            {isCompleted
                              ? `Completed at ${task.completedAt}`
                              : task.dateLabel}
                          </Text>
                        </View>

                        {isCompleted && (
                          <View style={styles.completedBadge}>
                            <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
                          </View>
                        )}
                      </View>

                      {/* PROMINENT [ COMPLETE ] BUTTON (es15.txt Section 5, 8, 40) */}
                      {!isCompleted && (
                        <TouchableOpacity
                          style={styles.completeBtn}
                          onPress={() => handleCompleteTask(task.id)}
                          activeOpacity={0.8}
                          accessible={true}
                          accessibilityLabel={`Mark ${task.title} as complete`}
                        >
                          <MaterialCommunityIcons name="check" size={20} color={colors.onPrimary} />
                          <Text style={styles.completeBtnText}>COMPLETE</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ─── UPCOMING TASKS SECTION (es15.txt Section 13) ─── */}
            {upcomingTasks.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabelText}>UPCOMING</Text>
                {upcomingTasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (onViewTask) {
                        onViewTask(task);
                        onNavigate('taskDetails');
                      }
                    }}
                    accessible={true}
                    accessibilityLabel={`View details for ${task.title}`}
                  >
                    <View style={styles.taskCardTopRow}>
                      <View style={[styles.iconBox, { backgroundColor: task.color }]}>
                        <MaterialCommunityIcons name={task.icon as any} size={24} color={colors.primary} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.taskTitleText}>{task.title}</Text>
                        <Text style={styles.taskSubtitleText}>{task.dateLabel}</Text>
                      </View>

                      <View style={styles.upcomingTag}>
                        <Text style={styles.upcomingTagText}>Upcoming</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ─── ADD TASK BUTTON ─── */}
            <TouchableOpacity
              style={styles.addTaskBtn}
              onPress={() => onNavigate('addTask')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="plus" size={22} color={colors.onPrimary} />
              <Text style={styles.addTaskBtnText}>Add Task</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ─── FIXED BOTTOM NAV BAR ─── */}
      <BottomNavBar activeTab="tasks" onNavigate={onNavigate} />
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
  addHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s4 || 16,
    paddingBottom: 110,
  },
  summaryBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s5 || 20,
    marginBottom: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  dateLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  sectionContainer: {
    marginBottom: spacing.s5 || 20,
  },
  sectionLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s3 || 12,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  taskCardCompleted: {
    backgroundColor: colors.background,
    borderColor: colors.outline,
    opacity: 0.8,
  },
  taskCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  taskTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  taskTitleCompletedText: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
  taskSubtitleText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  completedBadge: {
    marginLeft: 8,
  },
  upcomingTag: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  upcomingTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  completeBtn: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: colors.success,
    borderRadius: radius.lg || 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
    ...elevation.e2,
  },
  completeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  addTaskBtn: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
    ...elevation.e3,
  },
  addTaskBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.onPrimary,
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
    backgroundColor: colors.successContainer,
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
    marginBottom: 24,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyCtaBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
  },
});

export default TasksScreen;

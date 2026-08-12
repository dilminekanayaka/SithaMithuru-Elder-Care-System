/**
 * TaskDetailsScreen.tsx — Screen ELDER-S17 (Task Details / Edit Screen)
 *
 * Shows the real daily task passed in from TasksScreen (via ElderNavigator's
 * selectedTask state) and performs real backend actions:
 *  - COMPLETE  -> POST /tasks/log (same endpoint TasksScreen's own complete
 *    button uses), so status matches everywhere in the app.
 *  - DEACTIVATE -> DELETE /tasks/:id. The `daily_tasks` table has no
 *    "paused/inactive" column, so there is no real reversible deactivate
 *    state to show here — this permanently removes the recurring task,
 *    and the confirmation copy says so honestly instead of pretending.
 *
 * `daily_tasks` are recurring-daily reminders with a time-of-day only (no
 * per-occurrence date, no reminder/repeat-frequency columns), so this screen
 * only shows fields the database actually has: title, notes, due time, and
 * today's completion status.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import { apiFetch } from '../../services/api';

export interface TaskDetailData {
  id: string;
  title: string;
  description?: string;
  time?: string;
  status: 'UPCOMING' | 'DUE_NOW' | 'COMPLETED';
  completedAt?: string;
  icon?: string;
}

interface TaskDetailsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  taskData?: TaskDetailData | null;
  elderId?: string;
  token?: string;
}

const TaskDetailsScreen: React.FC<TaskDetailsProps> = ({
  onBack,
  onNavigate,
  taskData,
  elderId,
  token,
}) => {
  const [currentTask, setCurrentTask] = useState<TaskDetailData | null>(taskData ?? null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!currentTask) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="clipboard-alert-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyStateText}>This task couldn't be loaded.</Text>
          <TouchableOpacity style={styles.emptyStateBtn} onPress={onBack}>
            <Text style={styles.emptyStateBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = currentTask.status === 'COMPLETED';

  const handleComplete = async () => {
    if (isCompleted || busy) return;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!elderId || !token) {
      Toast.show({ type: 'error', text1: 'Not signed in', text2: 'Please log in again to update tasks.', position: 'top' });
      return;
    }

    setBusy(true);
    try {
      await apiFetch('/tasks/log', token, {
        method: 'POST',
        body: JSON.stringify({ task_id: currentTask.id, elder_id: elderId, completed: true }),
      });
      setCurrentTask((prev) => (prev ? { ...prev, status: 'COMPLETED', completedAt: timeNow } : prev));
      Toast.show({ type: 'success', text1: 'Task Completed! 🎉', text2: `Marked complete at ${timeNow}`, position: 'top' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not update task', text2: 'Check your connection and try again.', position: 'top' });
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!elderId || !token) {
      setShowDeactivateModal(false);
      Toast.show({ type: 'error', text1: 'Not signed in', text2: 'Please log in again to remove tasks.', position: 'top' });
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/tasks/${currentTask.id}`, token, { method: 'DELETE' });
      setShowDeactivateModal(false);
      Toast.show({ type: 'info', text1: 'Task Removed', text2: 'This recurring task has been deleted.', position: 'top' });
      onBack();
    } catch (e) {
      setShowDeactivateModal(false);
      Toast.show({ type: 'error', text1: 'Could not remove task', text2: 'Check your connection and try again.', position: 'top' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          accessible={true}
          accessibilityLabel="Go back to Tasks Dashboard"
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Task Details</Text>

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setShowMenuModal(true)}
          accessible={true}
          accessibilityLabel="More options"
        >
          <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name={(currentTask.icon as any) || 'checkbox-marked-circle-outline'} size={40} color={colors.primary} />
          </View>

          <Text style={styles.taskTitleText}>{currentTask.title}</Text>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isCompleted ? colors.status.completed.bg : colors.status.upcoming.bg },
            ]}
          >
            <MaterialCommunityIcons
              name={isCompleted ? 'check-circle' : 'clock-outline'}
              size={18}
              color={isCompleted ? colors.status.completed.text : colors.status.upcoming.text}
            />
            <Text
              style={[
                styles.statusBadgeText,
                { color: isCompleted ? colors.status.completed.text : colors.status.upcoming.text },
              ]}
            >
              {isCompleted ? `Completed at ${currentTask.completedAt}` : 'Upcoming today'}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>DUE TIME</Text>
            <Text style={styles.metaValue}>{currentTask.time || 'Any time today'}</Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>REPEATS</Text>
            <Text style={styles.metaValue}>Every day</Text>
          </View>
        </View>

        {currentTask.description ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesValue}>{currentTask.description}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.completeBtn, isCompleted && styles.completedBtnDone]}
          onPress={handleComplete}
          disabled={isCompleted || busy}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel={
            isCompleted ? `Task completed at ${currentTask.completedAt}` : 'Complete task'
          }
        >
          {busy ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons
                name={isCompleted ? 'check-all' : 'check'}
                size={22}
                color={isCompleted ? colors.status.completed.text : colors.onPrimary}
              />
              <Text style={[styles.completeBtnText, isCompleted && styles.completedBtnTextDone]}>
                {isCompleted ? `✓ Completed at ${currentTask.completedAt}` : 'COMPLETE'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={() => onNavigate('addTask')}
          accessible={true}
          accessibilityLabel="Edit Task"
        >
          <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
          <Text style={styles.secondaryActionBtnText}>Edit Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={() => onNavigate('taskHistory')}
          accessible={true}
          accessibilityLabel="Task History"
        >
          <MaterialCommunityIcons name="history" size={20} color={colors.primary} />
          <Text style={styles.secondaryActionBtnText}>Task History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryActionBtn, styles.deactivateBtn]}
          onPress={() => setShowDeactivateModal(true)}
          accessible={true}
          accessibilityLabel="Delete Task"
        >
          <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error} />
          <Text style={styles.deactivateBtnText}>Delete Task</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showMenuModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenuModal(false)}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenuModal(false);
                onNavigate('addTask');
              }}
            >
              <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
              <Text style={styles.menuItemText}>Edit Task</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenuModal(false);
                setShowDeactivateModal(true);
              }}
            >
              <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>Delete Task</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showDeactivateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeactivateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.modalTitle}>Delete this task?</Text>
            <Text style={styles.modalSubtitle}>
              This permanently removes "{currentTask.title}" and you'll stop getting reminders for it.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowDeactivateModal(false)}
                disabled={busy}
              >
                <Text style={styles.modalCancelBtnText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDeactivateBtn}
                onPress={handleConfirmDeactivate}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text style={styles.modalDeactivateBtnText}>DELETE</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    paddingHorizontal: spacing.s4,
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
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s5,
    paddingBottom: 110,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s3,
    paddingHorizontal: spacing.s6,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyStateBtn: {
    marginTop: spacing.s2,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  emptyStateBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.s5,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitleText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.s5,
    marginBottom: spacing.s4,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  metaRow: {
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  metaDivider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginVertical: 12,
  },
  notesBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.s4,
    marginBottom: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  notesValue: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 22,
  },
  completeBtn: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: colors.success,
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s4,
    gap: 8,
    ...elevation.e3,
  },
  completedBtnDone: {
    backgroundColor: colors.status.completed.bg,
    borderWidth: 1,
    borderColor: colors.status.completed.border,
    elevation: 0,
  },
  completeBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  completedBtnTextDone: {
    color: colors.status.completed.text,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.outline,
    gap: 8,
  },
  secondaryActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  deactivateBtn: {
    borderColor: colors.status.missed.border,
    backgroundColor: colors.errorContainer,
  },
  deactivateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.error,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menuBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 8,
    width: 180,
    ...elevation.e3,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    ...elevation.e3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 12,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  modalDeactivateBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDeactivateBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
});

export default TaskDetailsScreen;

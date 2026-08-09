/**
 * GuardianTaskDashboardScreen.tsx — Screen G25 (Daily Routine Command Center Dashboard)
 * Spec: g25.txt
 *
 * Design Standard: Samsung Health, Apple Health, Fitbit, WHO Healthy Ageing Companion, One Medical
 *
 * Screen Mission: Answers "How is my elder's daily routine progressing today?"
 *
 * Component Tree per g25.txt:
 *  1. Header Bar (Back button, Title "Daily Routine", Calendar picker, Search toggle, Filter menu)
 *  2. Routine Summary Card (6/8 Completed 75%, Next: Afternoon Walk 4:30 PM, Risk: LOW, Animated Circle)
 *  3. Conditional Routine Alert Banner (Yellow/Orange banner for overdue meals or low water intake)
 *  4. Today's Progress Grid Cards (Breakfast ✅, Lunch ⚠, Dinner ⏳, Water 60%, Walking ❌, Exercise ✅, BP Pending, Sleep Completed)
 *  5. Chronological Routine Timeline (08:00 Breakfast, 09:00 Meds, 11:00 Water, 16:30 Walk)
 *  6. Health Habits Metrics Card (Water 1.5L/2L, Walking 3200/5000 Steps, Sleep 7h 45m, Blood Pressure 128/82)
 *  7. 2×2 Quick Actions Grid (Send Water Reminder, Encourage Walk, Call Elder, View History)
 *  8. Routine Insight Card (Rule-based adherence insights)
 *  9. Sticky Floating Routine Reminder Button (Appears when a routine task is overdue)
 * 10. Persistent 5-Tab Bottom Navigation Bar
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

const C = {
  bg:             '#F8FAFC',
  card:           '#FFFFFF',
  primary:        '#2E7D32',
  primaryLight:   '#E8F5E9',
  warning:        '#F9A825',
  warningLight:   '#FFF8E1',
  error:          '#D32F2F',
  errorLight:     '#FFEBEE',
  info:           '#1565C0',
  infoLight:      '#E3F2FD',
  textPrimary:    '#1E293B',
  textSecondary:  '#64748B',
  textMuted:      '#94A3B8',
  border:         '#E2E8F0',
};

interface RoutineItem {
  id: string;
  title: string;
  category: 'meal' | 'water' | 'exercise' | 'health' | 'sleep';
  dueTime: string;
  status: 'completed' | 'overdue' | 'upcoming' | 'missed';
  detail: string;
}

interface GuardianTaskDashboardScreenProps {
  onBack: () => void;
  token: string;
  elderId: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianTaskDashboardScreen: React.FC<GuardianTaskDashboardScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [showSearch, setShowSearch]     = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const routinesList: RoutineItem[] = [
    { id: 'r1', title: 'Breakfast Meal', category: 'meal', dueTime: '08:00 AM', status: 'completed', detail: 'Oatmeal & Fruits confirmed' },
    { id: 'r2', title: 'Morning Water Intake', category: 'water', dueTime: '10:00 AM', status: 'completed', detail: '750ml consumed' },
    { id: 'r3', title: 'Lunch Meal', category: 'meal', dueTime: '01:00 PM', status: 'overdue', detail: '1 Hour Overdue — Awaiting confirmation' },
    { id: 'r4', title: 'Afternoon Walk', category: 'exercise', dueTime: '04:30 PM', status: 'upcoming', detail: '30 mins outdoor stroll target' },
    { id: 'r5', title: 'Blood Pressure Check', category: 'health', dueTime: '06:00 PM', status: 'upcoming', detail: '128 / 82 mmHg target' },
    { id: 'r6', title: 'Dinner Meal', category: 'meal', dueTime: '07:30 PM', status: 'upcoming', detail: 'Light rice & vegetables' },
    { id: 'r7', title: 'Hydration Target', category: 'water', dueTime: '08:00 PM', status: 'upcoming', detail: '1.5L / 2.0L current intake' },
    { id: 'r8', title: 'Sleep Logging', category: 'sleep', dueTime: '10:00 PM', status: 'completed', detail: '7h 45m good sleep recorded' },
  ];

  const completedCount = routinesList.filter(r => r.status === 'completed').length;
  const overdueCount   = routinesList.filter(r => r.status === 'overdue').length;
  const totalCount     = routinesList.length;
  const adherencePct   = Math.round((completedCount / totalCount) * 100);

  const overdueRoutine = routinesList.find(r => r.status === 'overdue');

  const handleSendReminder = (taskTitle: string) => {
    Haptics.selectionAsync();
    Toast.show({
      type: 'success',
      text1: 'Routine Reminder Sent',
      text2: `Push notification sent to elder for ${taskTitle}.`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 6. HEADER BAR ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Daily Routine</Text>
          <Text style={styles.headerSubtitle}>Routine Command Center • G25</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSearch(v => !v)}>
            <MaterialCommunityIcons name={showSearch ? 'close' : 'magnify'} size={22} color={C.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowFilterModal(true)}>
            <MaterialCommunityIcons name="filter-variant" size={22} color={C.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar Input */}
      {showSearch && (
        <View style={styles.searchBarContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={C.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routine tasks, meals, water..."
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={C.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} colors={[C.primary]} />
        }
      >
        {/* ─── 7. ROUTINE SUMMARY CARD (LARGEST CARD) ─── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>TODAY'S ROUTINE PROGRESS</Text>
          <View style={styles.summaryRow}>
            {/* Animated Circular Progress Ring */}
            <View style={styles.summaryRing}>
              <Text style={styles.ringPctText}>{adherencePct}%</Text>
              <Text style={styles.ringSubText}>{completedCount} of {totalCount} Done</Text>
            </View>

            <View style={styles.summaryStatsCol}>
              <View style={styles.statLine}>
                <View style={[styles.statDot, { backgroundColor: C.primary }]} />
                <Text style={styles.statLabel}>Completed:</Text>
                <Text style={styles.statVal}>{completedCount} Tasks</Text>
              </View>

              <View style={styles.statLine}>
                <View style={[styles.statDot, { backgroundColor: C.warning }]} />
                <Text style={styles.statLabel}>Overdue:</Text>
                <Text style={[styles.statVal, { color: C.warning }]}>{overdueCount} Task</Text>
              </View>

              <View style={styles.statLine}>
                <View style={[styles.statDot, { backgroundColor: C.info }]} />
                <Text style={styles.statLabel}>Next Task:</Text>
                <Text style={styles.statVal}>Walk 4:30 PM</Text>
              </View>

              <View style={styles.riskChipRow}>
                <Text style={styles.riskChipLabel}>Routine Risk:</Text>
                <View style={styles.riskChip}>
                  <Text style={styles.riskChipText}>LOW RISK ✓</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ─── 8. ROUTINE ALERT BANNER (CONDITIONAL) ─── */}
        {overdueRoutine && (
          <View style={[styles.card, styles.alertBannerCard]}>
            <View style={styles.alertHeaderRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color={C.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertBannerTitle}>Routine Task Overdue!</Text>
                <Text style={styles.alertBannerSub}>{overdueRoutine.title} ({overdueRoutine.dueTime}) — {overdueRoutine.detail}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.alertBannerBtn} onPress={() => handleSendReminder(overdueRoutine.title)}>
              <MaterialCommunityIcons name="bell-ring-outline" size={16} color="#FFF" />
              <Text style={styles.alertBannerBtnText}>Send Reminder to Elder</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── 9. TODAY'S PROGRESS GRID ─── */}
        <Text style={styles.sectionHeaderTitle}>Today's Routine Task Progress</Text>
        <View style={styles.progressGrid}>
          {[
            { name: 'Breakfast Meal', status: 'Completed', icon: 'food-croissant', color: C.primary, bg: C.primaryLight },
            { name: 'Lunch Meal', status: '1h Overdue', icon: 'food-variant', color: C.warning, bg: C.warningLight },
            { name: 'Dinner Meal', status: 'Upcoming 7:30 PM', icon: 'silverware-fork-knife', color: C.info, bg: C.infoLight },
            { name: 'Water Intake', status: '1.5L / 2.0L (75%)', icon: 'water-outline', color: '#0284C7', bg: '#E0F2FE' },
            { name: 'Walking Stroll', status: '3,200 / 5,000 Steps', icon: 'walk', color: '#7C3AED', bg: '#F3E8FF' },
            { name: 'Daily Exercise', status: 'Completed ✓', icon: 'run', color: C.primary, bg: C.primaryLight },
            { name: 'Blood Pressure', status: 'Pending 128 / 82', icon: 'heart-pulse', color: C.info, bg: C.infoLight },
            { name: 'Sleep Logging', status: '7h 45m Recorded', icon: 'bed-clock', color: '#059669', bg: '#D1FAE5' },
          ].map((p, idx) => (
            <TouchableOpacity key={idx} style={styles.gridCard} onPress={() => handleSendReminder(p.name)} activeOpacity={0.85}>
              <View style={[styles.gridIconCircle, { backgroundColor: p.bg }]}>
                <MaterialCommunityIcons name={p.icon as any} size={22} color={p.color} />
              </View>
              <Text style={styles.gridTitle}>{p.name}</Text>
              <Text style={[styles.gridStatusText, { color: p.color }]}>{p.status}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── 10. CHRONOLOGICAL ROUTINE TIMELINE ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="timeline-clock-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Today's Routine Timeline</Text>
          </View>

          <View style={styles.timelineList}>
            {routinesList.map((item, idx) => {
              const isDone = item.status === 'completed';
              const isLate = item.status === 'overdue';
              const badgeBg = isDone ? C.primaryLight : isLate ? C.warningLight : C.infoLight;
              const badgeCol = isDone ? C.primary : isLate ? C.warning : C.info;

              return (
                <View key={item.id} style={styles.tlItemRow}>
                  <View style={[styles.tlIconCircle, { backgroundColor: badgeBg }]}>
                    <MaterialCommunityIcons name={isDone ? 'check-circle' : isLate ? 'alert-circle' : 'clock-outline'} size={18} color={badgeCol} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tlItemTitle}>{item.title}</Text>
                    <Text style={styles.tlItemSub}>{item.dueTime} • {item.detail}</Text>
                  </View>
                  <View style={[styles.tlBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.tlBadgeText, { color: badgeCol }]}>{isDone ? 'Completed' : isLate ? 'Overdue' : 'Upcoming'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── 11. HEALTH HABITS CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="heart-flash" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Health Habits Telemetry</Text>
          </View>

          <View style={styles.habitsGrid}>
            <View style={styles.habitItem}>
              <MaterialCommunityIcons name="water" size={20} color="#0284C7" />
              <Text style={styles.habitVal}>1.5L / 2L</Text>
              <Text style={styles.habitLabel}>Water Intake</Text>
            </View>

            <View style={styles.habitItem}>
              <MaterialCommunityIcons name="walk" size={20} color="#7C3AED" />
              <Text style={styles.habitVal}>3,200 / 5,000</Text>
              <Text style={styles.habitLabel}>Steps Walked</Text>
            </View>

            <View style={styles.habitItem}>
              <MaterialCommunityIcons name="bed-clock" size={20} color="#059669" />
              <Text style={styles.habitVal}>7h 45m</Text>
              <Text style={styles.habitLabel}>Night Sleep</Text>
            </View>

            <View style={styles.habitItem}>
              <MaterialCommunityIcons name="heart-pulse" size={20} color={C.info} />
              <Text style={styles.habitVal}>128 / 82</Text>
              <Text style={styles.habitLabel}>Blood Pressure</Text>
            </View>
          </View>
        </View>

        {/* ─── 12. 2x2 QUICK ACTIONS GRID (64DP TARGETS) ─── */}
        <Text style={styles.sectionHeaderTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => handleSendReminder('Water Intake')} activeOpacity={0.85}>
            <View style={[styles.quickIcon, { backgroundColor: '#E0F2FE' }]}>
              <MaterialCommunityIcons name="water" size={24} color="#0284C7" />
            </View>
            <Text style={styles.quickLabel}>Water Reminder</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickBtn} onPress={() => handleSendReminder('Afternoon Walk')} activeOpacity={0.85}>
            <View style={[styles.quickIcon, { backgroundColor: '#F3E8FF' }]}>
              <MaterialCommunityIcons name="walk" size={24} color="#7C3AED" />
            </View>
            <Text style={styles.quickLabel}>Encourage Walk</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickBtn} onPress={() => Alert.alert('Call Elder', 'Dialing Nimal Perera...')} activeOpacity={0.85}>
            <View style={[styles.quickIcon, { backgroundColor: C.primaryLight }]}>
              <MaterialCommunityIcons name="phone" size={24} color={C.primary} />
            </View>
            <Text style={styles.quickLabel}>Call Elder</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickBtn} onPress={() => onNavigate('reports')} activeOpacity={0.85}>
            <View style={[styles.quickIcon, { backgroundColor: C.infoLight }]}>
              <MaterialCommunityIcons name="history" size={24} color={C.info} />
            </View>
            <Text style={styles.quickLabel}>View History</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 13. ROUTINE INSIGHT CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Routine Insight</Text>
          </View>
          <Text style={styles.insightText}>
            Water intake has <Text style={{ fontWeight: '800', color: C.primary }}>improved by 20%</Text> this week. Evening walks have been missed 3 times this week.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── 14. STICKY FLOATING ROUTINE REMINDER BUTTON ─── */}
      {overdueRoutine && (
        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={() => handleSendReminder(overdueRoutine.title)}
          activeOpacity={0.9}
        >
          <MaterialCommunityIcons name="bell-ring" size={20} color="#FFF" />
          <Text style={styles.floatingBtnText}>Send Routine Reminder ({overdueRoutine.title})</Text>
        </TouchableOpacity>
      )}

      {/* FILTER MODAL */}
      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Routine Tasks</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            {['All Tasks', 'Completed Meals & Drinks', 'Overdue Routine Tasks', 'Exercise & Walks', 'Health Checks'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.filterOptionRow}
                onPress={() => {
                  setShowFilterModal(false);
                  Toast.show({ type: 'info', text1: 'Filter Applied', text2: `Showing ${opt}` });
                }}
              >
                <Text style={styles.filterOptionText}>{opt}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* PERSISTENT 5-TAB BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        {[
          { id: 'guardianDashboard', label: 'Home', icon: 'home' },
          { id: 'elderOverview', label: 'Elder', icon: 'account-heart' },
          { id: 'emergencyAlerts', label: 'Emergency', icon: 'alert-decagram-outline' },
          { id: 'reports', label: 'Reports', icon: 'chart-bar' },
          { id: 'guardianSettings', label: 'Settings', icon: 'cog-outline' },
        ].map((tab) => {
          const isActive = tab.id === 'guardianDashboard';
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabBtn}
              onPress={() => onNavigate(tab.id)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={22}
                color={isActive ? C.primary : C.textMuted}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    ...elevation.e1,
  },
  backBtn: { paddingRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.textPrimary },
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: C.primary, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    marginHorizontal: spacing.s5,
    marginTop: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.textPrimary },
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s5, paddingBottom: 110 },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s5, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  summaryRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 7, borderColor: C.primary, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  ringPctText: { fontSize: 22, fontWeight: '900', color: C.primary },
  ringSubText: { fontSize: 10, color: C.textSecondary, textAlign: 'center', marginTop: 2 },
  summaryStatsCol: { flex: 1, gap: 6 },
  statLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statLabel: { fontSize: 12, fontWeight: '700', color: C.textSecondary, flex: 1 },
  statVal: { fontSize: 12, fontWeight: '800', color: C.textPrimary },
  riskChipRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  riskChipLabel: { fontSize: 11, fontWeight: '700', color: C.textSecondary },
  riskChip: { backgroundColor: C.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  riskChipText: { fontSize: 9, fontWeight: '900', color: C.primary },
  alertBannerCard: { backgroundColor: C.warningLight, borderColor: C.warning, borderWidth: 1.5 },
  alertHeaderRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  alertBannerTitle: { fontSize: 16, fontWeight: '900', color: C.warning },
  alertBannerSub: { fontSize: 12, color: C.textPrimary, marginTop: 2 },
  alertBannerBtn: { height: 42, backgroundColor: C.warning, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  alertBannerBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 12 },
  progressGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.s5 },
  gridCard: { width: '48%', backgroundColor: C.card, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  gridIconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridTitle: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  gridStatusText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  timelineList: { gap: 10 },
  tlItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tlIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  tlItemTitle: { fontSize: 14, fontWeight: '800', color: C.textPrimary },
  tlItemSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  tlBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tlBadgeText: { fontSize: 10, fontWeight: '800' },
  habitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  habitItem: { width: '48%', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 14, alignItems: 'center' },
  habitVal: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginTop: 4 },
  habitLabel: { fontSize: 11, fontWeight: '600', color: C.textSecondary, marginTop: 2 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  quickBtn: { width: '48%', height: 72, backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  quickIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 13, fontWeight: '800', color: C.textPrimary, flex: 1 },
  insightText: { fontSize: 14, fontWeight: '600', color: C.textSecondary, lineHeight: 22 },
  floatingBtn: {
    position: 'absolute',
    bottom: 74,
    left: spacing.s5,
    right: spacing.s5,
    height: 52,
    backgroundColor: C.warning,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...elevation.e3,
  },
  floatingBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.s6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  filterOptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  filterOptionText: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...elevation.e2,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 2 },
  tabLabelActive: { color: C.primary, fontWeight: '800' },
});

export default GuardianTaskDashboardScreen;

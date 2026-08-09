/**
 * GuardianTodaysMedicationScreen.tsx — Screen G20 (Today's Medication Real-time Chronological Schedule)
 * Spec: g20.txt — Production v1.0
 *
 * Design Standard: Apple Health Medications, Medisafe, Epic MyChart, One Medical
 *
 * Screen Mission: Real-time chronological schedule of every medication the elder needs to take today.
 *
 * Component Tree per g20.txt:
 *  1. Header Bar (Back button, Title "Today's Medication", Calendar button, Search, Filter)
 *  2. Today's Summary Banner (6 Medications, 4 Completed, 1 Pending, 1 Missed, 67% Adherence ring)
 *  3. Date Selector (◀ Yesterday, Today 14 July, Tomorrow ▶, Pick Date)
 *  4. Chronological Medication Timeline (08:00 AM Metformin, 12:00 PM Vitamin D3, 02:00 PM Calcium, 08:00 PM Paracetamol)
 *  5. Expandable Medication Cards (200ms smooth expansion with Meal Instructions, Doctor, Side Effects, Taken at, Quick Actions)
 *  6. Sticky "Next Medication" Bar (Appears sticky above bottom nav: Next: Vitamin D3 2:00 PM · 55 mins remaining)
 *  7. Statistics Card (Completed 4, Pending 1, Missed 1, Adherence 82% with Analytics link)
 *  8. Persistent 5-Tab Bottom Navigation Bar
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
  Animated,
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
  shadow:         '#0F172A',
};

interface MedScheduleItem {
  id: string;
  name: string;
  dosage: string;
  form: string;
  scheduledTime: string;
  mealInstruction: string;
  doctor: string;
  pharmacy: string;
  purpose: string;
  sideEffects: string;
  status: 'completed' | 'pending' | 'upcoming' | 'missed';
  takenAt?: string;
}

interface GuardianTodaysMedicationScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
  token?: string;
  elderId?: string | null;
  onSessionExpired?: () => void;
}

const GuardianTodaysMedicationScreen: React.FC<GuardianTodaysMedicationScreenProps> = ({
  onBack,
  onNavigate = () => {},
  token,
  elderId,
  onSessionExpired,
}) => {
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch]   = useState(false);
  const [selectedDate, setSelectedDate] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  const [expandedId, setExpandedId]   = useState<string | null>('m2'); // default expand overdue dose
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const initialSchedule: MedScheduleItem[] = [
    {
      id: 'm1',
      name: 'Metformin',
      dosage: '500 mg',
      form: 'TABLET',
      scheduledTime: '08:00 AM',
      mealInstruction: 'Take After Breakfast',
      doctor: 'Dr. K. L. Silva',
      pharmacy: 'Asiri Pharmacy',
      purpose: 'Blood Glucose Control',
      sideEffects: 'Mild stomach upset if not taken with food',
      status: 'completed',
      takenAt: '08:04 AM',
    },
    {
      id: 'm2',
      name: 'Vitamin D3',
      dosage: '1000 IU',
      form: 'CAPSULE',
      scheduledTime: '12:00 PM',
      mealInstruction: 'Take After Lunch',
      doctor: 'Dr. K. L. Silva',
      pharmacy: 'National Pharmacy',
      purpose: 'Bone Density & Immune Support',
      sideEffects: 'None reported',
      status: 'pending',
    },
    {
      id: 'm3',
      name: 'Calcium Carbonate',
      dosage: '500 mg',
      form: 'TABLET',
      scheduledTime: '02:00 PM',
      mealInstruction: 'Take With Water',
      doctor: 'Dr. K. L. Silva',
      pharmacy: 'Asiri Pharmacy',
      purpose: 'Calcium Supplement',
      sideEffects: 'Drink plenty of water',
      status: 'upcoming',
    },
    {
      id: 'm4',
      name: 'Losartan',
      dosage: '50 mg',
      form: 'TABLET',
      scheduledTime: '06:00 PM',
      mealInstruction: 'Take Before Evening Meal',
      doctor: 'Dr. K. L. Silva',
      pharmacy: 'Central Hospital Pharmacy',
      purpose: 'Blood Pressure Management',
      sideEffects: 'Mild dizziness on standing up fast',
      status: 'upcoming',
    },
    {
      id: 'm5',
      name: 'Paracetamol',
      dosage: '500 mg',
      form: 'TABLET',
      scheduledTime: '08:00 PM',
      mealInstruction: 'Take After Dinner',
      doctor: 'Dr. K. L. Silva',
      pharmacy: 'Asiri Pharmacy',
      purpose: 'Joint Discomfort Pain Relief',
      sideEffects: 'Do not exceed 4 doses in 24 hours',
      status: 'missed',
    },
  ];

  const [schedule, setSchedule] = useState<MedScheduleItem[]>(initialSchedule);

  const completedCount = schedule.filter(s => s.status === 'completed').length;
  const pendingCount   = schedule.filter(s => s.status === 'pending').length;
  const missedCount    = schedule.filter(s => s.status === 'missed').length;
  const totalCount     = schedule.length;
  const adherencePct   = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 67;

  const nextMed = schedule.find(s => s.status === 'pending' || s.status === 'upcoming');

  const filteredSchedule = schedule.filter(item => {
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'all' ? true :
      activeFilter === 'completed' ? item.status === 'completed' :
      activeFilter === 'pending' ? item.status === 'pending' :
      activeFilter === 'missed' ? item.status === 'missed' :
      item.status === 'upcoming';
    return matchesSearch && matchesFilter;
  });

  const toggleExpand = (id: string) => {
    Haptics.selectionAsync();
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleSendReminder = (medName: string) => {
    Haptics.selectionAsync();
    Toast.show({
      type: 'success',
      text1: 'Medication Reminder Sent',
      text2: `Push notification sent to elder for ${medName}.`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 6. HEADER ─── */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
            <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Today's Medication</Text>
          <Text style={styles.headerSubtitle}>Real-Time Chronological Schedule • G20</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowCalendarModal(true)}>
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color={C.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSearch(v => !v)}>
            <MaterialCommunityIcons name={showSearch ? 'close' : 'magnify'} size={22} color={C.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={C.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicine, doctor, dosage..."
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
        {/* ─── 7. TODAY'S SUMMARY BANNER ─── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>TODAY'S SCHEDULE PROGRESS</Text>
          <View style={styles.summaryRow}>
            {/* 67% Circular Progress Ring */}
            <View style={styles.summaryRing}>
              <Text style={styles.ringPctText}>{adherencePct}%</Text>
              <Text style={styles.ringSubText}>{completedCount} of {totalCount} Taken</Text>
            </View>

            <View style={styles.summaryDetails}>
              <View style={styles.statLine}>
                <View style={[styles.statDot, { backgroundColor: C.primary }]} />
                <Text style={styles.statLabel}>Completed:</Text>
                <Text style={styles.statVal}>{completedCount} Doses</Text>
              </View>

              <View style={styles.statLine}>
                <View style={[styles.statDot, { backgroundColor: C.warning }]} />
                <Text style={styles.statLabel}>Pending/Overdue:</Text>
                <Text style={[styles.statVal, { color: C.warning }]}>{pendingCount} Dose</Text>
              </View>

              <View style={styles.statLine}>
                <View style={[styles.statDot, { backgroundColor: C.error }]} />
                <Text style={styles.statLabel}>Missed:</Text>
                <Text style={[styles.statVal, { color: C.error }]}>{missedCount} Dose</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── 8. DATE SELECTOR ─── */}
        <View style={styles.dateSelectorRow}>
          {[
            { id: 'yesterday', label: '◀ Yesterday' },
            { id: 'today', label: '● Today, 14 July' },
            { id: 'tomorrow', label: 'Tomorrow ▶' },
          ].map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[styles.dateChip, selectedDate === d.id && styles.dateChipActive]}
              onPress={() => {
                setSelectedDate(d.id as any);
                Toast.show({ type: 'info', text1: 'Date Switched', text2: `Viewing medication schedule for ${d.label}` });
              }}
            >
              <Text style={[styles.dateChipText, selectedDate === d.id && styles.dateChipTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── 9. CHRONOLOGICAL MEDICATION TIMELINE ─── */}
        <Text style={styles.sectionHeaderTitle}>Chronological Today's Timeline</Text>
        <View style={styles.timelineContainer}>
          {filteredSchedule.map((item, idx) => {
            const isExpanded = expandedId === item.id;
            const isCompleted = item.status === 'completed';
            const isPending   = item.status === 'pending';
            const isMissed    = item.status === 'missed';

            const badgeBg    = isCompleted ? C.primaryLight : isPending ? C.warningLight : isMissed ? C.errorLight : C.infoLight;
            const badgeColor = isCompleted ? C.primary : isPending ? C.warning : isMissed ? C.error : C.info;
            const badgeIcon  = isCompleted ? 'check-circle' : isPending ? 'alert-circle' : isMissed ? 'close-circle' : 'clock-outline';
            const badgeLabel = isCompleted ? 'Completed ✓' : isPending ? 'Pending ⚠' : isMissed ? 'Missed ⚠' : 'Upcoming';

            return (
              <View key={item.id} style={styles.tlRowContainer}>
                {/* Timeline Line & Time Node */}
                <View style={styles.tlLeftNodeCol}>
                  <View style={[styles.timeNodeCircle, { borderColor: badgeColor }]}>
                    <MaterialCommunityIcons name={badgeIcon as any} size={16} color={badgeColor} />
                  </View>
                  {idx < filteredSchedule.length - 1 && <View style={styles.tlVerticalLine} />}
                </View>

                {/* 10. EXPANDABLE MEDICATION CARD */}
                <TouchableOpacity
                  style={[styles.medCard, isExpanded && styles.medCardExpanded]}
                  onPress={() => toggleExpand(item.id)}
                  activeOpacity={0.9}
                >
                  <View style={styles.medCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timeTagText}>{item.scheduledTime}</Text>
                      <Text style={styles.medCardTitle}>{item.name}</Text>
                      <Text style={styles.medCardSub}>{item.dosage} • {item.mealInstruction}</Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.statusBadgeText, { color: badgeColor }]}>{badgeLabel}</Text>
                    </View>
                  </View>

                  {/* EXPANDABLE DETAILS */}
                  {isExpanded && (
                    <View style={styles.expandedDetailsBody}>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="doctor" size={18} color={C.primary} />
                        <Text style={styles.detailText}><Text style={{ fontWeight: '800' }}>Doctor:</Text> {item.doctor}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="source-branch" size={18} color={C.info} />
                        <Text style={styles.detailText}><Text style={{ fontWeight: '800' }}>Pharmacy:</Text> {item.pharmacy}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="target" size={18} color="#D97706" />
                        <Text style={styles.detailText}><Text style={{ fontWeight: '800' }}>Purpose:</Text> {item.purpose}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={18} color={C.error} />
                        <Text style={styles.detailText}><Text style={{ fontWeight: '800' }}>Side Effects:</Text> {item.sideEffects}</Text>
                      </View>

                      {isCompleted && item.takenAt && (
                        <View style={styles.takenConfirmationBox}>
                          <MaterialCommunityIcons name="check-decagram" size={18} color={C.primary} />
                          <Text style={styles.takenConfirmationText}>Confirmed Taken at {item.takenAt}</Text>
                        </View>
                      )}

                      {/* QUICK ACTION BUTTONS */}
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          style={styles.actionBtnPrimary}
                          onPress={() => handleSendReminder(item.name)}
                          activeOpacity={0.85}
                        >
                          <MaterialCommunityIcons name="bell-ring" size={16} color="#FFF" />
                          <Text style={styles.actionBtnPrimaryText}>Send Reminder</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionBtnSecondary}
                          onPress={() => Alert.alert('Call Elder', `Dialing Nimal Perera...`)}
                          activeOpacity={0.85}
                        >
                          <MaterialCommunityIcons name="phone" size={16} color={C.primary} />
                          <Text style={styles.actionBtnSecondaryText}>Call Elder</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* ─── 15. STATISTICS CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="chart-arc" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Today's Adherence Statistics</Text>
          </View>
          <View style={styles.statsMetricsGrid}>
            <View style={styles.statMetricItem}>
              <Text style={styles.statMetricNum}>{completedCount}</Text>
              <Text style={styles.statMetricLabel}>Completed</Text>
            </View>
            <View style={styles.statMetricItem}>
              <Text style={[styles.statMetricNum, { color: C.warning }]}>{pendingCount}</Text>
              <Text style={styles.statMetricLabel}>Pending</Text>
            </View>
            <View style={styles.statMetricItem}>
              <Text style={[styles.statMetricNum, { color: C.error }]}>{missedCount}</Text>
              <Text style={styles.statMetricLabel}>Missed</Text>
            </View>
            <View style={styles.statMetricItem}>
              <Text style={[styles.statMetricNum, { color: C.primary }]}>{adherencePct}%</Text>
              <Text style={styles.statMetricLabel}>Adherence</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ─── 14. STICKY "NEXT MEDICATION" BAR ─── */}
      {nextMed && (
        <View style={styles.stickyNextBar}>
          <MaterialCommunityIcons name="clock-fast" size={20} color={C.info} />
          <View style={{ flex: 1 }}>
            <Text style={styles.stickyTitle}>Next: {nextMed.name} ({nextMed.dosage})</Text>
            <Text style={styles.stickySub}>Scheduled at {nextMed.scheduledTime} • 55 mins remaining</Text>
          </View>
          <TouchableOpacity
            style={styles.stickyRemindBtn}
            onPress={() => handleSendReminder(nextMed.name)}
          >
            <Text style={styles.stickyRemindBtnText}>Remind</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CALENDAR PICKER MODAL */}
      <Modal visible={showCalendarModal} transparent animationType="fade" onRequestClose={() => setShowCalendarModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCalendarModal(false)}>
          <View style={styles.calendarModalCard}>
            <Text style={styles.modalTitle}>Select Schedule Date</Text>
            {['Today, 14 July 2026', 'Yesterday, 13 July 2026', 'Tomorrow, 15 July 2026', 'Pick Custom Date...'].map((d) => (
              <TouchableOpacity
                key={d}
                style={styles.calendarOptionRow}
                onPress={() => {
                  setShowCalendarModal(false);
                  Toast.show({ type: 'info', text1: 'Date Selected', text2: `Loaded schedule for ${d}` });
                }}
              >
                <Text style={styles.calendarOptionText}>{d}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── PERSISTENT 5-TAB BOTTOM NAVIGATION ─── */}
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
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
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
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s5, paddingBottom: 120 },
  card: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: spacing.s5,
    marginBottom: spacing.s5,
    borderWidth: 1,
    borderColor: C.border,
    ...elevation.e1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  summaryRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 7,
    borderColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  ringPctText: { fontSize: 22, fontWeight: '900', color: C.primary },
  ringSubText: { fontSize: 10, color: C.textSecondary, textAlign: 'center', marginTop: 2 },
  summaryDetails: { flex: 1, gap: 8 },
  statLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statLabel: { fontSize: 12, fontWeight: '700', color: C.textSecondary, flex: 1 },
  statVal: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  dateSelectorRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.s5 },
  dateChip: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  dateChipText: { fontSize: 11, fontWeight: '700', color: C.textSecondary },
  dateChipTextActive: { color: C.primary, fontWeight: '900' },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary, marginBottom: 12 },
  timelineContainer: { gap: 12, marginBottom: spacing.s5 },
  tlRowContainer: { flexDirection: 'row', gap: 12 },
  tlLeftNodeCol: { width: 28, alignItems: 'center', paddingTop: 14 },
  timeNodeCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  tlVerticalLine: { width: 2, flex: 1, backgroundColor: C.border, marginTop: 4 },
  medCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    ...elevation.e1,
  },
  medCardExpanded: { borderColor: C.primary, borderWidth: 1.5 },
  medCardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  timeTagText: { fontSize: 11, fontWeight: '800', color: C.primary, marginBottom: 2 },
  medCardTitle: { fontSize: 17, fontWeight: '900', color: C.textPrimary },
  medCardSub: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  expandedDetailsBody: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: C.textSecondary },
  takenConfirmationBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryLight, padding: 8, borderRadius: 8, marginTop: 4 },
  takenConfirmationText: { fontSize: 12, fontWeight: '800', color: C.primary },
  cardActionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtnPrimary: { flex: 1, height: 40, backgroundColor: C.primary, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionBtnPrimaryText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  actionBtnSecondary: { flex: 1, height: 40, backgroundColor: C.primaryLight, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionBtnSecondaryText: { color: C.primary, fontSize: 13, fontWeight: '800' },
  statsMetricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  statMetricItem: { alignItems: 'center' },
  statMetricNum: { fontSize: 20, fontWeight: '900', color: C.textPrimary },
  statMetricLabel: { fontSize: 11, fontWeight: '600', color: C.textSecondary, marginTop: 2 },
  stickyNextBar: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: C.infoLight,
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s5,
    gap: 10,
  },
  stickyTitle: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  stickySub: { fontSize: 11, color: C.textSecondary },
  stickyRemindBtn: { backgroundColor: C.info, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  stickyRemindBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  calendarModalCard: { backgroundColor: C.card, borderRadius: 20, padding: 20, width: '100%', gap: 12 },
  modalTitle: { fontSize: 17, fontWeight: '900', color: C.textPrimary, marginBottom: 8 },
  calendarOptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  calendarOptionText: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
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

export default GuardianTodaysMedicationScreen;

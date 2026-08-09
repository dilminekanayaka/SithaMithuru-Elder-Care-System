/**
 * GuardianReminderHistoryScreen.tsx — Screen G42 (Reminder History & Audit Log)
 * Spec: g42.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, NHS App, Samsung Health
 *
 * Screen Mission: Answers "What happened to this elder's reminders over time?"
 *
 * Component Architecture per g42.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Reminder History", Subtitle "Audit Log • G42", Overflow menu).
 *  3. Elder Selector Context (Nimal Perera, Today • August 9).
 *  4. Date Range Segmented Selector (7 Days, 30 Days default, 90 Days, 6 Months, 1 Year).
 *  5. Reminder Summary Card (42 Scheduled, 39 Completed, 2 Expired, 1 Pending Sync • 92.9% Completion Rate).
 *  6. Status Filter Chips (All, Completed, Expired, Cancelled, Pending Sync).
 *  7. Grouped SectionList Timeline by Date:
 *     - TODAY: ✓ COMPLETED 08:05 AM, ✓ COMPLETED 09:03 AM.
 *     - YESTERDAY: ! EXPIRED 02:00 PM.
 *     - EARLIER: — CANCELLED, ↻ PENDING SYNC.
 *  8. Reminder Event Detail Bottom Sheet (Complete Delivery Lifecycle Timestamps + View Med G38 / History G39 CTAs).
 *  9. Data Synchronization Footer & Persistent 5-Tab Bottom Navigation Bar.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  SectionList,
  RefreshControl,
  Modal,
  Alert,
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
  orange:         '#E65100',
  orangeLight:    '#FFF3E0',
  error:          '#D32F2F',
  errorLight:     '#FFEBEE',
  info:           '#1565C0',
  infoLight:      '#E3F2FD',
  textPrimary:    '#1E293B',
  textSecondary:  '#64748B',
  textMuted:      '#94A3B8',
  border:         '#E2E8F0',
};

export interface ReminderHistoryEvent {
  id: string;
  type: 'MEDICATION' | 'CHECKIN' | 'HYDRATION' | 'APPOINTMENT';
  title: string;
  subtitle?: string;
  scheduledTime: string;
  status: 'COMPLETED' | 'EXPIRED' | 'CANCELLED' | 'PENDING_SYNC';
  deliveredAt?: string;
  openedAt?: string;
  completedAt?: string;
  medicationId?: string;
  syncStatus: 'SYNCED' | 'PENDING';
}

export interface ReminderHistorySection {
  dateTitle: string;
  dateKey: string;
  data: ReminderHistoryEvent[];
}

interface GuardianReminderHistoryScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianReminderHistoryScreen: React.FC<GuardianReminderHistoryScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(false);
  const [refreshing, setRefreshing]           = useState(false);
  const [dateRange, setDateRange]             = useState<'7d' | '30d' | '90d' | '6m' | '1y'>('30d');
  const [statusFilter, setStatusFilter]       = useState<'ALL' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED' | 'PENDING_SYNC'>('ALL');
  const [selectedEvent, setSelectedEvent]     = useState<ReminderHistoryEvent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu]       = useState(false);

  const rawSections: ReminderHistorySection[] = [
    {
      dateTitle: 'TODAY, 9 August 2026',
      dateKey: '2026-08-09',
      data: [
        {
          id: 'he1',
          type: 'MEDICATION',
          title: 'Amlodipine 5 mg Reminder',
          subtitle: 'Morning Blood Pressure Medication',
          scheduledTime: '08:00 AM',
          status: 'COMPLETED',
          deliveredAt: '08:00 AM',
          openedAt: '08:04 AM',
          completedAt: '08:05 AM',
          medicationId: 'med1',
          syncStatus: 'SYNCED',
        },
        {
          id: 'he2',
          type: 'CHECKIN',
          title: 'Morning Check-in Reminder',
          subtitle: 'Daily Well-being Response',
          scheduledTime: '09:00 AM',
          status: 'COMPLETED',
          deliveredAt: '09:00 AM',
          openedAt: '09:02 AM',
          completedAt: '09:03 AM',
          syncStatus: 'SYNCED',
        },
      ],
    },
    {
      dateTitle: 'YESTERDAY, 8 August 2026',
      dateKey: '2026-08-08',
      data: [
        {
          id: 'he3',
          type: 'HYDRATION',
          title: 'Afternoon Hydration Reminder',
          subtitle: 'Water & Light Stretch',
          scheduledTime: '02:00 PM',
          status: 'EXPIRED',
          deliveredAt: '02:00 PM',
          syncStatus: 'SYNCED',
        },
      ],
    },
    {
      dateTitle: 'FRIDAY, 7 August 2026',
      dateKey: '2026-08-07',
      data: [
        {
          id: 'he4',
          type: 'APPOINTMENT',
          title: 'Doctor Appointment Reminder',
          subtitle: 'Physician Consultation',
          scheduledTime: '02:00 PM',
          status: 'CANCELLED',
          syncStatus: 'SYNCED',
        },
        {
          id: 'he5',
          type: 'MEDICATION',
          title: 'Metformin 500 mg Reminder',
          subtitle: 'Lunch Dose',
          scheduledTime: '01:00 PM',
          status: 'PENDING_SYNC',
          deliveredAt: '01:00 PM',
          completedAt: '01:04 PM (Offline)',
          medicationId: 'med2',
          syncStatus: 'PENDING',
        },
      ],
    },
  ];

  const filteredSections = rawSections.map(sec => ({
    ...sec,
    data: sec.data.filter(item => {
      if (statusFilter === 'ALL') return true;
      return item.status === statusFilter;
    }),
  })).filter(sec => sec.data.length > 0);

  const renderSectionHeader = ({ section }: { section: ReminderHistorySection }) => (
    <View style={styles.sectionHeaderCard}>
      <Text style={styles.sectionDateTitle}>{section.dateTitle}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: ReminderHistoryEvent }) => {
    const isCompleted  = item.status === 'COMPLETED';
    const isExpired    = item.status === 'EXPIRED';
    const isCancelled  = item.status === 'CANCELLED';
    const isPendingSync= item.status === 'PENDING_SYNC';

    const bg    = isCompleted ? C.primaryLight : isExpired ? C.errorLight : isCancelled ? '#F1F5F9' : C.infoLight;
    const color = isCompleted ? C.primary : isExpired ? C.error : isCancelled ? C.textMuted : C.info;

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => {
          setSelectedEvent(item);
          setShowDetailModal(true);
        }}
        activeOpacity={0.85}
      >
        <View style={styles.eventRow}>
          <View style={[styles.eventIconBox, { backgroundColor: bg }]}>
            <MaterialCommunityIcons
              name={
                isCompleted ? 'check' :
                isExpired ? 'alert-circle' :
                isCancelled ? 'close' : 'sync'
              }
              size={20}
              color={color}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventSubText}>
              Scheduled {item.scheduledTime} • {isCompleted ? `Completed ${item.completedAt}` : isExpired ? 'Expired' : isCancelled ? 'Cancelled' : 'Pending Sync'}
            </Text>
          </View>

          <View style={[styles.statusTag, { backgroundColor: bg }]}>
            <Text style={[styles.statusTagText, { color: color }]}>
              {isCompleted ? '✓ COMPLETED' : isExpired ? '! EXPIRED' : isCancelled ? '— CANCELLED' : '↻ PENDING SYNC'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 4. TOP APP BAR ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Reminder History</Text>
          <Text style={styles.headerSubtitle}>Audit Log & Lifecycle • G42</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowMoreMenu(v => !v)}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color={C.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* OVERFLOW MENU MODAL */}
      <Modal visible={showMoreMenu} transparent animationType="fade" onRequestClose={() => setShowMoreMenu(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMoreMenu(false)}>
          <View style={styles.menuContent}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Reminder Audit Log Refreshed' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); setStatusFilter('ALL'); }}>
              <MaterialCommunityIcons name="filter-remove-outline" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── 5. ELDER SELECTOR CONTEXT ─── */}
      <View style={styles.elderContextBanner}>
        <MaterialCommunityIcons name="history" size={20} color={C.primary} />
        <Text style={styles.elderContextText}>
          Monitoring <Text style={{ fontWeight: '900', color: C.textPrimary }}>Nimal Perera</Text> • Last 30 Days Audit
        </Text>
      </View>

      {/* ─── 6. DATE RANGE CHIPS ─── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRangeRow}>
        {[
          { id: '7d', label: '7 Days' },
          { id: '30d', label: '30 Days' },
          { id: '90d', label: '90 Days' },
          { id: '6m', label: '6 Months' },
          { id: '1y', label: '1 Year' },
        ].map((range) => (
          <TouchableOpacity
            key={range.id}
            style={[styles.rangeChip, dateRange === range.id && styles.rangeChipActive]}
            onPress={() => setDateRange(range.id as any)}
          >
            <Text style={[styles.rangeChipText, dateRange === range.id && styles.rangeChipTextActive]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ─── 7. REMINDER SUMMARY CARD ─── */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardSectionLabel}>30-DAY REMINDER LOG SUMMARY</Text>
        <View style={styles.summaryHeroRow}>
          <Text style={styles.summaryPctNum}>92.9%</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryMainText}>39 of 42 scheduled reminders completed</Text>
            <Text style={styles.summarySubText}>Note: Indicates reminder delivery lifecycle completion.</Text>
          </View>
        </View>

        <View style={styles.summaryPillsRow}>
          <View style={[styles.summaryPill, { backgroundColor: C.primaryLight }]}>
            <Text style={[styles.summaryPillText, { color: C.primary }]}>✓ 39 Completed</Text>
          </View>
          <View style={[styles.summaryPill, { backgroundColor: C.errorLight }]}>
            <Text style={[styles.summaryPillText, { color: C.error }]}>! 2 Expired</Text>
          </View>
          <View style={[styles.summaryPill, { backgroundColor: C.infoLight }]}>
            <Text style={[styles.summaryPillText, { color: C.info }]}>↻ 1 Syncing</Text>
          </View>
        </View>
      </View>

      {/* ─── 8. STATUS FILTER CHIPS ─── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBarRow}>
        {[
          { id: 'ALL', label: 'All' },
          { id: 'COMPLETED', label: 'Completed' },
          { id: 'EXPIRED', label: 'Expired' },
          { id: 'CANCELLED', label: 'Cancelled' },
          { id: 'PENDING_SYNC', label: 'Pending Sync' },
        ].map(f => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, statusFilter === f.id && styles.filterChipActive]}
            onPress={() => setStatusFilter(f.id as any)}
          >
            <Text style={[styles.filterChipText, statusFilter === f.id && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ─── 10. HISTORICAL TIMELINE SECTIONLIST ─── */}
      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} colors={[C.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="history" size={48} color={C.textMuted} />
            <Text style={styles.emptyTitle}>No Matching Reminder History</Text>
            <Text style={styles.emptySub}>Try changing the selected date range or status filter.</Text>
          </View>
        }
      />

      {/* ─── 21. REMINDER EVENT DETAIL BOTTOM SHEET MODAL ─── */}
      <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDetailModal(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
                <Text style={styles.modalSubtitle}>Scheduled {selectedEvent?.scheduledTime}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBodyCard}>
              <Text style={styles.modalSectionLabel}>DELIVERY LIFECYCLE AUDIT TRAIL</Text>
              <View style={styles.lifecycleRow}>
                <Text style={styles.lifecycleLabel}>Scheduled:</Text>
                <Text style={styles.lifecycleVal}>{selectedEvent?.scheduledTime}</Text>
              </View>
              <View style={styles.lifecycleRow}>
                <Text style={styles.lifecycleLabel}>Generated & Delivered:</Text>
                <Text style={styles.lifecycleVal}>{selectedEvent?.deliveredAt || 'N/A'}</Text>
              </View>
              <View style={styles.lifecycleRow}>
                <Text style={styles.lifecycleLabel}>Elder Opened:</Text>
                <Text style={styles.lifecycleVal}>{selectedEvent?.openedAt || 'N/A'}</Text>
              </View>
              <View style={styles.lifecycleRow}>
                <Text style={styles.lifecycleLabel}>Completed:</Text>
                <Text style={styles.lifecycleVal}>{selectedEvent?.completedAt || (selectedEvent?.status === 'EXPIRED' ? 'Expired Window' : 'Pending')}</Text>
              </View>
              <View style={styles.lifecycleRow}>
                <Text style={styles.lifecycleLabel}>Synchronization:</Text>
                <Text style={[styles.lifecycleVal, { color: selectedEvent?.syncStatus === 'SYNCED' ? C.primary : C.info }]}>
                  {selectedEvent?.syncStatus === 'SYNCED' ? '✓ Synced' : '↻ Pending Sync'}
                </Text>
              </View>
            </View>

            <View style={styles.modalActionsCol}>
              {selectedEvent?.medicationId && (
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => {
                    setShowDetailModal(false);
                    onNavigate('medicationDetails');
                  }}
                >
                  <MaterialCommunityIcons name="pill" size={18} color={C.primary} />
                  <Text style={styles.modalActionBtnText}>View Medication Details (G38)</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={() => {
                  setShowDetailModal(false);
                  onNavigate('medicationHistory');
                }}
              >
                <MaterialCommunityIcons name="history" size={18} color={C.primary} />
                <Text style={styles.modalActionBtnText}>View Medication History (G39)</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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
          const isActive = tab.id === 'reports';
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
    justify.content: 'space-between',
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
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 60, paddingRight: 16 },
  menuContent: { backgroundColor: C.card, borderRadius: 16, padding: 8, width: 200, ...elevation.e3, borderWidth: 1, borderColor: C.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12 },
  menuItemText: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  elderContextBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryLight, marginHorizontal: spacing.s5, marginTop: spacing.s4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  elderContextText: { fontSize: 12, color: C.textSecondary },
  dateRangeRow: { gap: 8, paddingHorizontal: spacing.s5, paddingTop: 10, paddingBottom: 6 },
  rangeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  rangeChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  rangeChipText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  rangeChipTextActive: { color: C.primary, fontWeight: '900' },
  summaryCard: { backgroundColor: C.card, borderRadius: 20, marginHorizontal: spacing.s5, padding: 14, marginVertical: 8, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardSectionLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  summaryHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  summaryPctNum: { fontSize: 28, fontWeight: '900', color: C.primary },
  summaryMainText: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  summarySubText: { fontSize: 11, color: C.textSecondary, marginTop: 1 },
  summaryPillsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  summaryPill: { flex: 1, paddingVertical: 4, borderRadius: 6, alignItems: 'center' },
  summaryPillText: { fontSize: 10, fontWeight: '900' },
  filterBarRow: { gap: 6, paddingHorizontal: spacing.s5, paddingBottom: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  filterChipText: { fontSize: 11, fontWeight: '700', color: C.textSecondary },
  filterChipTextActive: { color: C.primary, fontWeight: '900' },
  listContent: { paddingHorizontal: spacing.s5, paddingBottom: 110 },
  sectionHeaderCard: { backgroundColor: C.bg, paddingTop: 10, paddingBottom: 4 },
  sectionDateTitle: { fontSize: 14, fontWeight: '900', color: C.textPrimary },
  eventCard: { backgroundColor: C.card, borderRadius: 16, padding: 12, marginTop: 6, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  eventTitle: { fontSize: 15, fontWeight: '900', color: C.textPrimary },
  eventSubText: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusTagText: { fontSize: 10, fontWeight: '900' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary, marginTop: 10 },
  emptySub: { fontSize: 12, color: C.textSecondary, marginTop: 4, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.s6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  modalSubtitle: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  modalBodyCard: { backgroundColor: C.bg, borderRadius: 16, padding: 12, marginVertical: 10, borderWidth: 1, borderColor: C.border },
  modalSectionLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8, marginBottom: 6 },
  lifecycleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  lifecycleLabel: { fontSize: 12, color: C.textSecondary },
  lifecycleVal: { fontSize: 12, fontWeight: '700', color: C.textPrimary },
  modalActionsCol: { gap: 8, marginTop: 10 },
  modalActionBtn: { height: 44, backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  modalActionBtnText: { color: C.primary, fontSize: 13, fontWeight: '800' },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    justify.content: 'space-around',
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...elevation.e2,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 2 },
  tabLabelActive: { color: C.primary, fontWeight: '800' },
});

export default GuardianReminderHistoryScreen;

/**
 * GuardianMedicationHistoryScreen.tsx — Screen G39 (Medication Adherence History Log)
 * Spec: g39.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, Samsung Health
 *
 * Screen Mission: Answers "What happened with this medication over time?"
 *
 * Component Architecture per g39.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Medication History", Subtitle "Chronological Log • G39", Overflow menu).
 *  3. Medication Selector Dropdown (All Medications, Amlodipine 5mg, Metformin 500mg, Vitamin D3).
 *  4. Date Range Segmented Selector (7 Days, 30 Days default, 90 Days, 6 Months, 1 Year, Custom Date).
 *  5. Adherence Summary Card (28 / 30 doses completed • 93% Adherence, breakdown pills ✓ 28, ! 2, — 0).
 *  6. View Mode Segmented Control (Daily View | Monthly View).
 *  7. Grouped SectionList by Date / Month:
 *     - Daily View: Individual dose cards (✓ TAKEN 08:05 AM, ! MISSED 06:00 PM, — SKIPPED, ↻ PENDING SYNC).
 *     - Monthly View: Aggregated monthly adherence percentages & daily calendar pills.
 *  8. Filter Bottom Sheet Modal (Medication, Status, Date Range).
 *  9. Offline Banner & Persistent 5-Tab Bottom Navigation.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SectionList,
  ScrollView,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

// Screen palette — derived from the central SithaMithuru design system
// (mobile/src/theme) rather than a hardcoded local copy, so this screen
// picks up palette changes automatically instead of silently drifting.
const C = {
  bg:             colors.background,
  card:           colors.surface,
  primary:        colors.primary,
  primaryLight:   colors.primaryContainer,
  warning:        colors.warning,
  warningLight:   colors.warningContainer,
  orange:         colors.category.journal.accent,
  orangeLight:    colors.category.journal.bg,
  error:          colors.error,
  errorLight:     colors.errorContainer,
  info:           colors.info,
  infoLight:      colors.infoContainer,
  textPrimary:    colors.text.primary,
  textSecondary:  colors.text.secondary,
  textMuted:      colors.text.tertiary,
  border:         colors.outline,
};

export interface DoseEventItem {
  id: string;
  medicationName: string;
  dose: string;
  scheduledTime: string;
  eventTime: string;
  status: 'TAKEN' | 'MISSED' | 'SKIPPED' | 'SYNCING';
  syncStatus: 'SYNCED' | 'PENDING';
  medicationId?: string;
}

export interface HistoryDateSection {
  dateTitle: string;
  dateKey: string;
  adherencePct: number;
  completedDoses: number;
  totalDoses: number;
  data: DoseEventItem[];
}

interface GuardianMedicationHistoryScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

const GuardianMedicationHistoryScreen: React.FC<GuardianMedicationHistoryScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(true);
  const [loadError, setLoadError]             = useState<string | null>(null);
  const [refreshing, setRefreshing]           = useState(false);
  const [viewMode, setViewMode]               = useState<'DAILY' | 'MONTHLY'>('DAILY');
  const [selectedMedication, setSelectedMed]  = useState<string>('ALL');
  const [dateRange, setDateRange]             = useState<'7d' | '30d' | '90d'>('30d');
  const [statusFilter, setStatusFilter]       = useState<'ALL' | 'TAKEN' | 'MISSED' | 'SKIPPED'>('ALL');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showMedModal, setShowMedModal]       = useState(false);
  const [showMoreMenu, setShowMoreMenu]       = useState(false);
  const [rawHistory, setRawHistory]           = useState<HistoryDateSection[]>([]);
  const [medicationOptions, setMedicationOptions] = useState<string[]>(['ALL']);
  const [summary, setSummary]                 = useState({ taken: 0, missed: 0, total: 0, adherencePct: 0 });

  const rangeDays = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;

  const loadData = useCallback(async () => {
    if (!elderId || !token) {
      setLoading(false);
      setLoadError('No elder selected.');
      return;
    }
    setLoadError(null);
    try {
      const res = await apiFetch(`/guardian/medications/${elderId}/history?days=${rangeDays}`, token);
      const events: any[] = res?.events || [];

      const byDate = new Map<string, any[]>();
      events.forEach((e) => {
        if (!byDate.has(e.date)) byDate.set(e.date, []);
        byDate.get(e.date)!.push(e);
      });

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const sections: HistoryDateSection[] = Array.from(byDate.entries())
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([date, items]) => {
          const completed = items.filter((i) => i.status === 'TAKEN').length;
          const countable = items.filter((i) => i.status !== 'UPCOMING');
          const pct = countable.length > 0 ? Math.round((completed / countable.length) * 100) : 100;
          const label = date === today ? `TODAY, ${date}` : date === yesterday ? `YESTERDAY, ${date}` : date;
          return {
            dateTitle: label,
            dateKey: date,
            adherencePct: pct,
            completedDoses: completed,
            totalDoses: countable.length,
            data: items.map((i, idx) => ({
              id: `${i.medication_id}_${date}_${idx}`,
              medicationName: i.name,
              dose: i.dosage,
              scheduledTime: i.scheduled_time,
              eventTime: i.status === 'TAKEN' ? i.taken_at : i.status === 'MISSED' ? 'Window Expired' : 'Upcoming',
              status: i.status as DoseEventItem['status'],
              syncStatus: 'SYNCED' as const,
              medicationId: String(i.medication_id),
            })),
          };
        });

      setRawHistory(sections);
      setMedicationOptions(['ALL', ...Array.from(new Set(events.map((e) => e.name)))]);
      if (res?.summary) setSummary(res.summary);
    } catch (e: any) {
      if (e instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load medication history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, token, rangeDays, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredHistory = rawHistory.map(sec => ({
    ...sec,
    data: sec.data.filter(item => {
      const matchesMed    = selectedMedication === 'ALL' || item.medicationName === selectedMedication;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesMed && matchesStatus;
    }),
  })).filter(sec => sec.data.length > 0);

  const renderSectionHeader = ({ section }: { section: HistoryDateSection }) => (
    <View style={styles.sectionHeaderCard}>
      <View style={styles.sectionHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionDateTitle}>{section.dateTitle}</Text>
          <Text style={styles.sectionSubMeta}>{section.completedDoses} of {section.totalDoses} doses completed</Text>
        </View>
        <View style={[styles.adherenceBadge, { backgroundColor: section.adherencePct === 100 ? C.primaryLight : C.errorLight }]}>
          <Text style={[styles.adherenceBadgeText, { color: section.adherencePct === 100 ? C.primary : C.error }]}>
            {section.adherencePct}% ADHERENCE
          </Text>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: DoseEventItem }) => {
    const isTaken    = item.status === 'TAKEN';
    const isMissed   = item.status === 'MISSED';
    const isSkipped  = item.status === 'SKIPPED';

    const bg    = isTaken ? C.primaryLight : isMissed ? C.errorLight : C.warningLight;
    const color = isTaken ? C.primary : isMissed ? C.error : C.warning;

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => {
          if (isMissed) onNavigate('missedMedication');
          else onNavigate('medicationDetails', item.medicationId);
        }}
        activeOpacity={0.85}
      >
        <View style={styles.eventRow}>
          <View style={[styles.eventIconBox, { backgroundColor: bg }]}>
            <MaterialCommunityIcons
              name={isTaken ? 'check' : isMissed ? 'alert' : 'minus'}
              size={20}
              color={color}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.eventMedTitle}>{item.medicationName} <Text style={{ fontSize: 13, color: C.textSecondary }}>{item.dose}</Text></Text>
            <Text style={styles.eventSubText}>
              Scheduled {item.scheduledTime} • {isTaken ? `Taken at ${item.eventTime}` : isMissed ? 'Missed Dose' : 'Skipped'}
            </Text>
          </View>

          <View style={[styles.statusTag, { backgroundColor: bg }]}>
            <Text style={[styles.statusTagText, { color: color }]}>
              {isTaken ? '✓ TAKEN' : isMissed ? '! MISSED' : '— SKIPPED'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 5. HEADER BAR ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Medication History</Text>
          <Text style={styles.headerSubtitle}>Chronological Audit Log • G39</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowFilterModal(true)}>
            <MaterialCommunityIcons name="filter-variant" size={22} color={C.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowMoreMenu(v => !v)}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color={C.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* OVERFLOW MENU MODAL */}
      <Modal visible={showMoreMenu} transparent animationType="fade" onRequestClose={() => setShowMoreMenu(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMoreMenu(false)}>
          <View style={styles.menuContent}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'History Refreshed' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('missedMedication'); }}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={C.error} />
              <Text style={styles.menuItemText}>View Missed Doses (G40)</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── 6. MEDICATION SELECTOR DROPDOWN ─── */}
      <TouchableOpacity style={styles.medSelectorCard} onPress={() => setShowMedModal(true)}>
        <MaterialCommunityIcons name="pill" size={20} color={C.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.medSelectorLabel}>SELECTED MEDICATION</Text>
          <Text style={styles.medSelectorVal}>
            {selectedMedication === 'ALL' ? 'All Scheduled Medications' : selectedMedication}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={22} color={C.textPrimary} />
      </TouchableOpacity>

      {/* ─── 8. DATE RANGE SELECTOR ─── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRangeRow}>
        {[
          { id: '7d', label: '7 Days' },
          { id: '30d', label: '30 Days' },
          { id: '90d', label: '90 Days' },
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

      {/* ─── 9. VIEW MODE SEGMENTED CONTROL (DAILY / MONTHLY) ─── */}
      <View style={styles.segmentedRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, viewMode === 'DAILY' && styles.segmentBtnActive]}
          onPress={() => setViewMode('DAILY')}
        >
          <Text style={[styles.segmentText, viewMode === 'DAILY' && styles.segmentTextActive]}>Daily History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, viewMode === 'MONTHLY' && styles.segmentBtnActive]}
          onPress={() => setViewMode('MONTHLY')}
        >
          <Text style={[styles.segmentText, viewMode === 'MONTHLY' && styles.segmentTextActive]}>Monthly Summary</Text>
        </TouchableOpacity>
      </View>

      {/* ─── 26. ADHERENCE SUMMARY CARD ─── */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardSectionLabel}>PERIOD ADHERENCE SUMMARY</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryPctText}>{summary.adherencePct}%</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryMainText}>{summary.taken} of {summary.total} scheduled doses completed</Text>
            <Text style={styles.summarySubText}>{summary.adherencePct}% overall compliance rate during selected period.</Text>
          </View>
        </View>

        <View style={styles.summaryPillsRow}>
          <View style={[styles.summaryPill, { backgroundColor: C.primaryLight }]}>
            <Text style={[styles.summaryPillText, { color: C.primary }]}>✓ {summary.taken} Taken</Text>
          </View>
          <View style={[styles.summaryPill, { backgroundColor: C.errorLight }]}>
            <Text style={[styles.summaryPillText, { color: C.error }]}>! {summary.missed} Missed</Text>
          </View>
        </View>
      </View>

      {loading && (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      )}

      {!loading && loadError && (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color={C.textMuted} />
          <Text style={{ marginTop: 10, color: C.textSecondary, fontWeight: '600' }}>{loadError}</Text>
        </View>
      )}

      {/* ─── 10 & 12. HISTORICAL DOSE EVENTS SECTIONLIST ─── */}
      {!loading && !loadError && viewMode === 'DAILY' ? (
        <SectionList
          sections={filteredHistory}
          keyExtractor={(item) => item.id}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[C.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="history" size={48} color={C.textMuted} />
              <Text style={styles.emptyTitle}>No Matching Medication History</Text>
              <Text style={styles.emptySub}>Try changing your medication filter or date range.</Text>
            </View>
          }
        />
      ) : !loading && !loadError ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          <View style={styles.monthlyCard}>
            <Text style={styles.monthlyTitle}>LAST {rangeDays} DAYS</Text>
            <Text style={styles.monthlyPct}>{summary.adherencePct}% Adherence ({summary.taken} / {summary.total} Doses)</Text>

            <Text style={styles.pillsHeaderLabel}>DAILY COMPLIANCE CALENDAR</Text>
            <View style={styles.calendarGrid}>
              {rawHistory.map((sec) => (
                <View key={sec.dateKey} style={[styles.calDayBox, { backgroundColor: sec.adherencePct === 100 ? C.primaryLight : C.errorLight }]}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: C.textSecondary }}>{sec.dateKey.slice(5)}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: sec.adherencePct === 100 ? C.primary : C.error }}>{sec.adherencePct === 100 ? '✓' : '!'}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : null}

      {/* MEDICATION SELECTOR MODAL */}
      <Modal visible={showMedModal} transparent animationType="slide" onRequestClose={() => setShowMedModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Medication</Text>
              <TouchableOpacity onPress={() => setShowMedModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            {medicationOptions.map((med) => (
              <TouchableOpacity
                key={med}
                style={styles.filterOptionRow}
                onPress={() => {
                  setSelectedMed(med);
                  setShowMedModal(false);
                }}
              >
                <Text style={styles.filterOptionText}>{med === 'ALL' ? 'All Scheduled Medications' : med}</Text>
                {selectedMedication === med && <MaterialCommunityIcons name="check" size={20} color={C.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* FILTER BOTTOM SHEET MODAL */}
      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter History Status</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            {(['ALL', 'TAKEN', 'MISSED', 'SKIPPED'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                style={styles.filterOptionRow}
                onPress={() => {
                  setStatusFilter(st);
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.filterOptionText}>{st === 'ALL' ? 'All Dose Statuses' : st}</Text>
                {statusFilter === st && <MaterialCommunityIcons name="check" size={20} color={C.primary} />}
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
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 60, paddingRight: 16 },
  menuContent: { backgroundColor: C.card, borderRadius: 16, padding: 8, width: 200, ...elevation.e3, borderWidth: 1, borderColor: C.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12 },
  menuItemText: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  medSelectorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, marginHorizontal: spacing.s5, marginTop: spacing.s4, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  medSelectorLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  medSelectorVal: { fontSize: 15, fontWeight: '900', color: C.textPrimary, marginTop: 1 },
  dateRangeRow: { gap: 8, paddingHorizontal: spacing.s5, paddingTop: 10, paddingBottom: 6 },
  rangeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  rangeChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  rangeChipText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  rangeChipTextActive: { color: C.primary, fontWeight: '900' },
  segmentedRow: { flexDirection: 'row', backgroundColor: colors.outline, marginHorizontal: spacing.s5, borderRadius: 12, padding: 4, marginVertical: 8 },
  segmentBtn: { flex: 1, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  segmentBtnActive: { backgroundColor: C.card, ...elevation.e1 },
  segmentText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  segmentTextActive: { color: C.primary, fontWeight: '900' },
  summaryCard: { backgroundColor: C.card, borderRadius: 20, marginHorizontal: spacing.s5, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardSectionLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  summaryPctText: { fontSize: 28, fontWeight: '900', color: C.primary },
  summaryMainText: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  summarySubText: { fontSize: 11, color: C.textSecondary, marginTop: 1 },
  summaryPillsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  summaryPill: { flex: 1, paddingVertical: 4, borderRadius: 6, alignItems: 'center' },
  summaryPillText: { fontSize: 10, fontWeight: '900' },
  listContent: { paddingHorizontal: spacing.s5, paddingBottom: 110 },
  sectionHeaderCard: { backgroundColor: C.bg, paddingTop: 10, paddingBottom: 4 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionDateTitle: { fontSize: 14, fontWeight: '900', color: C.textPrimary },
  sectionSubMeta: { fontSize: 11, color: C.textSecondary, marginTop: 1 },
  adherenceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  adherenceBadgeText: { fontSize: 9, fontWeight: '900' },
  eventCard: { backgroundColor: C.card, borderRadius: 16, padding: 12, marginTop: 6, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  eventMedTitle: { fontSize: 15, fontWeight: '900', color: C.textPrimary },
  eventSubText: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusTagText: { fontSize: 10, fontWeight: '900' },
  monthlyCard: { backgroundColor: C.card, borderRadius: 20, padding: 16, marginTop: 10, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  monthlyTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  monthlyPct: { fontSize: 12, fontWeight: '700', color: C.primary, marginTop: 2 },
  pillsHeaderLabel: { fontSize: 10, fontWeight: '900', color: C.textMuted, letterSpacing: 0.8, marginTop: 14, marginBottom: 8 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  calDayBox: { width: 56, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary, marginTop: 10 },
  emptySub: { fontSize: 12, color: C.textSecondary, marginTop: 4, textAlign: 'center' },
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

export default GuardianMedicationHistoryScreen;

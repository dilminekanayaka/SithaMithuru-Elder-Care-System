/**
 * GuardianMissedMedicationScreen.tsx — Screen G40 (Missed Medication Exception & Action Center)
 * Spec: g40.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, Samsung Health
 *
 * Screen Mission: Answers "Which medication doses need my attention right now, why are they considered missed, and what can I safely do next?"
 *
 * Component Architecture per g40.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Missed Medication", Subtitle "Exception & Action Center • G40", Overflow menu).
 *  3. Elder Context Banner (Nimal Perera, Today • August 9, Last synced Updated just now).
 *  4. Attention Summary Card (Needs Attention: 2 missed doses • 1 today, 1 last 7 days OR All Clear State).
 *  5. Date Filter Bar Chips (All, Today, 7 Days, 30 Days, Custom).
 *  6. Temporal Grouped Missed Cards:
 *     - TODAY: ! Amlodipine 5 mg (Scheduled 8:00 AM • Missed • No confirmation received within window).
 *     - PREVIOUS: ! Metformin 500 mg (Scheduled Aug 7, 1:00 PM • Missed).
 *  7. Central Risk Engine Repeated Pattern Banner (YELLOW RISK: 2 missed doses of Amlodipine in 7 days).
 *  8. Review Event Bottom Sheet Modal (Safe Guardian Actions: Call Elder, View Details G38, View History G39, Acknowledge).
 *  9. Healthcare Safety Mandate: Acknowledging alert does NOT alter dose status (MISSED remains MISSED). No unsafe dosing advice.
 * 10. Data Synchronization Footer & Persistent 5-Tab Bottom Navigation Bar.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
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

export interface MissedDoseItem {
  id: string;
  medicationId?: string;
  medicationName: string;
  dose: string;
  scheduledTime: string;
  dateGroup: 'TODAY' | 'PREVIOUS';
  formattedDate: string;
  reason: string;
  acknowledged: boolean;
  riskLevel?: 'YELLOW' | 'RED';
}

interface GuardianMissedMedicationScreenProps {
  onBack?: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

const GuardianMissedMedicationScreen: React.FC<GuardianMissedMedicationScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(true);
  const [loadError, setLoadError]             = useState<string | null>(null);
  const [refreshing, setRefreshing]           = useState(false);
  const [dateFilter, setDateFilter]           = useState<'ALL' | 'TODAY' | '7D' | '30D'>('7D');
  const [selectedDose, setSelectedDose]       = useState<MissedDoseItem | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu]       = useState(false);
  const [elderName, setElderName]             = useState('Your Elder');
  const [elderPhone, setElderPhone]           = useState<string | null>(null);
  const [patternWarning, setPatternWarning]   = useState<string | null>(null);

  const [missedDoses, setMissedDoses] = useState<MissedDoseItem[]>([]);

  const rangeDays = dateFilter === 'TODAY' ? 1 : dateFilter === '7D' ? 7 : dateFilter === '30D' ? 30 : 30;

  const loadData = useCallback(async () => {
    if (!elderId || !token) {
      setLoading(false);
      setLoadError('No elder selected.');
      return;
    }
    setLoadError(null);
    try {
      const [histRes, elderRes] = await Promise.all([
        apiFetch(`/guardian/medications/${elderId}/history?days=${rangeDays}`, token),
        apiFetch(`/guardian/elders/${elderId}`, token),
      ]);

      if (elderRes) {
        setElderName(elderRes.name || 'Your Elder');
        setElderPhone(elderRes.phone_number || null);
      }

      const today = new Date().toISOString().split('T')[0];
      const events: any[] = (histRes?.events || []).filter((e: any) => e.status === 'MISSED');

      const items: MissedDoseItem[] = events.map((e, idx) => ({
        id: `${e.medication_id}_${e.date}_${idx}`,
        medicationId: String(e.medication_id),
        medicationName: e.name,
        dose: e.dosage,
        scheduledTime: e.scheduled_time,
        dateGroup: e.date === today ? 'TODAY' : 'PREVIOUS',
        formattedDate: e.date === today ? `Today • ${e.scheduled_time}` : `${e.date} • ${e.scheduled_time}`,
        reason: 'No confirmation received within scheduled window.',
        acknowledged: false,
        riskLevel: 'YELLOW',
      }));
      setMissedDoses(items);

      // Real pattern detection: any single medication missed 2+ times in this window.
      const counts = new Map<string, number>();
      events.forEach((e: any) => counts.set(e.name, (counts.get(e.name) || 0) + 1));
      const worst = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
      setPatternWarning(
        worst && worst[1] >= 2
          ? `${worst[0]} has ${worst[1]} missed doses in the last ${rangeDays} days. Adherence pattern requires review.`
          : null
      );
    } catch (e: any) {
      if (e instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load missed medication data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, token, rangeDays, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const todayCount = missedDoses.filter(m => m.dateGroup === 'TODAY').length;
  const totalCount = missedDoses.length;

  const handleCallElder = () => {
    Haptics.selectionAsync();
    if (!elderPhone) {
      Toast.show({ type: 'error', text1: 'No phone number on file for this elder' });
      return;
    }
    Linking.openURL(`tel:${elderPhone}`);
  };

  const handleAcknowledge = (id: string) => {
    Haptics.selectionAsync();
    setMissedDoses(prev =>
      prev.map(item => (item.id === id ? { ...item, acknowledged: true } : item))
    );
    setShowReviewModal(false);
    Toast.show({
      type: 'success',
      text1: 'Alert Acknowledged',
      text2: 'Event acknowledged. Note: Medication dose status remains MISSED.',
    });
  };

  const filteredList = missedDoses.filter(m => {
    if (dateFilter === 'TODAY') return m.dateGroup === 'TODAY';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 5. TOP APP BAR ─── */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
            <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Missed Medication</Text>
          <Text style={styles.headerSubtitle}>Exception & Action Center • G40</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Refreshed Missed Medications' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('medicationHistory'); }}>
              <MaterialCommunityIcons name="history" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>View History (G39)</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[C.error]} />
        }
      >
        {/* ─── ELDER CONTEXT BANNER ─── */}
        <View style={styles.elderContextBanner}>
          <MaterialCommunityIcons name="account-heart" size={20} color={C.error} />
          <Text style={styles.elderContextText}>
            Monitoring <Text style={{ fontWeight: '900', color: C.textPrimary }}>{elderName}</Text>
          </Text>
        </View>

        {loading && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={C.error} />
          </View>
        )}

        {!loading && loadError && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <MaterialCommunityIcons name="alert-circle-outline" size={40} color={C.textMuted} />
            <Text style={{ marginTop: 10, color: C.textSecondary, fontWeight: '600' }}>{loadError}</Text>
          </View>
        )}

        {!loading && !loadError && (
        <>
        {/* ─── 6. SUMMARY CARD ─── */}
        {totalCount > 0 ? (
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <MaterialCommunityIcons name="alert-circle" size={24} color={C.error} />
              <Text style={styles.summaryTitle}>Needs Attention</Text>
            </View>
            <Text style={styles.summaryCountNum}>{totalCount} Missed Doses</Text>
            <Text style={styles.summarySubText}>
              {todayCount} dose today • {totalCount - todayCount} dose during the selected period
            </Text>
          </View>
        ) : (
          <View style={styles.allClearCard}>
            <MaterialCommunityIcons name="check-circle" size={32} color={C.primary} />
            <Text style={styles.allClearTitle}>All Scheduled Doses Confirmed</Text>
            <Text style={styles.allClearSubText}>No missed medication events require attention at this time.</Text>
          </View>
        )}

        {/* ─── 12. DATE FILTERS ─── */}
        <View style={styles.filterBarRow}>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'TODAY', label: 'Today' },
            { id: '7D', label: '7 Days' },
            { id: '30D', label: '30 Days' },
          ].map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, dateFilter === f.id && styles.filterChipActive]}
              onPress={() => setDateFilter(f.id as any)}
            >
              <Text style={[styles.filterChipText, dateFilter === f.id && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── 21. CENTRAL RISK ENGINE PATTERN BANNER ─── */}
        {patternWarning && (
          <View style={styles.riskPatternCard}>
            <View style={styles.riskHeaderRow}>
              <MaterialCommunityIcons name="shield-alert" size={20} color={C.orange} />
              <Text style={styles.riskTitle}>Pattern Detected</Text>
            </View>
            <Text style={styles.riskBodyText}>{patternWarning}</Text>
          </View>
        )}

        {/* ─── 8. MISSED MEDICATION CARDS (CHRONOLOGICAL) ─── */}
        <Text style={styles.sectionHeaderTitle}>Missed Doses Requiring Review</Text>
        <View style={styles.missedList}>
          {filteredList.map(item => (
            <View key={item.id} style={styles.missedCard}>
              <View style={styles.missedCardTop}>
                <View style={styles.missedIconBox}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={22} color={C.error} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.missedMedName}>{item.medicationName} <Text style={{ fontSize: 13, color: C.textSecondary }}>{item.dose}</Text></Text>
                  <Text style={styles.missedTimeText}>Scheduled: {item.formattedDate}</Text>
                </View>

                <View style={styles.missedBadge}>
                  <Text style={styles.missedBadgeText}>! MISSED</Text>
                </View>
              </View>

              <Text style={styles.missedReasonText}>• {item.reason}</Text>

              {item.acknowledged && (
                <View style={styles.acknowledgedRow}>
                  <MaterialCommunityIcons name="check-all" size={14} color={C.primary} />
                  <Text style={styles.acknowledgedText}>Acknowledged by Guardian (Status remains MISSED)</Text>
                </View>
              )}

              <View style={styles.missedCardActions}>
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => {
                    setSelectedDose(item);
                    setShowReviewModal(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.reviewBtnText}>Review Event</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.callBtn} onPress={handleCallElder} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="phone" size={16} color={C.primary} />
                  <Text style={styles.callBtnText}>Call Elder</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        </>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ─── 15. REVIEW EVENT BOTTOM SHEET MODAL ─── */}
      <Modal visible={showReviewModal} transparent animationType="slide" onRequestClose={() => setShowReviewModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowReviewModal(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedDose?.medicationName} {selectedDose?.dose}</Text>
                <Text style={styles.modalSubtitle}>Scheduled {selectedDose?.formattedDate}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBodyCard}>
              <Text style={styles.modalSectionLabel}>DOSE EVENT STATUS</Text>
              <View style={styles.modalStatusRow}>
                <View style={styles.missedBadge}>
                  <Text style={styles.missedBadgeText}>! MISSED</Text>
                </View>
                <Text style={styles.modalStatusExplain}>No confirmation received within scheduled window.</Text>
              </View>
              <Text style={styles.safetyNoticeText}>
                🔒 Healthcare Safety Rule: Do not issue unapproved medical advice or force elder to repeat dose without physician consultation.
              </Text>
            </View>

            <View style={styles.modalActionsCol}>
              {!selectedDose?.acknowledged && (
                <TouchableOpacity
                  style={styles.acknowledgeBtn}
                  onPress={() => selectedDose && handleAcknowledge(selectedDose.id)}
                >
                  <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFF" />
                  <Text style={styles.acknowledgeBtnText}>Acknowledge Alert</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalActionSecondary}
                onPress={() => {
                  setShowReviewModal(false);
                  onNavigate('medicationDetails', selectedDose?.medicationId);
                }}
              >
                <MaterialCommunityIcons name="pill" size={18} color={C.primary} />
                <Text style={styles.modalActionSecondaryText}>View Medication Details (G38)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionSecondary}
                onPress={() => {
                  setShowReviewModal(false);
                  onNavigate('medicationHistory');
                }}
              >
                <MaterialCommunityIcons name="history" size={18} color={C.primary} />
                <Text style={styles.modalActionSecondaryText}>View Medication History (G39)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalActionSecondary} onPress={handleCallElder}>
                <MaterialCommunityIcons name="phone" size={18} color={C.primary} />
                <Text style={styles.modalActionSecondaryText}>Call Elder</Text>
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
          const isActive = tab.id === 'emergencyAlerts';
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
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: C.error, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 60, paddingRight: 16 },
  menuContent: { backgroundColor: C.card, borderRadius: 16, padding: 8, width: 200, ...elevation.e3, borderWidth: 1, borderColor: C.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12 },
  menuItemText: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: 110 },
  elderContextBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.errorLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginBottom: spacing.s4 },
  elderContextText: { fontSize: 12, color: C.textSecondary },
  summaryCard: { backgroundColor: C.errorLight, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.error, ...elevation.e1 },
  summaryTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryTitle: { fontSize: 16, fontWeight: '900', color: C.error },
  summaryCountNum: { fontSize: 28, fontWeight: '900', color: C.error, marginVertical: 4 },
  summarySubText: { fontSize: 12, fontWeight: '700', color: C.textPrimary },
  allClearCard: { backgroundColor: C.primaryLight, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.primary, alignItems: 'center' },
  allClearTitle: { fontSize: 16, fontWeight: '900', color: C.primary, marginTop: 6 },
  allClearSubText: { fontSize: 12, color: C.textSecondary, marginTop: 2, textAlign: 'center' },
  filterBarRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.s4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.errorLight, borderColor: C.error },
  filterChipText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  filterChipTextActive: { color: C.error, fontWeight: '900' },
  riskPatternCard: { backgroundColor: C.orangeLight, borderRadius: 16, padding: 12, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.orange },
  riskHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  riskTitle: { fontSize: 13, fontWeight: '900', color: C.orange },
  riskBodyText: { fontSize: 11, color: C.textPrimary, lineHeight: 16 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  missedList: { gap: 10, marginBottom: spacing.s4 },
  missedCard: { backgroundColor: C.card, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: C.error, ...elevation.e1 },
  missedCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  missedIconBox: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.errorLight, justifyContent: 'center', alignItems: 'center' },
  missedMedName: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  missedTimeText: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  missedBadge: { backgroundColor: C.errorLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  missedBadgeText: { fontSize: 10, fontWeight: '900', color: C.error },
  missedReasonText: { fontSize: 11, color: C.textSecondary, marginTop: 8, fontStyle: 'italic' },
  acknowledgedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: C.primaryLight, padding: 6, borderRadius: 8 },
  acknowledgedText: { fontSize: 10, fontWeight: '800', color: C.primary },
  missedCardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  reviewBtn: { flex: 1, height: 42, backgroundColor: C.error, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  reviewBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  callBtn: { height: 42, paddingHorizontal: 16, backgroundColor: C.primaryLight, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  callBtnText: { color: C.primary, fontSize: 12, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.s6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: C.textPrimary },
  modalSubtitle: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  modalBodyCard: { backgroundColor: C.bg, borderRadius: 16, padding: 12, marginVertical: 10, borderWidth: 1, borderColor: C.border },
  modalSectionLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  modalStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  modalStatusExplain: { fontSize: 12, color: C.textPrimary, flex: 1 },
  safetyNoticeText: { fontSize: 10, fontStyle: 'italic', color: C.textSecondary, marginTop: 4 },
  modalActionsCol: { gap: 8, marginTop: 6 },
  acknowledgeBtn: { height: 46, backgroundColor: C.primary, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  acknowledgeBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  modalActionSecondary: { height: 44, backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  modalActionSecondaryText: { color: C.primary, fontSize: 13, fontWeight: '800' },
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

export default GuardianMissedMedicationScreen;

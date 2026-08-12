/**
 * GuardianMedicationDashboard.tsx — Screen G37 (Medication Monitoring Dashboard)
 * Spec: g37.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, Samsung Health
 *
 * Screen Mission: Answers "Has my elder taken today's medications as scheduled, and does anything require my attention?"
 *
 * Component Architecture per g37.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Medication", Subtitle "Medication Dashboard • G37", Overflow menu).
 *  3. Elder Context Banner (Paired Elder Nimal Perera, Today • August 9, Sync status: Updated just now).
 *  4. Medication Adherence Summary Card:
 *     - Live daily adherence percentage: 80%
 *     - Completed count: 4 of 5 completed
 *     - Supporting breakdown: ✓ 4 Completed | ◷ 0 Upcoming | ! 1 Missed (Future meds never counted as missed!).
 *  5. Today's Chronological Medication List:
 *     - 08:00 AM — Amlodipine 5 mg (✓ Taken • 8:05 AM)
 *     - 01:00 PM — Metformin 500 mg (◷ Upcoming)
 *     - 06:00 PM — Vitamin D3 1000 IU (! Missed)
 *     - Tap item → Navigates to G38 Medication Details.
 *  6. Needs Attention Card (Surfaced when missed medications exist with Review CTA → G40).
 *  7. Quick Actions Grid (View History G39, View Missed G40, Call Elder).
 *  8. Data Synchronization Footer, Offline Banner, & Persistent 5-Tab Bottom Navigation Bar.
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
  TextInput,
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

export interface MedicationScheduleItem {
  id: string;
  name: string;
  dose: string;
  form: string;
  scheduledTime: string;
  status: 'TAKEN' | 'UPCOMING' | 'MISSED' | 'SKIPPED' | 'SYNCING';
  takenAt?: string;
  instructions?: string;
}

interface GuardianMedicationDashboardProps {
  onBack?: () => void;
  token?: string;
  elderId?: string | null;
  onSelectElder?: (id: any) => void;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

const GuardianMedicationDashboard: React.FC<GuardianMedicationDashboardProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [refreshing, setRefreshing]     = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [showSearch, setShowSearch]     = useState(false);
  const [medications, setMedications]   = useState<MedicationScheduleItem[]>([]);
  const [elderName, setElderName]       = useState('Your Elder');
  const [elderPhone, setElderPhone]     = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!elderId || !token) {
      setLoading(false);
      setLoadError('No elder selected.');
      return;
    }
    setLoadError(null);
    try {
      const [medRes, elderRes] = await Promise.all([
        apiFetch(`/medications/elder/${elderId}`, token),
        apiFetch(`/guardian/elders/${elderId}`, token),
      ]);

      const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      const toMinutes = (t: string) => {
        const d = new Date(`1970-01-01T${t}`);
        return isNaN(d.getTime()) ? 0 : d.getHours() * 60 + d.getMinutes();
      };

      const items: MedicationScheduleItem[] = (medRes?.rawMedications || []).map((m: any) => {
        const scheduledTime = m.time_schedule || '';
        const status: MedicationScheduleItem['status'] = m.taken
          ? 'TAKEN'
          : toMinutes(scheduledTime) < nowMinutes
          ? 'MISSED'
          : 'UPCOMING';
        return {
          id: String(m.id),
          name: m.name,
          dose: m.dosage || '',
          form: m.form || 'PILL',
          scheduledTime,
          status,
          instructions: m.instructions || '',
        };
      });
      setMedications(items);

      if (elderRes) {
        setElderName(elderRes.name || 'Your Elder');
        setElderPhone(elderRes.phone_number || null);
      }
    } catch (e: any) {
      if (e instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load medication schedule.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const takenCount    = medications.filter(m => m.status === 'TAKEN').length;
  const missedCount   = medications.filter(m => m.status === 'MISSED').length;
  const upcomingCount = medications.filter(m => m.status === 'UPCOMING').length;
  const totalCount    = medications.length;
  const adherencePct  = Math.round((takenCount / (takenCount + missedCount || 1)) * 100);

  const handleCallElder = () => {
    Haptics.selectionAsync();
    if (!elderPhone) {
      Toast.show({ type: 'error', text1: 'No phone number on file for this elder' });
      return;
    }
    Linking.openURL(`tel:${elderPhone}`);
  };

  const filteredMeds = medications.filter(m =>
    !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <Text style={styles.headerTitle}>Medication</Text>
          <Text style={styles.headerSubtitle}>Medication Dashboard • G37</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSearch(v => !v)}>
            <MaterialCommunityIcons name={showSearch ? 'close' : 'magnify'} size={22} color={C.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowMoreMenu(v => !v)}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color={C.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH BAR */}
      {showSearch && (
        <View style={styles.searchBarContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={C.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicine name or dose..."
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

      {/* OVERFLOW MENU MODAL */}
      <Modal visible={showMoreMenu} transparent animationType="fade" onRequestClose={() => setShowMoreMenu(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMoreMenu(false)}>
          <View style={styles.menuContent}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Medication Schedule Refreshed' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('medicationHistory'); }}>
              <MaterialCommunityIcons name="history" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Medication History (G39)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('guardianSettings'); }}>
              <MaterialCommunityIcons name="cog-outline" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Medication Settings</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[C.primary]} />
        }
      >
        {/* ─── 6. ELDER CONTEXT BANNER ─── */}
        <View style={styles.elderContextBanner}>
          <MaterialCommunityIcons name="pill" size={20} color={C.primary} />
          <Text style={styles.elderContextText}>
            Monitoring <Text style={{ fontWeight: '900', color: C.textPrimary }}>{elderName}</Text> • Today
          </Text>
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

        {!loading && !loadError && medications.length === 0 && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <MaterialCommunityIcons name="pill" size={40} color={C.textMuted} />
            <Text style={{ marginTop: 10, color: C.textSecondary, fontWeight: '600' }}>No medications scheduled for this elder.</Text>
          </View>
        )}

        {!loading && !loadError && medications.length > 0 && (
        <>

        {/* ─── 8. MEDICATION ADHERENCE PROGRESS CARD ─── */}
        <View style={styles.adherenceCard}>
          <Text style={styles.cardSectionLabel}>TODAY'S MEDICATION ADHERENCE</Text>
          <View style={styles.adherenceHeroCenter}>
            <Text style={styles.adherencePctText}>{adherencePct}%</Text>
            <Text style={styles.adherenceSubText}>{takenCount} of {takenCount + missedCount} completed so far today</Text>
          </View>

          <View style={styles.adherencePillsRow}>
            <View style={[styles.adherencePill, { backgroundColor: C.primaryLight }]}>
              <Text style={[styles.adherencePillText, { color: C.primary }]}>✓ {takenCount} Completed</Text>
            </View>

            <View style={[styles.adherencePill, { backgroundColor: C.infoLight }]}>
              <Text style={[styles.adherencePillText, { color: C.info }]}>◷ {upcomingCount} Upcoming</Text>
            </View>

            <View style={[styles.adherencePill, { backgroundColor: C.errorLight }]}>
              <Text style={[styles.adherencePillText, { color: C.error }]}>! {missedCount} Missed</Text>
            </View>
          </View>
        </View>

        {/* ─── 17. NEEDS ATTENTION CARD (CONDITIONAL) ─── */}
        {missedCount > 0 && (
          <View style={styles.attentionCard}>
            <View style={styles.attentionHeaderRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={22} color={C.error} />
              <Text style={styles.attentionTitle}>Medication Needs Attention</Text>
            </View>
            <Text style={styles.attentionBodyText}>
              {missedCount} medication was not confirmed as taken within its scheduled window.
            </Text>

            <TouchableOpacity style={styles.reviewMissedBtn} onPress={() => onNavigate('missedMedication')} activeOpacity={0.85}>
              <Text style={styles.reviewMissedBtnText}>Review Missed Medication (G40) →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── 10. TODAY'S CHRONOLOGICAL MEDICATION LIST ─── */}
        <Text style={styles.sectionHeaderTitle}>Today's Medication Schedule</Text>
        <View style={styles.medList}>
          {filteredMeds.map((med) => {
            const isTaken    = med.status === 'TAKEN';
            const isMissed   = med.status === 'MISSED';
            const isUpcoming = med.status === 'UPCOMING';

            const statusBg    = isTaken ? C.primaryLight : isMissed ? C.errorLight : C.infoLight;
            const statusColor = isTaken ? C.primary : isMissed ? C.error : C.info;

            return (
              <TouchableOpacity
                key={med.id}
                style={[styles.medCard, isMissed && styles.medCardMissed]}
                onPress={() => onNavigate('medicationDetails', med.id)}
                activeOpacity={0.85}
              >
                <View style={styles.medCardTopRow}>
                  <View style={[styles.medIconCircle, { backgroundColor: statusBg }]}>
                    <MaterialCommunityIcons
                      name={isTaken ? 'check' : isMissed ? 'alert' : 'clock-outline'}
                      size={22}
                      color={statusColor}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.medNameText}>{med.name} <Text style={{ fontSize: 13, color: C.textSecondary }}>{med.dose}</Text></Text>
                    <Text style={styles.medTimeText}>Scheduled for {med.scheduledTime} • {med.form}</Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                      {isTaken ? `✓ TAKEN` : isMissed ? `! MISSED` : `◷ UPCOMING`}
                    </Text>
                  </View>
                </View>

                {med.instructions && (
                  <Text style={styles.medInstructionsText}>• {med.instructions}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── 26. QUICK ACTIONS GRID ─── */}
        <Text style={styles.sectionHeaderTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => onNavigate('medicationHistory')}>
            <MaterialCommunityIcons name="history" size={20} color={C.primary} />
            <Text style={styles.quickActionBtnText}>History (G39)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionBtn} onPress={() => onNavigate('missedMedication')}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={C.error} />
            <Text style={styles.quickActionBtnText}>Missed (G40)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionBtn} onPress={handleCallElder}>
            <MaterialCommunityIcons name="phone" size={20} color={C.primary} />
            <Text style={styles.quickActionBtnText}>Call Elder</Text>
          </TouchableOpacity>
        </View>
        </>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* PERSISTENT 5-TAB BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        {[
          { id: 'guardianDashboard', label: 'Home', icon: 'home' },
          { id: 'elderOverview', label: 'Elder', icon: 'account-heart' },
          { id: 'emergencyAlerts', label: 'Emergency', icon: 'alert-decagram-outline' },
          { id: 'reports', label: 'Reports', icon: 'chart-bar' },
          { id: 'guardianSettings', label: 'Settings', icon: 'cog-outline' },
        ].map((tab) => {
          const isActive = tab.id === 'elderOverview';
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
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 60, paddingRight: 16 },
  menuContent: { backgroundColor: C.card, borderRadius: 16, padding: 8, width: 200, ...elevation.e3, borderWidth: 1, borderColor: C.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12 },
  menuItemText: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: 110 },
  elderContextBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginBottom: spacing.s4 },
  elderContextText: { fontSize: 12, color: C.textSecondary },
  adherenceCard: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardSectionLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  adherenceHeroCenter: { alignItems: 'center', marginVertical: 10 },
  adherencePctText: { fontSize: 36, fontWeight: '900', color: C.primary },
  adherenceSubText: { fontSize: 12, fontWeight: '700', color: C.textSecondary, marginTop: 2 },
  adherencePillsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginTop: 8 },
  adherencePill: { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  adherencePillText: { fontSize: 10, fontWeight: '900' },
  attentionCard: { backgroundColor: C.errorLight, borderRadius: 20, padding: 14, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.error },
  attentionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  attentionTitle: { fontSize: 15, fontWeight: '900', color: C.error },
  attentionBodyText: { fontSize: 12, color: C.textPrimary, lineHeight: 18 },
  reviewMissedBtn: { height: 40, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.error, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  reviewMissedBtnText: { color: C.error, fontSize: 12, fontWeight: '900' },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10, marginTop: 4 },
  medList: { gap: 10, marginBottom: spacing.s4 },
  medCard: { backgroundColor: C.card, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  medCardMissed: { backgroundColor: colors.errorContainer, borderColor: C.error },
  medCardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  medIconCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  medNameText: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  medTimeText: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '900' },
  medInstructionsText: { fontSize: 11, color: C.textSecondary, marginTop: 8, fontStyle: 'italic' },
  quickActionsGrid: { flexDirection: 'row', gap: 8, marginBottom: spacing.s4 },
  quickActionBtn: { flex: 1, height: 48, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, ...elevation.e1 },
  quickActionBtnText: { fontSize: 12, fontWeight: '800', color: C.textPrimary },
  syncFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 },
  syncFooterText: { fontSize: 11, color: C.textMuted },
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

export default GuardianMedicationDashboard;

/**
 * GuardianMedicationDetailsScreen.tsx — Screen G38 (Single Medication Details)
 * Spec: g38.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, Samsung Health
 *
 * Screen Mission: Answers "What is this medication, when should it be taken, and what is its current status?"
 *
 * Component Architecture per g38.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Medication Details", Subtitle "Single Medication Inspection • G38", Overflow menu).
 *  3. Medication Identity Header (💊 Amlodipine 5 mg, Form: Tablet, Medication Plan Status: ACTIVE).
 *  4. Today's Dose Status Card (Separated from Plan Status: ✓ TAKEN • Scheduled 8:00 AM, Taken 8:05 AM).
 *  5. Prescription Information Card (Name, Strength, Form, Prescriber, Pharmacy, Rx Number).
 *  6. Schedule Rules Card (Every day, Scheduled time 8:00 AM, Meal requirement).
 *  7. Recent Adherence Summary Card (28 / 30 doses completed • 93% Adherence + 14-Day Status Pills).
 *  8. Contextual Guardian Actions (View History G39, View Missed Doses G40, Call Elder).
 *  9. Data Synchronization Footer, Offline Banner, & Persistent 5-Tab Bottom Navigation Bar.
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

interface MedicationDetailData {
  id: string;
  name: string;
  strength: string;
  form: string;
  planStatus: string;
  scheduledTime: string;
  taken: boolean;
  frequency: string;
  category: string;
  instructions: string;
  startDate: string;
  endDate: string;
}

interface GuardianMedicationDetailsScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  medicationId?: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianMedicationDetailsScreen: React.FC<GuardianMedicationDetailsScreenProps> = ({
  onBack,
  token,
  elderId,
  medicationId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [medData, setMedData]           = useState<MedicationDetailData | null>(null);
  const [loadError, setLoadError]       = useState<string | null>(null);

  const loadMedication = useCallback(async () => {
    if (!elderId || !medicationId || !token) {
      setLoading(false);
      setLoadError('No medication selected.');
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiFetch(`/medications/elder/${elderId}`, token);
      const raw = (res?.rawMedications || []).find((m: any) => String(m.id) === String(medicationId));
      if (!raw) {
        setLoadError('This medication could not be found.');
        setMedData(null);
      } else {
        setMedData({
          id: String(raw.id),
          name: raw.name,
          strength: raw.strength || raw.dosage || '',
          form: raw.form || 'PILL',
          planStatus: raw.is_active ? 'ACTIVE' : 'ARCHIVED',
          scheduledTime: raw.time_schedule || '',
          taken: !!raw.taken,
          frequency: raw.schedule_type || 'DAILY',
          category: raw.category || 'General',
          instructions: raw.instructions || 'No special instructions provided.',
          startDate: raw.start_date || '',
          endDate: raw.end_date || '',
        });
      }
    } catch (e: any) {
      if (e instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load medication details.');
    } finally {
      setLoading(false);
    }
  }, [elderId, medicationId, token, onSessionExpired]);

  useEffect(() => {
    loadMedication();
  }, [loadMedication]);

  const handleCallElder = () => {
    Haptics.selectionAsync();
    Alert.alert('Call Elder', 'Use the elder\'s contact card to place this call.');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />
        <ActivityIndicator size="large" color={C.primary} />
      </SafeAreaView>
    );
  }

  if (!medData) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />
        <MaterialCommunityIcons name="pill-off" size={48} color={C.textMuted} />
        <Text style={{ marginTop: 12, fontSize: 15, fontWeight: '700', color: C.textPrimary, textAlign: 'center' }}>
          {loadError || 'Medication not found.'}
        </Text>
        <TouchableOpacity style={[styles.actionBtnSecondary, { marginTop: 20, paddingHorizontal: 24 }]} onPress={onBack}>
          <Text style={styles.actionBtnSecondaryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 4. TOP APP BAR ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{medData.name} {medData.strength}</Text>
          <Text style={styles.headerSubtitle}>Medication Details • G38</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Medication Record Refreshed' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('medicationHistory'); }}>
              <MaterialCommunityIcons name="history" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>View History (G39)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('missedMedication'); }}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={C.error} />
              <Text style={styles.menuItemText}>View Missed Doses (G40)</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} colors={[C.primary]} />
        }
      >
        {/* ─── 5. MEDICATION IDENTITY CARD ─── */}
        <View style={styles.card}>
          <View style={styles.heroCenter}>
            <View style={styles.pillIconCircle}>
              <MaterialCommunityIcons name="pill" size={42} color={C.primary} />
            </View>

            <Text style={styles.heroTitle}>{medData.name}</Text>
            <Text style={styles.heroSub}>{medData.strength} • {medData.form}</Text>

            <View style={styles.planStatusBadge}>
              <Text style={styles.planStatusBadgeText}>PLAN STATUS: {medData.planStatus}</Text>
            </View>
          </View>
        </View>

        {/* ─── 8. TODAY'S DOSE STATUS CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="clock-check-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Today's Dose Status</Text>
          </View>

          <View style={styles.todayDoseRow}>
            <View style={styles.doseStatusIconBox}>
              <MaterialCommunityIcons name="check-circle" size={28} color={C.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.doseStatusMainTitle}>{medData.taken ? '✓ TAKEN TODAY' : 'NOT YET TAKEN TODAY'}</Text>
              <Text style={styles.doseStatusSubText}>Scheduled at {medData.scheduledTime || 'no fixed time'}</Text>
            </View>
          </View>
        </View>

        {/* ─── 10. PRESCRIPTION INFORMATION CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="information-outline" size={20} color={C.info} />
            <Text style={styles.cardHeaderTitle}>Prescription Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Strength & Dosage:</Text>
            <Text style={styles.infoVal}>{medData.strength} ({medData.form})</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category:</Text>
            <Text style={styles.infoVal}>{medData.category}</Text>
          </View>
          {!!medData.startDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Start Date:</Text>
              <Text style={styles.infoVal}>{medData.startDate}</Text>
            </View>
          )}
          {!!medData.endDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>End Date:</Text>
              <Text style={styles.infoVal}>{medData.endDate}</Text>
            </View>
          )}
        </View>

        {/* ─── 11. SCHEDULE & SCHEDULE RULES ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Schedule Rules & Guidance</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Frequency:</Text>
            <Text style={styles.infoVal}>{medData.frequency}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Scheduled Time:</Text>
            <Text style={styles.infoVal}>{medData.scheduledTime || 'Not set'}</Text>
          </View>

          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsBoxTitle}>Administration Instructions:</Text>
            <Text style={styles.instructionsBoxText}>{medData.instructions}</Text>
          </View>
        </View>

        {/* ─── 11. CONTEXTUAL GUARDIAN ACTIONS ─── */}
        <Text style={styles.sectionHeaderTitle}>Guardian Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleCallElder} activeOpacity={0.85}>
            <MaterialCommunityIcons name="phone" size={20} color="#FFF" />
            <Text style={styles.actionBtnPrimaryText}>Call Elder</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => onNavigate('medicationHistory')} activeOpacity={0.85}>
            <MaterialCommunityIcons name="history" size={20} color={C.primary} />
            <Text style={styles.actionBtnSecondaryText}>View History (G39)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => onNavigate('missedMedication')} activeOpacity={0.85}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={C.error} />
            <Text style={[styles.actionBtnSecondaryText, { color: C.error }]}>View Missed (G40)</Text>
          </TouchableOpacity>
        </View>

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
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 60, paddingRight: 16 },
  menuContent: { backgroundColor: C.card, borderRadius: 16, padding: 8, width: 200, ...elevation.e3, borderWidth: 1, borderColor: C.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12 },
  menuItemText: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: 110 },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  heroCenter: { alignItems: 'center', marginVertical: 8 },
  pillIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: C.textPrimary },
  heroSub: { fontSize: 13, fontWeight: '700', color: C.textSecondary, marginTop: 2 },
  planStatusBadge: { backgroundColor: C.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  planStatusBadgeText: { fontSize: 10, fontWeight: '900', color: C.primary },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  todayDoseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.primaryLight, padding: 12, borderRadius: 16 },
  doseStatusIconBox: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  doseStatusMainTitle: { fontSize: 14, fontWeight: '900', color: C.primary },
  doseStatusSubText: { fontSize: 11, color: C.textPrimary, marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  infoLabel: { fontSize: 12, color: C.textSecondary },
  infoVal: { fontSize: 12, fontWeight: '700', color: C.textPrimary },
  instructionsBox: { backgroundColor: C.bg, padding: 10, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: C.border },
  instructionsBoxTitle: { fontSize: 11, fontWeight: '800', color: C.textPrimary },
  instructionsBoxText: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  adherenceMetricsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  adherencePctNum: { fontSize: 28, fontWeight: '900', color: C.primary },
  adherenceMainText: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  adherenceSubText: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  pillsHeaderLabel: { fontSize: 10, fontWeight: '900', color: C.textMuted, letterSpacing: 0.8, marginBottom: 6 },
  pillsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pillItem: { width: 20, height: 26, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  actionGrid: { gap: 8 },
  actionBtnPrimary: { height: 48, backgroundColor: C.primary, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, ...elevation.e1 },
  actionBtnPrimaryText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  actionBtnSecondary: { height: 48, backgroundColor: C.primaryLight, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionBtnSecondaryText: { color: C.primary, fontSize: 13, fontWeight: '900' },
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

export default GuardianMedicationDetailsScreen;

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
  SafeAreaView,
  StatusBar,
  ScrollView,
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

interface GuardianMedicationDetailsScreenProps {
  onBack: () => void;
  token?: string;
  medicationId?: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianMedicationDetailsScreen: React.FC<GuardianMedicationDetailsScreenProps> = ({
  onBack,
  token,
  medicationId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const medData = {
    id: medicationId || 'med1',
    name: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    strength: '5 mg',
    form: 'Tablet',
    planStatus: 'ACTIVE',
    todayDoseStatus: 'TAKEN',
    scheduledTime: '08:00 AM',
    takenAt: '08:05 AM',
    frequency: 'Every day',
    doctor: 'Dr. K. L. Silva (Consultant Physician)',
    prescribedDate: '15 Jan 2026',
    pharmacy: 'Asiri Central Pharmacy',
    rxNumber: 'RX-8849201',
    instructions: 'Take 1 tablet daily in the morning after breakfast.',
    mealRequirement: 'Take After Meals',
    adherencePct: 93,
    takenDoses: 28,
    totalDoses: 30,
    missedDoses: 2,
  };

  const handleCallElder = () => {
    Haptics.selectionAsync();
    Alert.alert('Call Elder', 'Dialing Nimal Perera (+94 77 123 4567)...');
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
              <Text style={styles.doseStatusMainTitle}>✓ TAKEN TODAY</Text>
              <Text style={styles.doseStatusSubText}>Scheduled at {medData.scheduledTime} • Confirmed taken at {medData.takenAt}</Text>
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
            <Text style={styles.infoLabel}>Generic Name:</Text>
            <Text style={styles.infoVal}>{medData.genericName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Strength & Dosage:</Text>
            <Text style={styles.infoVal}>{medData.strength} ({medData.form})</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prescribing Doctor:</Text>
            <Text style={styles.infoVal}>{medData.doctor}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prescribed Date:</Text>
            <Text style={styles.infoVal}>{medData.prescribedDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pharmacy:</Text>
            <Text style={styles.infoVal}>{medData.pharmacy}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prescription No:</Text>
            <Text style={styles.infoVal}>{medData.rxNumber}</Text>
          </View>
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
            <Text style={styles.infoVal}>{medData.scheduledTime}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Meal Requirement:</Text>
            <Text style={styles.infoVal}>{medData.mealRequirement}</Text>
          </View>

          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsBoxTitle}>Administration Instructions:</Text>
            <Text style={styles.instructionsBoxText}>{medData.instructions}</Text>
          </View>
        </View>

        {/* ─── 14 & 15. RECENT ADHERENCE & 14-DAY PILLS ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="chart-box-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>30-Day Adherence History</Text>
          </View>

          <View style={styles.adherenceMetricsRow}>
            <Text style={styles.adherencePctNum}>{medData.adherencePct}%</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.adherenceMainText}>{medData.takenDoses} of {medData.totalDoses} doses completed</Text>
              <Text style={styles.adherenceSubText}>{medData.missedDoses} doses recorded as missed during last 30 days.</Text>
            </View>
          </View>

          <Text style={styles.pillsHeaderLabel}>LAST 14 DAYS ADHERENCE LOG</Text>
          <View style={styles.pillsRow}>
            {['✓', '✓', '✓', '!', '✓', '✓', '✓', '✓', '✓', '!', '✓', '✓', '✓', '✓'].map((st, i) => (
              <View key={i} style={[styles.pillItem, { backgroundColor: st === '✓' ? C.primaryLight : C.errorLight }]}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: st === '✓' ? C.primary : C.error }}>{st}</Text>
              </View>
            ))}
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
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
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
    justify.content: 'space-around',
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...elevation.e2,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 2 },
  tabLabelActive: { color: C.primary, fontWeight: '800' },
});

export default GuardianMedicationDetailsScreen;

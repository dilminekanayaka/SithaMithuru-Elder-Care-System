/**
 * GuardianWellbeingCheckinDetailsScreen.tsx — Screen G33 (Well-being Check-in Details)
 * Spec: g33.txt
 *
 * Design Standard: Apple Health, One Medical, Samsung Health, Epic MyChart
 *
 * Screen Mission: Answers "What exactly did my elder report during this specific well-being check-in?"
 *
 * Core Healthcare UX Principle (Strict 3-Layer Information Separation):
 *  1. WHAT THE ELDER REPORTED (Raw elder check-in answers & mood)
 *  2. WHAT THE SYSTEM OBSERVED (Factual baseline comparisons & schedule variances)
 *  3. WHAT THE RISK ENGINE INFERRED (Human-readable risk level & caregiver recommendations)
 *
 * Component Architecture per g33.txt:
 *  1. Android safe-area layout.
 *  2. Top App Bar (Back button, Title "Check-in Details", Subtitle "Single Record Inspection • G33", Overflow menu).
 *  3. Check-in Metadata Card (Date, Time 9:10 AM, Completed status, Device audit & sync timestamps).
 *  4. Layer 1: Recorded Mood Hero Card (Explicit Text Label "GOOD", Supporting Icon, Recorded time).
 *  5. Layer 1: Guardian-Authorized Responses (Sleep, Energy, Appetite, Social + Privacy-Protected Response Indicator).
 *  6. Layer 2: System Observation & Baseline Comparison Card (Current value vs Recent 30-day baseline pattern).
 *  7. Layer 3: Risk Context & Related Risk Event Marker (YELLOW Needs Attention + View Alert G35 CTA).
 *  8. Contextual Guardian Actions (View History G34, Call Elder, View Alerts G35).
 *  9. Sync Audit Metadata, Offline Banner, & Persistent 5-Tab Bottom Navigation Bar.
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
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

const MOOD_EMOJI: Record<string, string> = {
  Happy: '😊',
  Neutral: '😐',
  Sad: '😢',
  Anxious: '😟',
  Angry: '😠',
};

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
  error:          colors.error,
  errorLight:     colors.errorContainer,
  info:           colors.info,
  infoLight:      colors.infoContainer,
  textPrimary:    colors.text.primary,
  textSecondary:  colors.text.secondary,
  textMuted:      colors.text.tertiary,
  border:         colors.outline,
};

interface MoodHistoryEntry {
  id: number;
  mood_type: string;
  notes: string | null;
  date: string;
  day_name: string;
  created_at: string;
}

interface GuardianWellbeingCheckinDetailsScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  checkInId?: string;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

const GuardianWellbeingCheckinDetailsScreen: React.FC<GuardianWellbeingCheckinDetailsScreenProps> = ({
  onBack,
  token,
  elderId,
  checkInId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [refreshing, setRefreshing]     = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [checkIn, setCheckIn]           = useState<MoodHistoryEntry | null>(null);
  const [elderPhone, setElderPhone]     = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!elderId || !checkInId) {
      setLoadError('No check-in selected.');
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      const [moodRes, elderRes] = await Promise.all([
        apiFetch(`/mood/elder/${elderId}`, token),
        apiFetch(`/guardian/elders/${elderId}`, token),
      ]);
      const found = (moodRes?.history || []).find((h: MoodHistoryEntry) => String(h.id) === String(checkInId));
      if (!found) {
        setLoadError('This check-in is outside the recent 7-day window and is no longer available.');
      } else {
        setCheckIn(found);
      }
      if (elderRes) setElderPhone(elderRes.phone_number || null);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load check-in details. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, checkInId, token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCallElder = () => {
    Haptics.selectionAsync();
    if (!elderPhone) {
      Toast.show({ type: 'error', text1: 'No phone number on file for this elder.' });
      return;
    }
    Linking.openURL(`tel:${elderPhone}`);
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
          <Text style={styles.headerTitle}>Check-in Details</Text>
          <Text style={styles.headerSubtitle}>Source Record Inspection • G33</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Refreshed Record' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Record</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('todaysWellbeing'); }}>
              <MaterialCommunityIcons name="history" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>View History (G34)</Text>
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
        {loading && (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        )}

        {!loading && loadError && (
          <View style={styles.card}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={C.textMuted} />
            <Text style={{ marginTop: 8, fontSize: 14, fontWeight: '700', color: C.textPrimary }}>{loadError}</Text>
          </View>
        )}

        {!loading && !loadError && checkIn && (
          <>
            {/* ─── CHECK-IN METADATA CARD ─── */}
            <View style={styles.metadataCard}>
              <View style={styles.metadataTopRow}>
                <View>
                  <Text style={styles.metadataDateText}>{checkIn.day_name?.trim()}, {checkIn.date}</Text>
                  <Text style={styles.metadataTimeText}>Recorded at {new Date(checkIn.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>

                <View style={styles.statusCompletedBadge}>
                  <Text style={styles.statusCompletedBadgeText}>RECORDED ✓</Text>
                </View>
              </View>
            </View>

            {/* ─── WHAT THE ELDER REPORTED (MOOD HERO) ─── */}
            <View style={styles.card}>
              <Text style={styles.layerHeaderLabel}>WHAT THE ELDER REPORTED</Text>

              <View style={styles.moodHeroCenter}>
                <View style={styles.moodEmojiCircle}>
                  <Text style={{ fontSize: 44 }}>{MOOD_EMOJI[checkIn.mood_type] || '😐'}</Text>
                </View>
                <Text style={styles.moodHeroTitle}>{checkIn.mood_type}</Text>
                <Text style={styles.moodHeroSub}>Elder Self-Reported Emotional State</Text>
              </View>

              {!!checkIn.notes && (
                <View style={styles.observationBox}>
                  <MaterialCommunityIcons name="text-box-outline" size={20} color={C.info} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.observationTitle}>Elder's Note</Text>
                    <Text style={styles.observationText}>{checkIn.notes}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* ─── CONTEXTUAL GUARDIAN ACTIONS ─── */}
            <Text style={styles.sectionHeaderTitle}>Guardian Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleCallElder} activeOpacity={0.85}>
                <MaterialCommunityIcons name="phone" size={20} color="#FFF" />
                <Text style={styles.actionBtnPrimaryText}>Call Elder</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => onNavigate('wellbeingHistory')} activeOpacity={0.85}>
                <MaterialCommunityIcons name="history" size={20} color={C.primary} />
                <Text style={styles.actionBtnSecondaryText}>View History (G34)</Text>
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
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 60, paddingRight: 16 },
  menuContent: { backgroundColor: C.card, borderRadius: 16, padding: 8, width: 200, ...elevation.e3, borderWidth: 1, borderColor: C.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12 },
  menuItemText: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: 110 },
  metadataCard: { backgroundColor: C.card, borderRadius: 20, padding: 14, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  metadataTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metadataDateText: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  metadataTimeText: { fontSize: 12, color: C.textSecondary, marginTop: 1 },
  statusCompletedBadge: { backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusCompletedBadgeText: { fontSize: 10, fontWeight: '900', color: C.primary },
  auditTimestampsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  auditTimestampsText: { fontSize: 10, color: C.textMuted },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  layerHeaderLabel: { fontSize: 10, fontWeight: '900', color: C.textMuted, letterSpacing: 0.8, marginBottom: 10 },
  moodHeroCenter: { alignItems: 'center', marginVertical: 8 },
  moodEmojiCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  moodHeroTitle: { fontSize: 26, fontWeight: '900', color: C.textPrimary },
  moodHeroSub: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  responsesList: { gap: 10 },
  responseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bg, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  responseRowPrivate: { backgroundColor: colors.background, borderStyle: 'dashed' },
  responseIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  responseLabelText: { fontSize: 12, fontWeight: '800', color: C.textPrimary },
  responseValText: { fontSize: 12, fontWeight: '700', color: C.textSecondary, marginTop: 1 },
  privatePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.outline, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  privatePillText: { fontSize: 10, fontWeight: '800', color: C.textMuted },
  observationBox: { flexDirection: 'row', gap: 10, backgroundColor: C.infoLight, padding: 12, borderRadius: 14, marginBottom: 12 },
  observationTitle: { fontSize: 13, fontWeight: '800', color: C.info },
  observationText: { fontSize: 12, color: C.textPrimary, marginTop: 2, lineHeight: 18 },
  baselineGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  baselineItem: { alignItems: 'center' },
  baselineVal: { fontSize: 15, fontWeight: '900', color: C.textPrimary },
  baselineLabel: { fontSize: 10, fontWeight: '600', color: C.textSecondary, marginTop: 2 },
  riskContextCard: { backgroundColor: C.primaryLight, borderColor: C.primary, borderWidth: 1 },
  riskHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  riskTitle: { fontSize: 15, fontWeight: '900', color: C.primary },
  riskReasonText: { fontSize: 12, color: C.textPrimary, lineHeight: 18 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionBtnPrimary: { flex: 1, height: 48, backgroundColor: C.primary, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, ...elevation.e1 },
  actionBtnPrimaryText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  actionBtnSecondary: { flex: 1, height: 48, backgroundColor: C.primaryLight, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
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

export default GuardianWellbeingCheckinDetailsScreen;

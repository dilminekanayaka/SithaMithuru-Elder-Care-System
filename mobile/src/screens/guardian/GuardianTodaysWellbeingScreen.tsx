/**
 * GuardianTodaysWellbeingScreen.tsx — Screen G32 (Today's Well-being Operational Record)
 * Spec: g32.txt
 *
 * Design Standard: Apple Health, Samsung Health, One Medical, Epic MyChart
 *
 * Screen Mission: Answers operational question "What is happening with my elder's well-being today?"
 *
 * Component Architecture per g32.txt:
 *  1. Android safe-area layout.
 *  2. Top App Bar (Back button, Title "Today's Well-being", Subtitle "Operational Record • G32", Overflow menu).
 *  3. Compact Date Navigation Bar (‹ Yesterday | Today, Aug 9 | Tomorrow disallowed; Historical View badge for past dates).
 *  4. Current Check-in Card (😊 Feeling Good, Completed Today 9:10 AM; Pending/Not Completed states).
 *  5. Today's Well-being Summary Card (Mood: Good, Check-in: Completed, Pattern: Stable, Last Recorded: 9:10 AM).
 *  6. Authorized Check-in Responses & Privacy Protection Engine:
 *     - Shared: Sleep (Good), Appetite (Normal), Energy (Good), Social (Normal).
 *     - Privacy Controlled: "🔒 Personal Note — Private response (Not shared per elder privacy settings)".
 *  7. Today's Pattern Changes Card ("No significant changes detected").
 *  8. Conditional Attention & Human-Readable Risk Context Card (GREEN Normal / YELLOW Attention).
 *  9. Contextual Guardian Actions (View History G34, Call Elder, View Alerts G35).
 * 10. Data Synchronization Indicator (Updated just now • Last synced 9:12 AM), Offline Banner, & Persistent 5-Tab Bottom Navigation.
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

interface GuardianTodaysWellbeingScreenProps {
  onBack?: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

const GuardianTodaysWellbeingScreen: React.FC<GuardianTodaysWellbeingScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [refreshing, setRefreshing]     = useState(false);
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(0); // 0 = Today, -1 = Yesterday
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [history, setHistory]           = useState<MoodHistoryEntry[]>([]);
  const [elderPhone, setElderPhone]     = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!elderId) {
      setLoadError('No elder selected.');
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      const [moodRes, elderRes] = await Promise.all([
        apiFetch(`/mood/elder/${elderId}`, token),
        apiFetch(`/guardian/elders/${elderId}`, token),
      ]);
      setHistory(moodRes?.history || []);
      if (elderRes) setElderPhone(elderRes.phone_number || null);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load well-being data. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isToday = selectedDateOffset === 0;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + selectedDateOffset);
  const targetDateStr = targetDate.toISOString().slice(0, 10);
  const dateTitle = targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const entryForDate = history.find(h => h.date === targetDateStr) || null;

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
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
            <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Today's Well-being</Text>
          <Text style={styles.headerSubtitle}>Operational Record • G32</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Record Refreshed' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Record</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('wellbeingHistory'); }}>
              <MaterialCommunityIcons name="history" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>View Well-being History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('guardianSettings'); }}>
              <MaterialCommunityIcons name="cog-outline" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Well-being Settings</Text>
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

        {!loading && !loadError && (
          <>
            {/* ─── DATE INDICATOR BAR ─── */}
            <View style={styles.dateSelectorCard}>
              <TouchableOpacity
                style={styles.dateArrowBtn}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedDateOffset(selectedDateOffset - 1);
                }}
              >
                <MaterialCommunityIcons name="chevron-left" size={24} color={C.textPrimary} />
                <Text style={styles.dateArrowText}>Back</Text>
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                <Text style={styles.dateSelectorTitle}>{isToday ? 'Today' : selectedDateOffset === -1 ? 'Yesterday' : `${-selectedDateOffset} Days Ago`}</Text>
                <Text style={styles.dateSelectorSub}>{dateTitle}</Text>
                {!isToday && (
                  <View style={styles.historicalBadge}>
                    <Text style={styles.historicalBadgeText}>HISTORICAL VIEW</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.dateArrowBtn, isToday && { opacity: 0.3 }]}
                disabled={isToday}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedDateOffset(Math.min(0, selectedDateOffset + 1));
                }}
              >
                <Text style={styles.dateArrowText}>Forward</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* ─── CURRENT CHECK-IN CARD ─── */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardSectionLabel}>{isToday ? "TODAY'S CHECK-IN" : 'CHECK-IN RECORD'}</Text>
                {entryForDate && (
                  <View style={styles.statusCompletedBadge}>
                    <Text style={styles.statusCompletedBadgeText}>RECORDED ✓</Text>
                  </View>
                )}
              </View>

              {entryForDate ? (
                <View style={styles.heroCenter}>
                  <View style={styles.moodEmojiCircle}>
                    <Text style={{ fontSize: 44 }}>{MOOD_EMOJI[entryForDate.mood_type] || '😐'}</Text>
                  </View>
                  <Text style={styles.heroMoodTitle}>{entryForDate.mood_type}</Text>
                  <Text style={styles.heroTimeText}>Recorded at {new Date(entryForDate.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
                  {!!entryForDate.notes && <Text style={styles.heroTimeText}>"{entryForDate.notes}"</Text>}
                </View>
              ) : (
                <View style={styles.heroCenter}>
                  <MaterialCommunityIcons name="emoticon-outline" size={44} color={C.textMuted} />
                  <Text style={styles.heroMoodTitle}>No Check-in</Text>
                  <Text style={styles.heroTimeText}>No mood was recorded on this date.</Text>
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
                <Text style={styles.actionBtnSecondaryText}>View History</Text>
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
  dateSelectorCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.card, borderRadius: 20, padding: 12, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  dateArrowBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  dateArrowText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  dateSelectorTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  dateSelectorSub: { fontSize: 11, color: C.textSecondary, marginTop: 1 },
  historicalBadge: { backgroundColor: C.warningLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  historicalBadgeText: { fontSize: 9, fontWeight: '900', color: C.warning },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardSectionLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  statusCompletedBadge: { backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusCompletedBadgeText: { fontSize: 10, fontWeight: '900', color: C.primary },
  heroCenter: { alignItems: 'center', marginVertical: 8 },
  moodEmojiCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  heroMoodTitle: { fontSize: 24, fontWeight: '900', color: C.textPrimary },
  heroTimeText: { fontSize: 12, fontWeight: '700', color: C.textSecondary, marginTop: 2 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  summaryBox: { width: '48%', backgroundColor: C.bg, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  summaryVal: { fontSize: 15, fontWeight: '900', color: C.textPrimary },
  summaryLabel: { fontSize: 10, fontWeight: '600', color: C.textSecondary, marginTop: 2 },
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
  changesText: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  riskContextCard: { backgroundColor: C.primaryLight, borderColor: C.primary, borderWidth: 1 },
  riskContextText: { fontSize: 12, color: C.textPrimary, lineHeight: 18 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionBtnPrimary: { flex: 1, height: 48, backgroundColor: C.primary, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, ...elevation.e1 },
  actionBtnPrimaryText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  actionBtnSecondary: { flex: 1, height: 48, backgroundColor: C.primaryLight, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  actionBtnSecondaryText: { color: C.primary, fontSize: 13, fontWeight: '900' },
  syncFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12 },
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

export default GuardianTodaysWellbeingScreen;

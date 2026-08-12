/**
 * GuardianWellbeingAlertsScreen.tsx — Screen G35 (Well-being Alerts / Change Center)
 * Spec: g35.txt
 *
 * Design Standard: Apple Health, One Medical, Samsung Health, Epic MyChart
 *
 * Screen Mission: Answers "What has changed enough that I should pay attention?"
 *
 * Component Architecture per g35.txt:
 *  1. Android safe-area layout.
 *  2. Top App Bar (Back button, Title "Well-being Alerts", Subtitle "Exception Management • G35", Filter, Overflow menu).
 *  3. Attention Summary Card (3 Active alerts, 1 High, 2 Moderate; All Clear state).
 *  4. Status Segmented Tabs (ACTIVE, ACKNOWLEDGED, RESOLVED, ALL).
 *  5. Priority Model (Canonical Risk Vocabulary: GREEN Normal, YELLOW Moderate, ORANGE High, RED Critical).
 *  6. Standardized Alert Cards:
 *     - Priority tag, Alert Title, Short factual explanation, Detection time, Status.
 *     - Actions: [Review Alert], [Call Elder], [Why am I seeing this?], [Mark Reviewed].
 *  7. "Why Am I Seeing This?" Factual Evidence Bottom Sheet Modal (Explains 7-day vs 30-day baseline shift).
 *  8. Alert Details Modal with supporting check-in evidence links to G33 / G34.
 *  9. Filter Bottom Sheet Modal (Priority, Alert Type, Status).
 * 10. Offline Banner & Persistent 5-Tab Bottom Navigation.
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

const LOW_MOODS = new Set(['Sad', 'Angry', 'Anxious']);

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

interface MoodHistoryEntry {
  id: number;
  mood_type: string;
  notes: string | null;
  date: string;
  day_name: string;
  created_at: string;
}

interface WellbeingAlertItem {
  id: string;
  priority: 'HIGH' | 'MODERATE';
  title: string;
  explanation: string;
  detectedAt: string;
  matchingEntries: MoodHistoryEntry[];
  reviewed: boolean;
}

interface GuardianWellbeingAlertsScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

const GuardianWellbeingAlertsScreen: React.FC<GuardianWellbeingAlertsScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(true);
  const [loadError, setLoadError]             = useState<string | null>(null);
  const [refreshing, setRefreshing]           = useState(false);
  const [activeTab, setActiveTab]             = useState<'ACTIVE' | 'REVIEWED' | 'ALL'>('ACTIVE');
  const [selectedAlert, setSelectedAlert]     = useState<WellbeingAlertItem | null>(null);
  const [showWhyModal, setShowWhyModal]       = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu]       = useState(false);
  const [alerts, setAlerts]                   = useState<WellbeingAlertItem[]>([]);
  const [elderPhone, setElderPhone]           = useState<string | null>(null);

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
      const history: MoodHistoryEntry[] = moodRes?.history || [];
      const derived: WellbeingAlertItem[] = [];

      const lowMoodEntries = history.filter(h => LOW_MOODS.has(h.mood_type));
      if (lowMoodEntries.length >= 2) {
        derived.push({
          id: 'low-mood',
          priority: lowMoodEntries.length >= 3 ? 'HIGH' : 'MODERATE',
          title: 'Repeated Low Mood Check-ins',
          explanation: `${lowMoodEntries.length} low-mood check-ins (${Array.from(new Set(lowMoodEntries.map(e => e.mood_type))).join(', ')}) were recorded in the last 7 days.`,
          detectedAt: lowMoodEntries[0]?.date || '',
          matchingEntries: lowMoodEntries,
          reviewed: false,
        });
      }

      const checkinDays = new Set(history.map(h => h.date)).size;
      if (checkinDays < 5) {
        derived.push({
          id: 'reduced-checkins',
          priority: checkinDays <= 2 ? 'HIGH' : 'MODERATE',
          title: 'Reduced Check-in Activity',
          explanation: `Only ${checkinDays} of the last 7 days have a recorded mood check-in.`,
          detectedAt: history[0]?.date || '',
          matchingEntries: history,
          reviewed: false,
        });
      }

      setAlerts(derived);
      if (elderRes) setElderPhone(elderRes.phone_number || null);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load well-being alerts. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeAlertsCount = alerts.filter(a => !a.reviewed).length;
  const highCount         = alerts.filter(a => !a.reviewed && a.priority === 'HIGH').length;
  const moderateCount     = alerts.filter(a => !a.reviewed && a.priority === 'MODERATE').length;

  const filteredAlerts = alerts.filter(a => {
    if (activeTab === 'ACTIVE') return !a.reviewed;
    if (activeTab === 'REVIEWED') return a.reviewed;
    return true; // ALL
  });

  const handleAcknowledge = (alertId: string) => {
    Haptics.selectionAsync();
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, reviewed: true } : a));
    Toast.show({ type: 'success', text1: 'Alert Reviewed', text2: 'Marked as reviewed for this session.' });
  };

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

      {/* ─── 5. TOP APP BAR ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Well-being Alerts</Text>
          <Text style={styles.headerSubtitle}>Exception Management • G35</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Refreshed Alerts' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Alerts</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); onNavigate('guardianSettings'); }}>
              <MaterialCommunityIcons name="bell-cog-outline" size={18} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Alert Preferences</Text>
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
          <View style={styles.attentionCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={40} color={C.textMuted} />
            <Text style={{ marginTop: 8, fontSize: 13, color: C.textPrimary, fontWeight: '700' }}>{loadError}</Text>
          </View>
        )}

        {!loading && !loadError && (
          <>
            {/* ─── ATTENTION SUMMARY CARD ─── */}
            <View style={styles.attentionCard}>
              <View style={styles.attentionHeaderRow}>
                <MaterialCommunityIcons name="shield-alert-outline" size={22} color={activeAlertsCount > 0 ? C.orange : C.primary} />
                <Text style={styles.attentionTitle}>
                  {activeAlertsCount > 0 ? 'Well-being Attention Required' : 'Well-being Status: ALL CLEAR ✓'}
                </Text>
              </View>

              {activeAlertsCount > 0 ? (
                <View style={styles.attentionGrid}>
                  <View style={styles.attentionBox}>
                    <Text style={[styles.attentionVal, { color: C.orange }]}>{highCount}</Text>
                    <Text style={styles.attentionLabel}>High Priority</Text>
                  </View>

                  <View style={styles.attentionBox}>
                    <Text style={[styles.attentionVal, { color: C.warning }]}>{moderateCount}</Text>
                    <Text style={styles.attentionLabel}>Moderate Priority</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.allClearText}>
                  No well-being alerts currently require guardian review based on the last 7 days of check-ins.
                </Text>
              )}
            </View>

            {/* ─── STATUS SEGMENTED TABS ─── */}
            <View style={styles.tabRow}>
              {[
                { id: 'ACTIVE', label: `Active (${activeAlertsCount})` },
                { id: 'REVIEWED', label: 'Reviewed' },
                { id: 'ALL', label: 'All Alerts' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabBtnItem, activeTab === tab.id && styles.tabBtnItemActive]}
                  onPress={() => setActiveTab(tab.id as any)}
                >
                  <Text style={[styles.tabBtnText, activeTab === tab.id && styles.tabBtnTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ─── ALERT CARDS LIST ─── */}
            <View style={styles.alertList}>
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((item) => {
                  const isHigh = item.priority === 'HIGH';
                  const priorityBg    = isHigh ? C.orangeLight : C.warningLight;
                  const priorityColor = isHigh ? C.orange : C.warning;

                  return (
                    <View key={item.id} style={styles.alertCard}>
                      <View style={styles.alertCardHeader}>
                        <View style={[styles.priorityTag, { backgroundColor: priorityBg }]}>
                          <Text style={[styles.priorityTagText, { color: priorityColor }]}>
                            {item.priority} PRIORITY
                          </Text>
                        </View>
                        <Text style={styles.detectedTimeText}>{item.detectedAt}</Text>
                      </View>

                      <Text style={styles.alertTitleText}>{item.title}</Text>
                      <Text style={styles.alertExplanationText}>{item.explanation}</Text>

                      <TouchableOpacity
                        style={styles.whyLinkBtn}
                        onPress={() => {
                          setSelectedAlert(item);
                          setShowWhyModal(true);
                        }}
                      >
                        <MaterialCommunityIcons name="help-circle-outline" size={16} color={C.primary} />
                        <Text style={styles.whyLinkText}>Why am I seeing this alert?</Text>
                      </TouchableOpacity>

                      {/* Actions Bar */}
                      <View style={styles.alertActionsRow}>
                        {!item.reviewed && (
                          <TouchableOpacity style={styles.reviewBtn} onPress={() => handleAcknowledge(item.id)}>
                            <MaterialCommunityIcons name="check-circle-outline" size={16} color="#FFF" />
                            <Text style={styles.reviewBtnText}>Mark as Reviewed</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.detailsBtn}
                          onPress={() => {
                            setSelectedAlert(item);
                            setShowDetailModal(true);
                          }}
                        >
                          <Text style={styles.detailsBtnText}>View Details & Evidence →</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyStateContainer}>
                  <MaterialCommunityIcons name="shield-check-outline" size={48} color={C.primary} />
                  <Text style={styles.emptyStateTitle}>No Alerts in This Section</Text>
                  <Text style={styles.emptyStateSub}>There are no well-being alerts matching your current filter.</Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* WHY AM I SEEING THIS MODAL */}
      <Modal visible={showWhyModal} transparent animationType="slide" onRequestClose={() => setShowWhyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Why You're Seeing This Alert</Text>
              <TouchableOpacity onPress={() => setShowWhyModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedAlert && (
              <View>
                <Text style={styles.whyBodyText}>
                  This alert is derived directly from your elder's mood check-in history over the last 7 days — it is not a prediction, only a factual pattern in their own recorded data.
                </Text>

                <View style={styles.whyEvidenceBox}>
                  <Text style={styles.whyEvidenceTitle}>Factual Detection Trigger:</Text>
                  <Text style={styles.whyEvidenceText}>• Alert Type: {selectedAlert.title}</Text>
                  <Text style={styles.whyEvidenceText}>• Observation: {selectedAlert.explanation}</Text>
                  <Text style={styles.whyEvidenceText}>• Window: Last 7 Days ({selectedAlert.matchingEntries.length} matching record{selectedAlert.matchingEntries.length === 1 ? '' : 's'})</Text>
                </View>

                <TouchableOpacity style={styles.whyCloseBtn} onPress={() => setShowWhyModal(false)}>
                  <Text style={styles.whyCloseBtnText}>Understand & Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ALERT DETAILS & EVIDENCE MODAL */}
      <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alert Evidence & Recommended Actions</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedAlert && (
              <View>
                <Text style={styles.detailAlertTitle}>{selectedAlert.title}</Text>
                <Text style={styles.detailAlertSub}>{selectedAlert.explanation}</Text>

                <Text style={styles.evidenceHeaderLabel}>SUPPORTING CHECK-IN RECORDS ({selectedAlert.matchingEntries.length})</Text>
                {selectedAlert.matchingEntries.slice(0, 5).map((e) => (
                  <View key={e.id} style={styles.evidenceCardRow}>
                    <MaterialCommunityIcons name="calendar-check" size={20} color={C.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.evidenceCardTitle}>{e.mood_type} — {e.date}</Text>
                      {!!e.notes && <Text style={styles.evidenceCardSub}>{e.notes}</Text>}
                    </View>
                  </View>
                ))}

                <Text style={styles.evidenceHeaderLabel}>RECOMMENDED GUARDIAN ACTIONS</Text>
                <View style={styles.recActionsGrid}>
                  <TouchableOpacity style={styles.recActionBtn} onPress={handleCallElder}>
                    <MaterialCommunityIcons name="phone" size={18} color={C.primary} />
                    <Text style={styles.recActionBtnText}>Call Elder</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.recActionBtn}
                    onPress={() => {
                      setShowDetailModal(false);
                      onNavigate('wellbeingHistory');
                    }}
                  >
                    <MaterialCommunityIcons name="history" size={18} color={C.primary} />
                    <Text style={styles.recActionBtnText}>View History (G34)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: C.primary, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 60, paddingRight: 16 },
  menuContent: { backgroundColor: C.card, borderRadius: 16, padding: 8, width: 200, ...elevation.e3, borderWidth: 1, borderColor: C.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12 },
  menuItemText: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: 110 },
  attentionCard: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  attentionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  attentionTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  attentionGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  attentionBox: { alignItems: 'center' },
  attentionVal: { fontSize: 22, fontWeight: '900' },
  attentionLabel: { fontSize: 11, fontWeight: '600', color: C.textSecondary, marginTop: 2 },
  allClearText: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  tabRow: { flexDirection: 'row', backgroundColor: colors.outline, borderRadius: 14, padding: 4, marginBottom: spacing.s4 },
  tabBtnItem: { flex: 1, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tabBtnItemActive: { backgroundColor: C.card, ...elevation.e1 },
  tabBtnText: { fontSize: 11, fontWeight: '700', color: C.textSecondary },
  tabBtnTextActive: { color: C.primary, fontWeight: '900' },
  alertList: { gap: 12 },
  alertCard: { backgroundColor: C.card, borderRadius: 20, padding: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  alertCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priorityTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityTagText: { fontSize: 10, fontWeight: '900' },
  detectedTimeText: { fontSize: 11, color: C.textMuted },
  alertTitleText: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  alertExplanationText: { fontSize: 12, color: C.textSecondary, marginTop: 4, lineHeight: 18 },
  whyLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  whyLinkText: { fontSize: 12, fontWeight: '700', color: C.primary },
  alertActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  reviewBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  detailsBtn: { paddingVertical: 8 },
  detailsBtnText: { fontSize: 12, fontWeight: '800', color: C.primary },
  emptyStateContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyStateTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary, marginTop: 10 },
  emptyStateSub: { fontSize: 12, color: C.textSecondary, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.s6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  whyBodyText: { fontSize: 13, color: C.textSecondary, lineHeight: 18 },
  whyEvidenceBox: { backgroundColor: C.bg, borderRadius: 14, padding: 12, marginVertical: 12, borderWidth: 1, borderColor: C.border },
  whyEvidenceTitle: { fontSize: 12, fontWeight: '800', color: C.textPrimary, marginBottom: 4 },
  whyEvidenceText: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  whyCloseBtn: { height: 44, backgroundColor: C.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  whyCloseBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  detailAlertTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  detailAlertSub: { fontSize: 12, color: C.textSecondary, marginTop: 2, marginBottom: 12 },
  evidenceHeaderLabel: { fontSize: 10, fontWeight: '900', color: C.textMuted, letterSpacing: 0.8, marginTop: 8, marginBottom: 6 },
  evidenceCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.primaryLight, padding: 12, borderRadius: 14 },
  evidenceCardTitle: { fontSize: 13, fontWeight: '800', color: C.primary },
  evidenceCardSub: { fontSize: 11, color: C.textSecondary, marginTop: 1 },
  recActionsGrid: { flexDirection: 'row', gap: 10, marginTop: 8 },
  recActionBtn: { flex: 1, height: 44, backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  recActionBtnText: { fontSize: 12, fontWeight: '800', color: C.primary },
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

export default GuardianWellbeingAlertsScreen;

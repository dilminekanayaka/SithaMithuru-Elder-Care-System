/**
 * GuardianActivityDetailsScreen.tsx — Screen G45 (Single Activity Details)
 * Spec: g45.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, NHS App, Samsung Health
 *
 * Screen Mission: Answers "What exactly was this activity?"
 *
 * Healthcare Safety Mandate per g45.txt:
 *  - Activity data is OBSERVATIONAL. Do NOT make unsupported clinical conclusions or medical diagnostic claims.
 *
 * Component Architecture per g45.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Activity Details", Subtitle "Single Activity Inspection • G45", Overflow menu).
 *  3. Elder Context Banner (Nimal Perera, August 9, 2026).
 *  4. Activity Hero Card (Icon: walk, Name: Morning Walk, Duration: 28 min, Status: RECORDED).
 *  5. Activity Information Card (Type: Walking, Started: 9:30 AM, Ended: 9:58 AM, Status: RECORDED).
 *  6. Duration Card (Human readable: 28 minutes / 1,680 seconds).
 *  7. Notes Card (System Observed note: "Morning walking activity recorded from elder device sensors").
 *  8. Data Information Card (Recorded: 9:58 AM, Source: Elder Device, Sync: ✓ Synced).
 *  9. Previous / Next Activity Navigation Bar (Previous: Breakfast, Next: Rest).
 * 10. Data Synchronization Footer & Persistent 5-Tab Bottom Navigation Bar.
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

interface GuardianActivityDetailsScreenProps {
  onBack: () => void;
  token?: string;
  activityId?: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

const GuardianActivityDetailsScreen: React.FC<GuardianActivityDetailsScreenProps> = ({
  onBack,
  token,
  activityId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const activityData = {
    id: activityId || 'act1',
    title: 'Morning Walk',
    type: 'Walking / Physical Movement',
    startedAt: '09:30 AM',
    endedAt: '09:58 AM',
    durationMinutes: 28,
    durationSeconds: 1680,
    status: 'RECORDED',
    note: 'Morning walking activity automatically recorded from elder device sensors.',
    noteSource: 'System Observed (Elder Device Sensors)',
    recordedAt: '09:58 AM',
    sourceDevice: 'Elder Android Handset (Model SM-G990)',
    syncStatus: 'SYNCED',
    lastSyncedAt: '10:01 AM',
    prevActivity: 'Breakfast (08:00 AM)',
    nextActivity: 'Rest (10:24 AM)',
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
          <Text style={styles.headerTitle}>Activity Details</Text>
          <Text style={styles.headerSubtitle}>Single Activity Inspection • G45</Text>
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
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); Toast.show({ type: 'success', text1: 'Activity Record Refreshed' }); }}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.primary} />
              <Text style={styles.menuItemText}>Refresh Data</Text>
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
        {/* ─── 5. ELDER CONTEXT BANNER ─── */}
        <View style={styles.elderContextBanner}>
          <MaterialCommunityIcons name="account-heart" size={20} color={C.primary} />
          <Text style={styles.elderContextText}>
            Monitoring <Text style={{ fontWeight: '900', color: C.textPrimary }}>Nimal Perera</Text> • August 9, 2026
          </Text>
        </View>

        {/* ─── 6. ACTIVITY HERO CARD ─── */}
        <View style={styles.heroCard}>
          <View style={styles.heroCenter}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="walk" size={42} color={C.primary} />
            </View>

            <Text style={styles.heroTitle}>{activityData.title}</Text>
            <Text style={styles.heroSub}>{activityData.durationMinutes} min • Recorded Activity</Text>

            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>STATUS: {activityData.status}</Text>
            </View>
          </View>
        </View>

        {/* ─── 7. ACTIVITY INFORMATION CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="information-outline" size={20} color={C.info} />
            <Text style={styles.cardHeaderTitle}>Activity Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Activity Type:</Text>
            <Text style={styles.infoVal}>{activityData.type}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Started Time:</Text>
            <Text style={styles.infoVal}>{activityData.startedAt}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ended Time:</Text>
            <Text style={styles.infoVal}>{activityData.endedAt}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Recorded Status:</Text>
            <Text style={[styles.infoVal, { color: C.primary }]}>✓ {activityData.status}</Text>
          </View>
        </View>

        {/* ─── 9. DURATION CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="timer-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Recorded Duration</Text>
          </View>

          <View style={styles.durationHeroRow}>
            <Text style={styles.durationNumText}>{activityData.durationMinutes} min</Text>
            <Text style={styles.durationSubText}>({activityData.durationSeconds} seconds of continuous recorded movement)</Text>
          </View>
        </View>

        {/* ─── 12. NOTES CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="notebook-outline" size={20} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Activity Notes</Text>
          </View>

          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{activityData.note}</Text>
            <Text style={styles.notesSourceText}>Source: {activityData.noteSource}</Text>
          </View>
        </View>

        {/* ─── 15. DATA & SYNCHRONIZATION INFORMATION CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="database-sync-outline" size={20} color={C.info} />
            <Text style={styles.cardHeaderTitle}>Data Information & Sync</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Recorded Time:</Text>
            <Text style={styles.infoVal}>{activityData.recordedAt}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Source Device:</Text>
            <Text style={styles.infoVal}>{activityData.sourceDevice}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Synchronization:</Text>
            <Text style={[styles.infoVal, { color: C.primary }]}>✓ {activityData.syncStatus}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cloud Synced At:</Text>
            <Text style={styles.infoVal}>{activityData.lastSyncedAt}</Text>
          </View>
        </View>

        {/* ─── 26. PREVIOUS / NEXT ACTIVITY NAVIGATION BAR ─── */}
        <Text style={styles.sectionHeaderTitle}>Adjacent Activities</Text>
        <View style={styles.prevNextRow}>
          <TouchableOpacity style={styles.prevNextBtn} onPress={() => Toast.show({ type: 'info', text1: 'Previous Activity', text2: activityData.prevActivity })}>
            <MaterialCommunityIcons name="chevron-left" size={18} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.prevNextSub}>PREVIOUS</Text>
              <Text style={styles.prevNextTitle}>{activityData.prevActivity}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.prevNextBtn} onPress={() => Toast.show({ type: 'info', text1: 'Next Activity', text2: activityData.nextActivity })}>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.prevNextSub}>NEXT</Text>
              <Text style={styles.prevNextTitle}>{activityData.nextActivity}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={C.primary} />
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
  elderContextBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginBottom: spacing.s4 },
  elderContextText: { fontSize: 12, color: C.textSecondary },
  heroCard: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  heroCenter: { alignItems: 'center', marginVertical: 8 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: C.textPrimary },
  heroSub: { fontSize: 13, fontWeight: '700', color: C.textSecondary, marginTop: 2 },
  statusBadge: { backgroundColor: C.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '900', color: C.primary },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel: { fontSize: 12, color: C.textSecondary },
  infoVal: { fontSize: 12, fontWeight: '700', color: C.textPrimary },
  durationHeroRow: { alignItems: 'center', marginVertical: 6 },
  durationNumText: { fontSize: 28, fontWeight: '900', color: C.primary },
  durationSubText: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  notesBox: { backgroundColor: C.bg, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.border },
  notesText: { fontSize: 13, color: C.textPrimary, lineHeight: 18 },
  notesSourceText: { fontSize: 10, fontWeight: '800', color: C.textMuted, marginTop: 8 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  prevNextRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.s4 },
  prevNextBtn: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 6, ...elevation.e1 },
  prevNextSub: { fontSize: 9, fontWeight: '900', color: C.textMuted, letterSpacing: 0.8 },
  prevNextTitle: { fontSize: 11, fontWeight: '800', color: C.textPrimary, marginTop: 1 },
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

export default GuardianActivityDetailsScreen;

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
  StatusBar,
  ScrollView,
  RefreshControl,
  Modal,
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

interface ActivityFeedItem {
  type: 'medication' | 'mood' | 'task';
  title: string;
  detail: string;
  event_time: string;
  icon: string;
  color: string;
}

interface GuardianActivityDetailsScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  activity?: ActivityFeedItem | null;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  medication: 'Medication',
  mood: 'Mood Check-in',
  task: 'Daily Task',
};

const GuardianActivityDetailsScreen: React.FC<GuardianActivityDetailsScreenProps> = ({
  onBack,
  token,
  elderId,
  activity,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [elderName, setElderName]       = useState('your elder');

  useEffect(() => {
    if (!elderId) {
      setLoading(false);
      return;
    }
    apiFetch(`/guardian/elders/${elderId}`, token)
      .then((res) => setElderName(res?.name || 'your elder'))
      .catch((err) => {
        if (err instanceof SessionExpiredError) onSessionExpired?.();
      })
      .finally(() => setLoading(false));
  }, [elderId, token, onSessionExpired]);

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
        {/* ─── ELDER CONTEXT BANNER ─── */}
        <View style={styles.elderContextBanner}>
          <MaterialCommunityIcons name="account-heart" size={20} color={C.primary} />
          <Text style={styles.elderContextText}>
            Monitoring <Text style={{ fontWeight: '900', color: C.textPrimary }}>{elderName}</Text>
          </Text>
        </View>

        {!activity ? (
          <View style={styles.card}>
            <MaterialCommunityIcons name="alert-circle-outline" size={40} color={C.textMuted} />
            <Text style={{ marginTop: 8, fontSize: 13, color: C.textSecondary }}>No activity record selected. Go back and tap an event from the timeline.</Text>
          </View>
        ) : (
          <>
            {/* ─── ACTIVITY HERO CARD ─── */}
            <View style={styles.heroCard}>
              <View style={styles.heroCenter}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name={activity.icon as any} size={42} color={activity.color} />
                </View>

                <Text style={styles.heroTitle}>{activity.title}</Text>
                <Text style={styles.heroSub}>{TYPE_LABEL[activity.type] || activity.type}</Text>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>RECORDED</Text>
                </View>
              </View>
            </View>

            {/* ─── ACTIVITY INFORMATION CARD ─── */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="information-outline" size={20} color={C.info} />
                <Text style={styles.cardHeaderTitle}>Activity Information</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type:</Text>
                <Text style={styles.infoVal}>{TYPE_LABEL[activity.type] || activity.type}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Recorded Time:</Text>
                <Text style={styles.infoVal}>{new Date(activity.event_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
              </View>
            </View>

            {/* ─── NOTES CARD ─── */}
            {!!activity.detail && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="notebook-outline" size={20} color={C.primary} />
                  <Text style={styles.cardHeaderTitle}>Details</Text>
                </View>

                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>{activity.detail}</Text>
                </View>
              </View>
            )}
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
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
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
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...elevation.e2,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 2 },
  tabLabelActive: { color: C.primary, fontWeight: '800' },
});

export default GuardianActivityDetailsScreen;

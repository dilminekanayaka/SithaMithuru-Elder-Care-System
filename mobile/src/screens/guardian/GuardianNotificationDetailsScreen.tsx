/**
 * GuardianNotificationDetailsScreen.tsx — Screen G47 (Notification Details & Actions)
 * Spec: g47.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, NHS App, Samsung Health
 *
 * Screen Mission: Answers "What exactly happened, why am I seeing this, and what can I do about it?"
 *
 * Healthcare Safety Mandate per g47.txt:
 *  - Read ≠ Acknowledged ≠ Resolved.
 *  - Opening an emergency notification does NOT automatically resolve it.
 *  - Actions are strictly contextual depending on notification category.
 *
 * Component Architecture per g47.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Title "Notification Details", Subtitle "Full Record & Actions • G47", Overflow menu).
 *  3. Notification Hero (Category, Title, Elder Name, Timestamp, Priority Banner).
 *  4. What Happened Narrative (Full untruncated notification content).
 *  5. Event Context & Information Card (Medication / Activity / Emergency specific event metadata).
 *  6. Healthcare State Status Card (Read at 09:18 AM, Acknowledged: Pending, Resolution: Requires Review).
 *  7. Contextual Actions Section (Primary CTA + Secondary CTA).
 *  8. Collapsible Technical Metadata Accordion (ID, Source, CreatedAt, SyncStatus).
 *  9. Offline Banner & Persistent 5-Tab Bottom Navigation Bar.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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

export interface NotificationDetailData {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

interface GuardianNotificationDetailsScreenProps {
  onBack: () => void;
  token?: string;
  notification?: NotificationDetailData | null;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

const categoryForType = (type: string): 'EMERGENCY' | 'MEDICATION' | 'SYSTEM' => {
  if (type === 'sos') return 'EMERGENCY';
  if (type === 'medication') return 'MEDICATION';
  return 'SYSTEM';
};

const GuardianNotificationDetailsScreen: React.FC<GuardianNotificationDetailsScreenProps> = ({
  onBack,
  token,
  notification,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [refreshing, setRefreshing]           = useState(false);

  const category = notification ? categoryForType(notification.type) : 'SYSTEM';

  const handlePrimaryAction = () => {
    if (category === 'MEDICATION') {
      onNavigate('todaysMedication');
    } else if (category === 'EMERGENCY') {
      onNavigate('emergencyAlerts');
    } else {
      onNavigate('guardianDashboard');
    }
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
          <Text style={styles.headerTitle}>Notification Details</Text>
          <Text style={styles.headerSubtitle}>Full Record & Actions • G47</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} colors={[C.primary]} />
        }
      >
        {!notification ? (
          <View style={styles.card}>
            <MaterialCommunityIcons name="alert-circle-outline" size={40} color={C.textMuted} />
            <Text style={{ marginTop: 8, fontSize: 13, color: C.textSecondary }}>No notification selected. Go back and tap a notification from the list.</Text>
          </View>
        ) : (
          <>
            {/* ─── NOTIFICATION HERO CARD ─── */}
            <View style={[styles.heroCard, category === 'EMERGENCY' && styles.heroCardEmerg]}>
              <View style={styles.heroCategoryRow}>
                <View style={[styles.categoryBadge, { backgroundColor: category === 'EMERGENCY' ? C.errorLight : C.primaryLight }]}>
                  <MaterialCommunityIcons
                    name={category === 'EMERGENCY' ? 'alert-decagram' : category === 'MEDICATION' ? 'pill' : 'information-outline'}
                    size={14}
                    color={category === 'EMERGENCY' ? C.error : C.primary}
                  />
                  <Text style={[styles.categoryBadgeText, { color: category === 'EMERGENCY' ? C.error : C.primary }]}>
                    {category}
                  </Text>
                </View>
                <Text style={styles.timestampText}>{new Date(notification.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
              </View>

              <Text style={styles.heroTitle}>{notification.title}</Text>
            </View>

            {/* ─── FULL NOTIFICATION WHAT HAPPENED CARD ─── */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="file-document-outline" size={20} color={C.primary} />
                <Text style={styles.cardHeaderTitle}>What Happened</Text>
              </View>
              <Text style={styles.fullBodyText}>{notification.message}</Text>
            </View>

            {/* ─── CONTEXTUAL ACTIONS SECTION ─── */}
            <Text style={styles.sectionHeaderTitle}>Recommended Actions</Text>
            <View style={styles.actionsCol}>
              <TouchableOpacity style={styles.primaryActionBtn} onPress={handlePrimaryAction}>
                <MaterialCommunityIcons name={category === 'EMERGENCY' ? 'alert-decagram' : category === 'MEDICATION' ? 'pill' : 'view-dashboard-outline'} size={18} color="#FFF" />
                <Text style={styles.primaryActionBtnText}>
                  {category === 'EMERGENCY' ? 'View Emergency Alerts' : category === 'MEDICATION' ? "View Today's Medication" : 'Go to Dashboard'}
                </Text>
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
          const isActive = tab.id === 'guardianDashboard';
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
  heroCard: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  heroCardEmerg: { borderLeftWidth: 6, borderLeftColor: C.error, backgroundColor: colors.errorContainer },
  heroCategoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { fontSize: 10, fontWeight: '900' },
  timestampText: { fontSize: 11, color: C.textMuted, fontWeight: '700' },
  heroTitle: { fontSize: 22, fontWeight: '900', color: C.textPrimary, marginVertical: 4 },
  heroElderText: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  fullBodyText: { fontSize: 13, color: C.textPrimary, lineHeight: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  infoLabel: { fontSize: 12, color: C.textSecondary },
  infoVal: { fontSize: 12, fontWeight: '700', color: C.textPrimary },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  statusLabel: { fontSize: 12, color: C.textSecondary },
  statusVal: { fontSize: 12, fontWeight: '800' },
  ackBtn: { height: 44, backgroundColor: C.primary, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 },
  ackBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  actionsCol: { gap: 10, marginBottom: spacing.s4 },
  primaryActionBtn: { height: 48, backgroundColor: C.primary, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, ...elevation.e1 },
  primaryActionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  secondaryActionBtn: { height: 44, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  secondaryActionBtnText: { color: C.primary, fontSize: 13, fontWeight: '800' },
  metadataHeaderBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  metadataHeaderTitle: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 0.5 },
  metadataCard: { backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.border, marginBottom: spacing.s4 },
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

export default GuardianNotificationDetailsScreen;

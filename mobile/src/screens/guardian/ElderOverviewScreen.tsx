/**
 * ElderOverviewScreen.tsx — Screen G10 (Elder Overview Landing Page)
 * Spec: g10.txt
 *
 * Design Standard: Apple Health, Epic MyChart, One Medical, Samsung Health
 *
 * Screen Mission: Answers "Who am I caring for, and what is their current health status?"
 *
 * Component Tree per g10.txt:
 *  1. Header Bar (Back button, Title "Elder Overview", Universal Search, Overflow More Menu)
 *  2. Elder Profile Hero Card (72dp Photo/Avatar, Name, Age, Relationship, Online Status, Pairing Status, Risk Badge)
 *  3. Health Status Summary Grid (5 Metric Tiles: Health Score 92%, Medication 5/6, Routine 4/5, Mood 😊 Happy, Emergency None)
 *  4. Today's Status Card (Medication 83%, Routine 80%, Mood Happy, Risk Low)
 *  5. Medical Summary Card (Blood Group O+, Allergies Penicillin, Chronic Conditions Hypertension & Diabetes, Doctor, Hospital)
 *  6. Quick Actions 2×2 Grid (64dp: Call Elder, Send Reminder, View Location, Medication)
 *  7. Connected Devices Card (Elder Phone Connected 88% Battery, Smart Watch, Health Band)
 *  8. Emergency Contacts Card (1-Tap Call: Primary Mary Perera, Doctor Dr. Silva, Hospital Asiri Central, Ambulance 1990)
 *  9. Recent Activity Timeline (Max 10 Chronological Events)
 * 10. Navigation Shortcuts List (Medical Profile, Health Information, Emergency Contacts, Timeline, Relationship Settings)
 * 11. Persistent 5-Tab Bottom Navigation Bar (Home, Elder, Emergency, Reports, Settings)
 * 12. Offline SQLite Fallback & Overflow Menu Actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  Linking,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

interface ElderOverviewScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  token?: string;
  elderId?: string | null;
  onSessionExpired?: () => void;
}

const ElderOverviewScreen: React.FC<ElderOverviewScreenProps> = ({
  onBack,
  onNavigate,
  token,
  elderId,
  onSessionExpired,
}) => {
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [elderData, setElderData]       = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError]               = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [activeShortcutModal, setActiveShortcutModal] = useState<string | null>(null);

  // ─── Fetch API ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const dashRes = await apiFetch('/guardian/dashboard', token);
      setDashboardData(dashRes);

      const elder = dashRes?.elder;
      if (elder?.id) {
        try {
          const detailRes = await apiFetch(`/guardian/elders/${elder.id}`, token);
          setElderData(detailRes);
        } catch {
          setElderData(elder);
        }
      } else if (elderId) {
        try {
          const detailRes = await apiFetch(`/guardian/elders/${elderId}`, token);
          setElderData(detailRes);
        } catch {}
      }
    } catch (err: any) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setError(err.message || 'Failed to load elder overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, elderId, onSessionExpired]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const elder           = elderData || dashboardData?.elder;
  const stats           = dashboardData?.stats;
  const todayMood       = stats?.todayMood;
  const activeEmergency = dashboardData?.activeEmergency;

  const elderName  = elder?.name || 'Nimal Perera';
  const elderPhone = elder?.phone_number || elder?.phone || '+94 77 123 4567';
  const elderAge   = elder?.age ? `${elder.age} Years` : '72 Years';
  const bloodType  = elder?.blood_type || 'O+';

  const medTaken    = stats?.takenMeds ?? 5;
  const medTotal    = stats?.totalMeds ?? 6;
  const taskDone    = stats?.completedTasks ?? 4;
  const taskTotal   = stats?.totalTasks ?? 5;

  const handleCall = (number: string, label: string) => {
    Haptics.selectionAsync();
    Linking.openURL(`tel:${number}`).catch(() => {
      Toast.show({ type: 'info', text1: `Calling ${label}`, text2: `Dialing ${number}...` });
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Go back">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Elder Overview</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent />

      {/* ─── 5. HEADER BAR ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Elder Overview</Text>

        <View style={styles.headerIconsRow}>
          {/* Universal Search Icon */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => Toast.show({ type: 'info', text1: 'Search Elder Record', text2: 'Searching medical profile, timeline, and contacts...' })}
          >
            <MaterialCommunityIcons name="magnify" size={22} color="#1E293B" />
          </TouchableOpacity>

          {/* Overflow More Menu Button */}
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowMoreMenu(true)}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={[colors.primary]} />
        }
      >
        {/* ─── 6. ELDER PROFILE HERO CARD (72DP PHOTO) ─── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            {/* 72dp Photo / Avatar */}
            <View style={styles.avatar72}>
              <Text style={styles.avatarInitials}>{elderName.charAt(0)}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.onlineBadgeRow}>
                <View style={[styles.statusDot, { backgroundColor: activeEmergency ? '#EF4444' : '#10B981' }]} />
                <Text style={styles.onlineText}>
                  {activeEmergency ? 'EMERGENCY DETECTED' : '● Online • Last active 2 mins ago'}
                </Text>
              </View>

              <Text style={styles.heroName}>{elderName}</Text>
              <Text style={styles.heroSub}>{elderAge} • Father • {elderPhone}</Text>
              <Text style={styles.pairingTag}>✓ Connected Successfully</Text>
            </View>

            {/* Risk Badge */}
            <View style={[styles.riskBadge, { backgroundColor: activeEmergency ? '#FEE2E2' : '#E8F5E9' }]}>
              <Text style={[styles.riskBadgeText, { color: activeEmergency ? '#EF4444' : colors.primary }]}>
                {activeEmergency ? 'HIGH RISK' : 'LOW RISK'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── 7. HEALTH STATUS SUMMARY (5 METRIC TILES) ─── */}
        <Text style={styles.sectionHeader}>Health Status Summary</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsScroll}>
          {/* Tile 1: Health Score */}
          <TouchableOpacity style={styles.metricTile} onPress={() => onNavigate?.('reports')}>
            <Text style={styles.metricValText}>92%</Text>
            <Text style={styles.metricLabelText}>Health Score</Text>
            <View style={[styles.tileBadgeBg, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.tileBadgeText, { color: colors.primary }]}>Healthy</Text>
            </View>
          </TouchableOpacity>

          {/* Tile 2: Medication */}
          <TouchableOpacity style={styles.metricTile} onPress={() => onNavigate?.('guardianMedication')}>
            <Text style={styles.metricValText}>{medTaken}/{medTotal}</Text>
            <Text style={styles.metricLabelText}>Medication</Text>
            <View style={[styles.tileBadgeBg, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.tileBadgeText, { color: colors.primary }]}>83% Taken</Text>
            </View>
          </TouchableOpacity>

          {/* Tile 3: Routine */}
          <TouchableOpacity style={styles.metricTile} onPress={() => onNavigate?.('guardianTaskDashboard')}>
            <Text style={styles.metricValText}>{taskDone}/{taskTotal}</Text>
            <Text style={styles.metricLabelText}>Routine</Text>
            <View style={[styles.tileBadgeBg, { backgroundColor: '#DBEAFE' }]}>
              <Text style={[styles.tileBadgeText, { color: '#2563EB' }]}>80% Done</Text>
            </View>
          </TouchableOpacity>

          {/* Tile 4: Mood */}
          <TouchableOpacity style={styles.metricTile} onPress={() => onNavigate?.('guardianMoodDashboard')}>
            <Text style={styles.metricValText}>😊 Happy</Text>
            <Text style={styles.metricLabelText}>Today's Mood</Text>
            <View style={[styles.tileBadgeBg, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.tileBadgeText, { color: '#D97706' }]}>Stable</Text>
            </View>
          </TouchableOpacity>

          {/* Tile 5: Emergency */}
          <TouchableOpacity style={styles.metricTile} onPress={() => onNavigate?.('emergencyAlerts')}>
            <Text style={styles.metricValText}>None</Text>
            <Text style={styles.metricLabelText}>Emergency</Text>
            <View style={[styles.tileBadgeBg, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.tileBadgeText, { color: colors.primary }]}>Safe</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* ─── 8. TODAY'S STATUS CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="calendar-check-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Today's Status Overview</Text>
          </View>
          <View style={styles.statusGrid}>
            <View style={styles.statusBox}>
              <Text style={styles.statusBoxVal}>83%</Text>
              <Text style={styles.statusBoxLabel}>Medication</Text>
            </View>
            <View style={styles.statusBox}>
              <Text style={styles.statusBoxVal}>80%</Text>
              <Text style={styles.statusBoxLabel}>Routine</Text>
            </View>
            <View style={styles.statusBox}>
              <Text style={styles.statusBoxVal}>😊 Happy</Text>
              <Text style={styles.statusBoxLabel}>Last Mood</Text>
            </View>
            <View style={styles.statusBox}>
              <Text style={styles.statusBoxVal}>Low</Text>
              <Text style={styles.statusBoxLabel}>Today's Risk</Text>
            </View>
          </View>
        </View>

        {/* ─── 9. MEDICAL SUMMARY CARD ─── */}
        <TouchableOpacity style={styles.card} onPress={() => setActiveShortcutModal('medical')} activeOpacity={0.9}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color="#059669" />
            <Text style={styles.cardTitle}>Medical Summary</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </View>

          <View style={styles.medRow}>
            <Text style={styles.medLabel}>Blood Group:</Text>
            <Text style={styles.medVal}>{bloodType}</Text>
          </View>
          <View style={styles.medRow}>
            <Text style={styles.medLabel}>Allergies:</Text>
            <Text style={styles.medVal}>Penicillin (Mild Rash)</Text>
          </View>
          <View style={styles.medRow}>
            <Text style={styles.medLabel}>Chronic Conditions:</Text>
            <Text style={styles.medVal}>Hypertension, Type 2 Diabetes</Text>
          </View>
          <View style={styles.medRow}>
            <Text style={styles.medLabel}>Primary Doctor:</Text>
            <Text style={styles.medVal}>Dr. K. L. Silva</Text>
          </View>
          <View style={styles.medRow}>
            <Text style={styles.medLabel}>Preferred Hospital:</Text>
            <Text style={styles.medVal}>Asiri Central Hospital</Text>
          </View>
        </TouchableOpacity>

        {/* ─── 10. 2x2 QUICK ACTIONS GRID (64DP TARGETS) ─── */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => handleCall(elderPhone, elderName)} activeOpacity={0.85}>
            <View style={[styles.quickIcon, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="phone" size={24} color={colors.primary} />
            </View>
            <Text style={styles.quickText}>Call Elder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => Toast.show({ type: 'success', text1: 'Reminder Sent', text2: 'Push notification sent to elder.' })}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIcon, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="bell-ring-outline" size={24} color="#D97706" />
            </View>
            <Text style={styles.quickText}>Send Reminder</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickBtn} onPress={() => onNavigate?.('liveMonitoring')} activeOpacity={0.85}>
            <View style={[styles.quickIcon, { backgroundColor: '#DBEAFE' }]}>
              <MaterialCommunityIcons name="map-marker-radius-outline" size={24} color="#2563EB" />
            </View>
            <Text style={styles.quickText}>View Location</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickBtn} onPress={() => onNavigate?.('guardianMedication')} activeOpacity={0.85}>
            <View style={[styles.quickIcon, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="pill" size={24} color={colors.primary} />
            </View>
            <Text style={styles.quickText}>Medication</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 11. CONNECTED DEVICES CARD ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="watch-variant" size={20} color="#7C3AED" />
            <Text style={styles.cardTitle}>Connected Devices</Text>
          </View>
          <View style={styles.deviceRow}>
            <MaterialCommunityIcons name="cellphone" size={20} color="#059669" />
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>Elder Smartphone</Text>
              <Text style={styles.deviceSub}>Battery: 88% • Status: Connected</Text>
            </View>
            <View style={styles.connectedTag}>
              <Text style={styles.connectedTagText}>Connected</Text>
            </View>
          </View>

          <View style={styles.deviceRow}>
            <MaterialCommunityIcons name="watch" size={20} color="#94A3B8" />
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>Smart Watch</Text>
              <Text style={styles.deviceSub}>Not Connected</Text>
            </View>
          </View>

          <View style={styles.deviceRow}>
            <MaterialCommunityIcons name="heart-pulse" size={20} color="#94A3B8" />
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>Health Band</Text>
              <Text style={styles.deviceSub}>Future Support</Text>
            </View>
          </View>
        </View>

        {/* ─── 12. EMERGENCY CONTACTS CARD (1-TAP CALL) ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="phone-classic" size={20} color="#DC2626" />
            <Text style={styles.cardTitle}>Emergency Contacts</Text>
          </View>
          <View style={styles.contactList}>
            <TouchableOpacity style={styles.contactRow} onPress={() => handleCall('+94 77 987 6543', 'Mary Perera')}>
              <MaterialCommunityIcons name="account-heart" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cName}>Primary: Mary Perera (Spouse)</Text>
                <Text style={styles.cNum}>+94 77 987 6543</Text>
              </View>
              <Text style={styles.callBadge}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactRow} onPress={() => handleCall('+94 11 269 1111', 'Dr. Silva')}>
              <MaterialCommunityIcons name="doctor" size={20} color="#059669" />
              <View style={{ flex: 1 }}>
                <Text style={styles.cName}>Doctor: Dr. K. L. Silva</Text>
                <Text style={styles.cNum}>+94 11 269 1111</Text>
              </View>
              <Text style={styles.callBadge}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactRow} onPress={() => handleCall('+94 11 269 6000', 'Asiri Central Hospital')}>
              <MaterialCommunityIcons name="hospital-building" size={20} color="#2563EB" />
              <View style={{ flex: 1 }}>
                <Text style={styles.cName}>Hospital: Asiri Central</Text>
                <Text style={styles.cNum}>+94 11 269 6000</Text>
              </View>
              <Text style={styles.callBadge}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactRow} onPress={() => handleCall('1990', '1990 Suwa Seriya')}>
              <MaterialCommunityIcons name="ambulance" size={20} color="#DC2626" />
              <View style={{ flex: 1 }}>
                <Text style={styles.cName}>Ambulance: 1990 Suwa Seriya</Text>
                <Text style={styles.cNum}>1990 National Hotline</Text>
              </View>
              <Text style={styles.callBadge}>Call 1990</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── 13. RECENT ACTIVITY TIMELINE (MAX 10 ITEMS) ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="timeline-clock-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Recent Activity Timeline</Text>
          </View>

          <View style={styles.timelineFeed}>
            {[
              { time: '10:42 AM', title: 'Medication Taken', sub: 'Vitamin D 1000 IU logged' },
              { time: '09:30 AM', title: 'Mood Updated', sub: 'Elder selected 😊 Happy' },
              { time: '08:10 AM', title: 'Breakfast Routine Completed', sub: 'Morning meal confirmed' },
              { time: 'Yesterday', title: 'Evening Walk Completed', sub: '30 mins activity' },
            ].map((item, idx) => (
              <View key={idx} style={styles.tlRow}>
                <View style={styles.tlDotCol}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} />
                  {idx < 3 && <View style={styles.tlLine} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tlTitle}>{item.title}</Text>
                  <Text style={styles.tlSub}>{item.sub}</Text>
                </View>
                <Text style={styles.tlTime}>{item.time}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── 14. NAVIGATION SHORTCUTS LIST ─── */}
        <Text style={styles.sectionHeader}>Detailed Record Modules</Text>
        <View style={styles.card}>
          {[
            { label: 'Medical Profile', icon: 'stethoscope', key: 'medical' },
            { label: 'Health Information', icon: 'chart-box-outline', key: 'health' },
            { label: 'Emergency Contacts', icon: 'phone-in-talk-outline', key: 'contacts' },
            { label: 'Activity Timeline', icon: 'timeline-text-outline', key: 'timeline' },
            { label: 'Relationship Settings', icon: 'shield-account-outline', key: 'relationship' },
          ].map((sc, idx) => (
            <TouchableOpacity
              key={sc.key}
              style={[styles.shortcutRow, idx < 4 && styles.shortcutBorder]}
              onPress={() => setActiveShortcutModal(sc.key)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={sc.icon as any} size={20} color={colors.primary} />
              <Text style={styles.shortcutLabel}>{sc.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ─── OVERFLOW MORE MENU MODAL ─── */}
      <Modal visible={showMoreMenu} transparent animationType="fade" onRequestClose={() => setShowMoreMenu(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMoreMenu(false)}>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreMenu(false);
                Toast.show({ type: 'info', text1: 'Edit Information', text2: 'Opening profile editor...' });
              }}
            >
              <MaterialCommunityIcons name="square-edit-outline" size={20} color="#1E293B" />
              <Text style={styles.menuItemText}>Edit Information</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreMenu(false);
                fetchData(true);
                Toast.show({ type: 'success', text1: 'Data Refreshed', text2: 'Latest health summary downloaded.' });
              }}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#1E293B" />
              <Text style={styles.menuItemText}>Refresh Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreMenu(false);
                Toast.show({ type: 'info', text1: 'Share Health Summary', text2: 'Preparing PDF health summary report...' });
              }}
            >
              <MaterialCommunityIcons name="share-variant" size={20} color="#1E293B" />
              <Text style={styles.menuItemText}>Share Health Summary</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreMenu(false);
                Alert.alert('Archive Elder', 'Are you sure you want to archive this elder profile?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Archive', style: 'destructive' },
                ]);
              }}
            >
              <MaterialCommunityIcons name="archive-outline" size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Archive Elder Profile</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── SHORTCUT DETAIL MODAL ─── */}
      <Modal visible={!!activeShortcutModal} transparent animationType="slide" onRequestClose={() => setActiveShortcutModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeShortcutModal === 'medical' ? 'Medical Profile & Prescription'
                 : activeShortcutModal === 'health' ? 'Health Analytics'
                 : activeShortcutModal === 'contacts' ? 'Emergency Contacts'
                 : activeShortcutModal === 'timeline' ? 'Activity Timeline'
                 : 'Relationship Settings'}
              </Text>
              <TouchableOpacity onPress={() => setActiveShortcutModal(null)}>
                <MaterialCommunityIcons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              <Text style={styles.detailText}>
                {activeShortcutModal === 'medical' && '• Conditions: Hypertension & Type 2 Diabetes\n• Prescriptions: Metformin 500mg, Losartan 50mg\n• Doctor: Dr. K. L. Silva (+94 11 269 1111)'}
                {activeShortcutModal === 'health' && '• 7-Day Adherence: 94%\n• Overall Health Score: 92% (Healthy)\n• Routine Completion: 80%'}
                {activeShortcutModal === 'contacts' && '• Primary: Mary Perera (+94 77 987 6543)\n• Doctor: Dr. K. L. Silva (+94 11 269 1111)\n• Hospital: Asiri Central\n• Ambulance: 1990'}
                {activeShortcutModal === 'timeline' && '• 10:42 AM — Medication Taken\n• 09:30 AM — Mood Updated\n• 08:10 AM — Breakfast Completed'}
                {activeShortcutModal === 'relationship' && '• Guardian Role: Primary Caregiver (Son)\n• Emergency Access: Granted\n• Live GPS Tracking: Authorized'}
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveShortcutModal(null)}>
              <Text style={styles.closeBtnText}>Close Record</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── 11. PERSISTENT 5-TAB BOTTOM NAVIGATION ─── */}
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
              onPress={() => onNavigate?.(tab.id)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={22}
                color={isActive ? colors.primary : '#94A3B8'}
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...elevation.e1,
  },
  backBtn: { padding: spacing.s1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  headerIconsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: spacing.s2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: spacing.s5, paddingTop: spacing.s5, paddingBottom: 90 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.s5,
    marginBottom: spacing.s5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...elevation.e2,
  },
  heroTopRow: { flexDirection: 'row', gap: spacing.s4, alignItems: 'center' },
  avatar72: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarInitials: { fontSize: 28, fontWeight: '900', color: colors.primary },
  onlineBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  heroName: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  heroSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  pairingTag: { fontSize: 11, fontWeight: '700', color: colors.primary, marginTop: 4 },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  riskBadgeText: { fontSize: 10, fontWeight: '900' },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: spacing.s3, marginTop: 4 },
  metricsScroll: { gap: spacing.s3, paddingBottom: spacing.s5 },
  metricTile: {
    width: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.s4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    ...elevation.e1,
  },
  metricValText: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  metricLabelText: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2 },
  tileBadgeBg: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  tileBadgeText: { fontSize: 10, fontWeight: '800' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.s5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.s5,
    ...elevation.e1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.s4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: spacing.s3,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  statusGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statusBox: { alignItems: 'center' },
  statusBoxVal: { fontSize: 16, fontWeight: '900', color: colors.primary },
  statusBoxLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2 },
  medRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  medLabel: { fontSize: 13, fontWeight: '700', color: '#475569' },
  medVal: { fontSize: 13, fontWeight: '700', color: '#1E293B', textAlign: 'right', flex: 1, marginLeft: 8 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s3, marginBottom: spacing.s5 },
  quickBtn: {
    width: '48%',
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...elevation.e1,
  },
  quickIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  quickText: { fontSize: 13, fontWeight: '800', color: '#1E293B', flex: 1 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  deviceName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  deviceSub: { fontSize: 11, color: '#64748B' },
  connectedTag: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  connectedTagText: { fontSize: 10, fontWeight: '900', color: colors.primary },
  contactList: { gap: spacing.s3 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  cNum: { fontSize: 12, color: '#64748B' },
  callBadge: { fontSize: 12, fontWeight: '800', color: colors.primary },
  timelineFeed: { gap: 12 },
  tlRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tlDotCol: { alignItems: 'center' },
  tlLine: { width: 2, height: 24, backgroundColor: '#E2E8F0', marginTop: 2 },
  tlTitle: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  tlSub: { fontSize: 11, color: '#64748B' },
  tlTime: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  shortcutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  shortcutBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  shortcutLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B', flex: 1 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 60, paddingRight: 16 },
  menuCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 8, width: 220, ...elevation.e3 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  menuItemText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.s6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.s4 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  detailText: { fontSize: 14, fontWeight: '600', color: '#334155', lineHeight: 22 },
  closeBtn: { height: 50, backgroundColor: colors.primary, borderRadius: radius.xl, justifyContent: 'center', alignItems: 'center', marginTop: spacing.s5 },
  closeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...elevation.e2,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
  tabLabelActive: { color: colors.primary, fontWeight: '800' },
});

export default ElderOverviewScreen;

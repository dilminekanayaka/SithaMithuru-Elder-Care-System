/**
 * GuardianReportDetailsScreen.tsx — Screen G54 (Report Details Viewer & PDF Download)
 * Spec: g54.txt
 *
 * Design Standard: Medisafe, Apple Health, Epic MyChart, NHS App, Samsung Health
 *
 * Screen Mission: Answers "What does this report say about my elder during the selected period?"
 *
 * Healthcare Safety Mandate per g54.txt:
 *  - G54 is the actual report viewing screen.
 *  - Clear report identity (Report Type, Elder Name, Reporting Period, Generated Timestamp).
 *  - Reuses validated domain data (Medication 92%, Risk Green, Emergency 2 events).
 *  - Primary CTA: [Download PDF Report] via reportExportService.
 *
 * Component Architecture per g54.txt:
 *  1. Android safe-area layout.
 *  2. Header Bar (Back button, Dynamic Report Title, Subtitle "Report Details & Export • G54", PDF icon action).
 *  3. Report Identity Header Card (Report Type, Elder Name, Period, Generated Timestamp, READY status).
 *  4. Overall Executive Summary Card (Factual monitoring statement).
 *  5. Report Domain Sections Cards:
 *     - Medication Summary Card (92% Adherence, 2 Missed -> CTA to G50).
 *     - Risk Assessment Card (Current Green, 22 Green / 6 Yellow / 2 Red -> CTA to G51).
 *     - Emergency Response Card (2 Events, 4m 32s Avg Response -> CTA to G52).
 *     - Daily Activity Card (3h 24m Active Daily -> CTA to G43).
 *  6. Report Metadata & Snapshot Audit Box.
 *  7. Primary Action: Download PDF Report Button (Integrated with reportExportService).
 *  8. Data Freshness & Sync Footer.
 *  9. Persistent 5-Tab Bottom Navigation Bar.
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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { reportExporter, ReportData } from '../../services/reportExportService';
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

interface GuardianReportDetailsScreenProps {
  onBack: () => void;
  token?: string;
  reportType?: string | null;
  days?: number;
  elderId?: string | null;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

interface ReportSummary {
  elderName: string;
  elderAge: number | null;
  bloodType: string | null;
  medAdherencePct: number;
  medTaken: number;
  medMissed: number;
  medTotal: number;
  riskCategory: 'Low' | 'Medium' | 'High';
  riskScore: number;
  riskRecommendations: string[];
  emergencyCount: number;
  emergencyResolvedCount: number;
  emergencyAvgResponseMs: number | null;
  emergencyEvents: { date: string; phrase?: string; status: string }[];
}

const GuardianReportDetailsScreen: React.FC<GuardianReportDetailsScreenProps> = ({
  onBack,
  token,
  reportType = 'HEALTH_SUMMARY',
  days = 7,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [summary, setSummary]         = useState<ReportSummary | null>(null);

  const loadData = useCallback(async () => {
    if (!elderId) {
      setLoadError('No elder selected.');
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      const [elderRes, medRes, riskRes, emergencyRes] = await Promise.all([
        apiFetch(`/guardian/elders/${elderId}`, token),
        apiFetch(`/guardian/medications/${elderId}/history?days=${days}`, token),
        apiFetch(`/guardian/risk-profile/${elderId}`, token),
        apiFetch(`/guardian/emergency-logs/${elderId}`, token),
      ]);

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const inRangeLogs: any[] = (emergencyRes || []).filter((l: any) => new Date(l.created_at) >= cutoff);
      const resolvedLogs = inRangeLogs.filter((l: any) => l.resolved_at);
      const responseTimes = resolvedLogs.map((l: any) => new Date(l.resolved_at).getTime() - new Date(l.created_at).getTime());
      const avgMs = responseTimes.length > 0 ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length : null;

      setSummary({
        elderName: elderRes?.name || 'your elder',
        elderAge: elderRes?.age ?? null,
        bloodType: elderRes?.blood_type ?? null,
        medAdherencePct: medRes?.summary?.adherencePct ?? 0,
        medTaken: medRes?.summary?.taken ?? 0,
        medMissed: medRes?.summary?.missed ?? 0,
        medTotal: medRes?.summary?.total ?? 0,
        riskCategory: riskRes?.category || 'Low',
        riskScore: riskRes?.score ?? 0,
        riskRecommendations: riskRes?.recommendations || [],
        emergencyCount: inRangeLogs.length,
        emergencyResolvedCount: inRangeLogs.filter((l: any) => l.status === 'Resolved').length,
        emergencyAvgResponseMs: avgMs,
        emergencyEvents: inRangeLogs.slice(0, 10).map((l: any) => ({
          date: l.created_at,
          phrase: l.triggered_phrase,
          status: l.status,
        })),
      });
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load report data. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, [elderId, days, token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getReportTitle = () => {
    if (reportType === 'MEDICATION') return 'Medication Adherence Report';
    if (reportType === 'RISK') return 'Risk Assessment Report';
    if (reportType === 'EMERGENCY') return 'Emergency Response Report';
    return 'Executive Health Summary Report';
  };

  const formatResponseTime = (ms: number) => {
    const totalSec = Math.round(ms / 1000);
    return `${Math.floor(totalSec / 60)}m ${totalSec % 60}s`;
  };

  const handleDownloadPDF = async () => {
    if (!summary) return;
    Haptics.selectionAsync();
    setDownloading(true);
    try {
      const reportData: ReportData = {
        elderName: summary.elderName,
        elderAge: summary.elderAge,
        bloodType: summary.bloodType,
        reportPeriod: `Last ${days} Days`,
        medicationAdherence: summary.medAdherencePct,
        totalMeds: summary.medTotal,
        takenMeds: summary.medTaken,
        missedMeds: summary.medMissed,
        sosAlertsCount: summary.emergencyCount,
        emergencyLogs: summary.emergencyEvents.map(e => ({
          date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          phrase: e.phrase || 'Emergency SOS Triggered',
          status: e.status,
        })),
      };

      await reportExporter.generateAndSharePDF(reportData);
      Toast.show({
        type: 'success',
        text1: 'PDF Report Downloaded',
        text2: `${getReportTitle()} saved and ready for sharing.`,
      });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: 'Couldn\'t generate PDF report. Please try again.',
      });
    } finally {
      setDownloading(false);
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
          <Text style={styles.headerTitle}>{getReportTitle()}</Text>
          <Text style={styles.headerSubtitle}>Report Details & Export • G54</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleDownloadPDF} disabled={downloading}>
            {downloading ? (
              <ActivityIndicator size="small" color={C.error} />
            ) : (
              <MaterialCommunityIcons name="file-pdf-box" size={24} color={C.error} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        )}

        {!loading && loadError && (
          <View style={styles.card}>
            <MaterialCommunityIcons name="alert-circle-outline" size={40} color={C.textMuted} />
            <Text style={{ marginTop: 8, fontSize: 13, fontWeight: '700', color: C.textPrimary }}>{loadError}</Text>
          </View>
        )}

        {!loading && !loadError && summary && (
          <>
            {/* ─── REPORT IDENTITY HEADER CARD ─── */}
            <View style={styles.identityCard}>
              <View style={styles.badgeRow}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{(reportType || 'HEALTH_SUMMARY').replace('_', ' ')}</Text>
                </View>
              </View>

              <Text style={styles.identityTitle}>{getReportTitle()}</Text>

              <View style={styles.identityMetaRow}>
                <MaterialCommunityIcons name="account-heart" size={16} color={C.primary} />
                <Text style={styles.identityMetaText}>Elder: <Text style={{ fontWeight: '800', color: C.textPrimary }}>{summary.elderName}</Text></Text>
              </View>

              <View style={styles.identityMetaRow}>
                <MaterialCommunityIcons name="calendar-range" size={16} color={C.primary} />
                <Text style={styles.identityMetaText}>Reporting Period: <Text style={{ fontWeight: '800', color: C.textPrimary }}>Last {days} Days</Text></Text>
              </View>
            </View>

            {/* ─── EXECUTIVE REPORT SUMMARY ─── */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="file-document-edit-outline" size={20} color={C.primary} />
                <Text style={styles.cardHeaderTitle}>Executive Overview</Text>
              </View>
              <Text style={styles.summaryText}>
                Medication adherence was <Text style={{ fontWeight: '900', color: C.primary }}>{summary.medAdherencePct}%</Text> during this period ({summary.medMissed} missed doses). Risk status is currently <Text style={{ fontWeight: '900', color: C.primary }}>{summary.riskCategory}</Text> (score {summary.riskScore}/100). {summary.emergencyCount} emergency event{summary.emergencyCount === 1 ? '' : 's'} {summary.emergencyCount === 1 ? 'was' : 'were'} recorded in this period{summary.emergencyAvgResponseMs !== null ? `, with an average response time of ${formatResponseTime(summary.emergencyAvgResponseMs)}` : ''}.
              </Text>
            </View>

            {/* ─── REPORT DOMAIN SECTIONS ─── */}
            <Text style={styles.sectionHeaderTitle}>Detailed Report Sections</Text>

            {/* Section 1: Medication */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="pill" size={20} color={C.primary} />
                <Text style={styles.cardHeaderTitle}>Medication Performance</Text>
              </View>
              <View style={styles.metricRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricVal}>{summary.medAdherencePct}%</Text>
                  <Text style={styles.metricSub}>Adherence</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricVal, { color: C.error }]}>{summary.medMissed}</Text>
                  <Text style={styles.metricSub}>Missed Doses</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricVal}>{summary.medTaken}</Text>
                  <Text style={styles.metricSub}>Taken</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.detailLinkBtn} onPress={() => onNavigate('medicationAnalytics')}>
                <Text style={styles.detailLinkText}>View Full Medication Analytics →</Text>
              </TouchableOpacity>
            </View>

            {/* Section 2: Risk Assessment */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="chart-line-variant" size={20} color={C.primary} />
                <Text style={styles.cardHeaderTitle}>Risk Status Assessment</Text>
              </View>
              <View style={styles.metricRow}>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricVal, { color: C.primary }]}>{summary.riskCategory}</Text>
                  <Text style={styles.metricSub}>Current Category</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricVal}>{summary.riskScore}/100</Text>
                  <Text style={styles.metricSub}>Risk Score</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.detailLinkBtn} onPress={() => onNavigate('riskDashboard')}>
                <Text style={styles.detailLinkText}>View Full Risk Analytics →</Text>
              </TouchableOpacity>
            </View>

            {/* Section 3: Emergency History */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="alert-decagram-outline" size={20} color={C.primary} />
                <Text style={styles.cardHeaderTitle}>Emergency Response</Text>
              </View>
              <View style={styles.metricRow}>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricVal, { color: C.error }]}>{summary.emergencyCount}</Text>
                  <Text style={styles.metricSub}>SOS Triggers</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricVal}>{summary.emergencyAvgResponseMs !== null ? formatResponseTime(summary.emergencyAvgResponseMs) : '—'}</Text>
                  <Text style={styles.metricSub}>Avg Response</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricVal, { color: C.primary }]}>{summary.emergencyCount > 0 ? Math.round((summary.emergencyResolvedCount / summary.emergencyCount) * 100) : 0}%</Text>
                  <Text style={styles.metricSub}>Resolved</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.detailLinkBtn} onPress={() => onNavigate('emergencyAnalytics')}>
                <Text style={styles.detailLinkText}>View Full Emergency Analytics →</Text>
              </TouchableOpacity>
            </View>

            {/* ─── PRIMARY DOWNLOAD PDF BUTTON ─── */}
            <TouchableOpacity style={styles.downloadPdfBtn} onPress={handleDownloadPDF} disabled={downloading} activeOpacity={0.85}>
              {downloading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="file-pdf-box" size={22} color="#FFF" />
                  <Text style={styles.downloadPdfBtnText}>Download PDF Report</Text>
                </>
              )}
            </TouchableOpacity>
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
          const isActive = tab.id === 'reports';
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
  headerTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: C.primary, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: 110 },
  identityCard: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  typeBadge: { backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { fontSize: 9, fontWeight: '900', color: C.primary },
  statusBadge: { backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 9, fontWeight: '900', color: C.primary },
  identityTitle: { fontSize: 20, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  identityMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 3 },
  identityMetaText: { fontSize: 12, color: C.textSecondary },
  card: { backgroundColor: C.card, borderRadius: 24, padding: spacing.s5, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  summaryText: { fontSize: 13, color: C.textSecondary, lineHeight: 20 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, marginBottom: 10 },
  metricRow: { flexDirection: 'row', gap: 10, marginVertical: 8 },
  metricBox: { flex: 1, backgroundColor: C.bg, borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  metricVal: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  metricSub: { fontSize: 10, color: C.textSecondary, marginTop: 2 },
  detailLinkBtn: { marginTop: 8, paddingTop: 4 },
  detailLinkText: { fontSize: 11, fontWeight: '900', color: C.primary },
  metadataCard: { backgroundColor: C.bg, borderRadius: 16, padding: 14, marginBottom: spacing.s4, borderWidth: 1, borderColor: C.border },
  metaTitle: { fontSize: 12, fontWeight: '900', color: C.textPrimary, marginBottom: 6 },
  metaItem: { fontSize: 11, color: C.textSecondary, marginVertical: 2 },
  downloadPdfBtn: { height: 50, backgroundColor: C.error, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginVertical: 4, ...elevation.e2 },
  downloadPdfBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  syncFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginVertical: 12 },
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

export default GuardianReportDetailsScreen;

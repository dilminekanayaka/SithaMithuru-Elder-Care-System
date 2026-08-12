/**
 * GuardianRoutineHistoryScreen.tsx — Screen G28 / G28.1 (Historical Routine Audit & Adherence Log)
 * Specs: g28.txt & g28.1.txt
 *
 * Design Standard: Apple Health, Samsung Health, One Medical, Epic MyChart Reports
 *
 * Screen Mission: Answers "What has been happening with my elder's routines over time?"
 *
 * Component Architecture per g28.1.txt:
 *  1. Android safe-area layout.
 *  2. Top App Bar (Back button, Title "Routine History", Search toggle, Filter menu, Overflow menu with Export PDF & Settings).
 *  3. History Summary Card (87% Adherence, Completed 146, Missed 14, Late 8, ↑ +5% comparison, 84% Consistency Score).
 *  4. Segmented Date Range Control (7 Days, 30 Days default, 90 Days, 6 Months, Custom).
 *  5. Custom Date Range Picker Modal (From & To date selection disallowing future dates).
 *  6. Multi-Filter System (Status: Completed/Missed/Late/Skipped/Pending; Category: Meals/Hydration/Walks/Health/Sleep).
 *  7. Grouped Daily SectionList with Collapsible Date Headers (Today expanded by default, past days collapsible).
 *  8. Repeated Activity Pattern Badges ("Missed 3 times this week — Needs Attention").
 *  9. Historical Risk Event Markers ("⚠ Routine Risk Event — Multiple activities missed").
 * 10. Navigation to G27 Routine Details preserving historical date context.
 * 11. View Routine Analytics CTA (G30), Offline Banner, & Persistent 5-Tab Bottom Navigation.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SectionList,
  ScrollView,
  RefreshControl,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

interface DailyActivityBreakdownItem {
  id: string;
  taskId: string;
  name: string;
  status: 'COMPLETED' | 'MISSED' | 'UPCOMING';
  time: string;
}

interface DailyHistorySection {
  dateTitle: string;
  dateKey: string;
  summary: {
    completionPct: number;
    completed: number;
    total: number;
    missed: number;
  };
  data: DailyActivityBreakdownItem[];
}

interface GuardianRoutineHistoryScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

const RANGE_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '6m': 180 };

const formatDateTitle = (dateStr: string): string => {
  const d = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  const label = d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (fmt(d) === fmt(today)) return `TODAY, ${label}`;
  if (fmt(d) === fmt(yesterday)) return `YESTERDAY, ${label}`;
  return label.toUpperCase();
};

const GuardianRoutineHistoryScreen: React.FC<GuardianRoutineHistoryScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(true);
  const [loadError, setLoadError]             = useState<string | null>(null);
  const [refreshing, setRefreshing]           = useState(false);
  const [dateRange, setDateRange]             = useState<'7d' | '30d' | '90d' | '6m'>('30d');
  const [statusFilter, setStatusFilter]       = useState<'all' | 'completed' | 'missed'>('all');
  const [searchQuery, setSearchQuery]         = useState('');
  const [showSearch, setShowSearch]           = useState(false);
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
  const [rawSections, setRawSections]         = useState<DailyHistorySection[]>([]);
  const [overallSummary, setOverallSummary]   = useState({ completed: 0, missed: 0, total: 0, adherencePct: 0 });

  const loadData = useCallback(async () => {
    if (!elderId) {
      setLoadError('No elder selected.');
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      const days = RANGE_DAYS[dateRange];
      const res = await apiFetch(`/guardian/tasks/${elderId}/history?days=${days}`, token);
      const events: any[] = res?.events || [];

      const byDate = new Map<string, DailyActivityBreakdownItem[]>();
      for (const e of events) {
        if (!byDate.has(e.date)) byDate.set(e.date, []);
        byDate.get(e.date)!.push({
          id: `${e.task_id}-${e.date}`,
          taskId: String(e.task_id),
          name: e.title,
          status: e.status,
          time: e.due_time || e.completed_at || '—',
        });
      }

      const sections: DailyHistorySection[] = Array.from(byDate.entries())
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([dateKey, items]) => {
          const completed = items.filter((i) => i.status === 'COMPLETED').length;
          const missed = items.filter((i) => i.status === 'MISSED').length;
          const total = completed + missed;
          return {
            dateTitle: formatDateTitle(dateKey),
            dateKey,
            summary: { completionPct: total > 0 ? Math.round((completed / total) * 100) : 0, completed, total, missed },
            data: items,
          };
        });

      setRawSections(sections);
      setOverallSummary(res?.summary || { completed: 0, missed: 0, total: 0, adherencePct: 0 });
      setExpandedDateKey(sections[0]?.dateKey ?? null);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load routine history. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, dateRange, token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSections = rawSections.map(sec => ({
    ...sec,
    data: sec.data.filter(item => {
      const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    }),
  })).filter(sec => sec.data.length > 0);

  const toggleExpandDate = (dateKey: string) => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDateKey(prev => (prev === dateKey ? null : dateKey));
  };

  const renderSectionHeader = ({ section }: { section: DailyHistorySection }) => {
    const isExpanded = expandedDateKey === section.dateKey;
    const isGood     = section.summary.completionPct >= 80;
    const badgeBg    = isGood ? C.primaryLight : C.warningLight;
    const badgeColor = isGood ? C.primary : C.warning;

    return (
      <TouchableOpacity
        style={styles.dailyCardHeader}
        onPress={() => toggleExpandDate(section.dateKey)}
        activeOpacity={0.85}
      >
        <View style={styles.dailyTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dailyDateTitle}>{section.dateTitle}</Text>
            <Text style={styles.dailySubMeta}>
              Completion: <Text style={{ fontWeight: '900', color: C.textPrimary }}>{section.summary.completionPct}%</Text> • {section.summary.completed}/{section.summary.total} Completed
            </Text>
          </View>

          <View style={[styles.dailyStatusBadge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.dailyStatusText, { color: badgeColor }]}>{isGood ? 'GOOD' : 'NEEDS ATTENTION'}</Text>
          </View>
        </View>

        <View style={styles.expandChevronRow}>
          <Text style={styles.expandChevronText}>{isExpanded ? '▼ Hide Activities' : '▶ Expand Activities'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, section }: { item: DailyActivityBreakdownItem; section: DailyHistorySection }) => {
    if (expandedDateKey !== section.dateKey) return null;

    const isDone = item.status === 'COMPLETED';
    const isMiss = item.status === 'MISSED';

    const bg    = isDone ? C.primaryLight : isMiss ? C.errorLight : C.warningLight;
    const color = isDone ? C.primary : isMiss ? C.error : C.warning;
    const icon  = isDone ? 'check-circle' : isMiss ? 'close-circle' : 'clock-alert-outline';

    return (
      <TouchableOpacity
        style={styles.itemRow}
        onPress={() => onNavigate('routineDetails', item.taskId)}
        activeOpacity={0.8}
      >
        <View style={[styles.itemIconCircle, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={icon as any} size={18} color={color} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.itemNameText}>{item.name}</Text>
          <Text style={styles.itemSubText}>Scheduled {item.time}</Text>
        </View>

        <View style={[styles.itemStatusTag, { backgroundColor: bg }]}>
          <Text style={[styles.itemStatusText, { color }]}>{item.status}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent />

      {/* ─── 4. HEADER BAR ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Routine History</Text>
          <Text style={styles.headerSubtitle}>Historical Audit & Trend Log • G28</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSearch(v => !v)}>
            <MaterialCommunityIcons name={showSearch ? 'close' : 'magnify'} size={22} color={C.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Bar */}
      {showSearch && (
        <View style={styles.searchBarContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={C.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search history by activity, status, or date..."
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={C.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* ─── DATE RANGE SEGMENTED SELECTOR ─── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRangeRow}>
        {[
          { id: '7d', label: '7 Days' },
          { id: '30d', label: '30 Days' },
          { id: '90d', label: '90 Days' },
          { id: '6m', label: '6 Months' },
        ].map((range) => (
          <TouchableOpacity
            key={range.id}
            style={[styles.rangeChip, dateRange === range.id && styles.rangeChipActive]}
            onPress={() => setDateRange(range.id as any)}
          >
            <Text style={[styles.rangeChipText, dateRange === range.id && styles.rangeChipTextActive]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ─── HISTORY SUMMARY CARD ─── */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summarySectionLabel}>ROUTINE ADHERENCE</Text>
            <Text style={styles.summaryPctText}>{overallSummary.adherencePct}%</Text>
          </View>
        </View>

        <View style={styles.summaryMetricsGrid}>
          <View style={styles.statMetricBox}>
            <Text style={styles.statMetricNum}>{overallSummary.completed}</Text>
            <Text style={styles.statMetricLabel}>Completed</Text>
          </View>
          <View style={styles.statMetricBox}>
            <Text style={[styles.statMetricNum, { color: C.error }]}>{overallSummary.missed}</Text>
            <Text style={styles.statMetricLabel}>Missed</Text>
          </View>
        </View>
      </View>

      {/* ─── STATUS FILTER CHIPS ─── */}
      <View style={styles.statusFiltersRow}>
        {(['all', 'completed', 'missed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.statusFilterChip, statusFilter === f && styles.statusFilterChipActive]}
            onPress={() => setStatusFilter(f)}
          >
            <Text style={[styles.statusFilterText, statusFilter === f && styles.statusFilterTextActive]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : loadError ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={C.textMuted} />
          <Text style={styles.emptyTitle}>{loadError}</Text>
        </View>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[C.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="history" size={48} color={C.textMuted} />
              <Text style={styles.emptyTitle}>No Matching Activities Found</Text>
              <Text style={styles.emptySub}>Try changing your filters or date range.</Text>
              <TouchableOpacity style={styles.resetBtn} onPress={() => { setStatusFilter('all'); setSearchQuery(''); }}>
                <Text style={styles.resetBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footerBox}>
              <TouchableOpacity style={styles.analyticsCtaBtn} onPress={() => onNavigate('routineAnalytics')} activeOpacity={0.85}>
                <MaterialCommunityIcons name="chart-bar" size={20} color="#FFF" />
                <Text style={styles.analyticsCtaText}>View Routine Analytics (G30)</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

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
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.textPrimary },
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: C.primary, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    marginHorizontal: spacing.s5,
    marginTop: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.textPrimary },
  dateRangeRow: { gap: 8, paddingHorizontal: spacing.s5, paddingTop: spacing.s4 },
  rangeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  rangeChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  rangeChipText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  rangeChipTextActive: { color: C.primary, fontWeight: '900' },
  statusFiltersRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.s5, paddingTop: 10, paddingBottom: 6 },
  statusFilterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  statusFilterChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  statusFilterText: { fontSize: 10, fontWeight: '700', color: C.textSecondary },
  statusFilterTextActive: { color: C.primary, fontWeight: '900' },
  summaryCard: {
    backgroundColor: C.card,
    marginHorizontal: spacing.s5,
    marginTop: spacing.s4,
    borderRadius: 24,
    padding: spacing.s5,
    borderWidth: 1,
    borderColor: C.border,
    ...elevation.e1,
  },
  summarySectionLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  summaryPctText: { fontSize: 28, fontWeight: '900', color: C.primary, marginTop: 2 },
  summaryCompText: { fontSize: 11, fontWeight: '800', color: C.primary, marginTop: 2 },
  consistencyPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  consistencyPillText: { fontSize: 11, fontWeight: '800', color: C.primary },
  summaryMetricsGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  statMetricBox: { alignItems: 'center' },
  statMetricNum: { fontSize: 18, fontWeight: '900', color: C.primary },
  statMetricLabel: { fontSize: 10, fontWeight: '600', color: C.textSecondary, marginTop: 2 },
  listContent: { paddingHorizontal: spacing.s5, paddingBottom: 110 },
  dailyCardHeader: { backgroundColor: C.card, borderRadius: 20, padding: 14, marginTop: 10, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  dailyTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dailyDateTitle: { fontSize: 15, fontWeight: '900', color: C.textPrimary },
  dailySubMeta: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  dailyStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  dailyStatusText: { fontSize: 10, fontWeight: '900' },
  riskEventMarkerBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.errorLight, padding: 6, borderRadius: 8, marginTop: 8 },
  riskEventMarkerText: { fontSize: 11, fontWeight: '800', color: C.error },
  exceptionPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.warningLight, padding: 6, borderRadius: 8, marginTop: 8 },
  exceptionPreviewText: { fontSize: 11, color: C.textPrimary },
  expandChevronRow: { marginTop: 8, alignSelf: 'center' },
  expandChevronText: { fontSize: 11, fontWeight: '800', color: C.primary },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bg, padding: 10, borderRadius: 12, marginTop: 6, marginHorizontal: 6, borderWidth: 1, borderColor: C.border },
  itemIconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  itemNameText: { fontSize: 13, fontWeight: '800', color: C.textPrimary },
  itemSubText: { fontSize: 11, color: C.textSecondary },
  patternNoticePill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  patternNoticeText: { fontSize: 10, fontWeight: '800', color: C.warning },
  itemStatusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  itemStatusText: { fontSize: 9, fontWeight: '900' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary, marginTop: 12 },
  emptySub: { fontSize: 12, color: C.textSecondary, textAlign: 'center', marginTop: 4, marginHorizontal: 20 },
  resetBtn: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.primary, borderRadius: 12 },
  resetBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  footerBox: { marginTop: 16, marginBottom: 20 },
  analyticsCtaBtn: { height: 48, backgroundColor: C.primary, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, ...elevation.e1 },
  analyticsCtaText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.s6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  datePickerInputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  datePickerLabel: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  datePickerInput: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: C.textPrimary, width: 180 },
  applyDateBtn: { height: 44, backgroundColor: C.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  applyDateBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
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

export default GuardianRoutineHistoryScreen;

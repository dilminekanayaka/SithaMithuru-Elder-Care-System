/**
 * GuardianWellbeingHistoryScreen.tsx — Screen G34 (Well-being History Audit Log)
 * Spec: g34.txt
 *
 * Design Standard: Apple Health, Samsung Health, One Medical, Epic MyChart
 *
 * Screen Mission: Answers "What has been happening with my elder's well-being over time?"
 *
 * Component Architecture per g34.txt:
 *  1. Android safe-area layout.
 *  2. Top App Bar (Back button, Title "Well-being History", Subtitle "Chronological Audit Trail • G34", Search, Filter, Overflow menu).
 *  3. Date Range Segmented Selector (7 Days, 30 Days default, 90 Days, 6 Months, 1 Year, Custom Date).
 *  4. Custom Date Range Picker Modal (Disallowing future dates).
 *  5. Horizontal Mood Filter Bar (ALL, VERY GOOD, GOOD, OKAY, LOW, VERY LOW).
 *  6. Grouped SectionList by Month & Date (Daily summary, completed cards, low mood cards, missed check-ins, historical risk markers).
 *  7. Tap Navigation to G33 Check-in Details preserving selected check-in context.
 *  8. Filter Bottom Sheet Modal (Mood, Completion status, Risk events).
 *  9. Offline Banner & Persistent 5-Tab Bottom Navigation.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SectionList,
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

interface WellbeingHistorySection {
  dateTitle: string;
  dateKey: string;
  data: MoodHistoryEntry[];
}

interface GuardianWellbeingHistoryScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: string | null;
  onNavigate?: (screen: string, payload?: any) => void;
  onSessionExpired?: () => void;
}

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

const GuardianWellbeingHistoryScreen: React.FC<GuardianWellbeingHistoryScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate = () => {},
  onSessionExpired,
}) => {
  const [loading, setLoading]                 = useState(true);
  const [loadError, setLoadError]             = useState<string | null>(null);
  const [refreshing, setRefreshing]           = useState(false);
  const [moodFilter, setMoodFilter]           = useState<string>('ALL');
  const [searchQuery, setSearchQuery]         = useState('');
  const [showSearch, setShowSearch]           = useState(false);
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
  const [rawSections, setRawSections]         = useState<WellbeingHistorySection[]>([]);

  const loadData = useCallback(async () => {
    if (!elderId) {
      setLoadError('No elder selected.');
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      const res = await apiFetch(`/mood/elder/${elderId}`, token);
      const history: MoodHistoryEntry[] = res?.history || [];

      const byDate = new Map<string, MoodHistoryEntry[]>();
      for (const h of history) {
        if (!byDate.has(h.date)) byDate.set(h.date, []);
        byDate.get(h.date)!.push(h);
      }
      const sections: WellbeingHistorySection[] = Array.from(byDate.entries())
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([dateKey, items]) => ({ dateTitle: formatDateTitle(dateKey), dateKey, data: items }));

      setRawSections(sections);
      setExpandedDateKey(sections[0]?.dateKey ?? null);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setLoadError('Failed to load well-being history. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, token, onSessionExpired]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSections = rawSections.map(sec => ({
    ...sec,
    data: sec.data.filter(item => {
      const matchesSearch = !searchQuery || item.mood_type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMood = moodFilter === 'ALL' || item.mood_type === moodFilter;
      return matchesSearch && matchesMood;
    }),
  })).filter(sec => sec.data.length > 0);

  const toggleExpandDate = (dateKey: string) => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDateKey(prev => (prev === dateKey ? null : dateKey));
  };

  const renderSectionHeader = ({ section }: { section: WellbeingHistorySection }) => {
    const isExpanded = expandedDateKey === section.dateKey;

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
              {section.data.length} Check-in{section.data.length === 1 ? '' : 's'}
            </Text>
          </View>

          <View style={[styles.dailyStatusBadge, { backgroundColor: C.primaryLight }]}>
            <Text style={[styles.dailyStatusText, { color: C.primary }]}>RECORDED ✓</Text>
          </View>
        </View>

        <View style={styles.expandChevronRow}>
          <Text style={styles.expandChevronText}>{isExpanded ? '▼ Hide Check-ins' : '▶ Expand Check-ins'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, section }: { item: MoodHistoryEntry; section: WellbeingHistorySection }) => {
    if (expandedDateKey !== section.dateKey) return null;

    const isLow = item.mood_type === 'Sad' || item.mood_type === 'Anxious' || item.mood_type === 'Angry';
    const bg    = isLow ? C.warningLight : C.primaryLight;

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => onNavigate('wellbeingCheckinDetails', item.id)}
        activeOpacity={0.85}
      >
        <View style={styles.itemTopRow}>
          <View style={[styles.emojiBox, { backgroundColor: bg }]}>
            <Text style={{ fontSize: 24 }}>{MOOD_EMOJI[item.mood_type] || '😐'}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.itemMoodTitle}>{item.mood_type}</Text>
            <Text style={styles.itemTimeSub}>{new Date(item.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>

          <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
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
          <Text style={styles.headerTitle}>Well-being History</Text>
          <Text style={styles.headerSubtitle}>Chronological Audit Trail • G34</Text>
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
            placeholder="Search check-ins by mood, response, or date..."
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

      {/* ─── MOOD FILTER BAR CHIPS ─── */}
      <View style={styles.moodFilterRow}>
        {(['ALL', 'Happy', 'Neutral', 'Sad', 'Anxious', 'Angry']).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.moodChip, moodFilter === m && styles.moodChipActive]}
            onPress={() => setMoodFilter(m)}
          >
            <Text style={[styles.moodChipText, moodFilter === m && styles.moodChipTextActive]}>
              {m}
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
          keyExtractor={(item) => String(item.id)}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[C.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="history" size={48} color={C.textMuted} />
              <Text style={styles.emptyTitle}>No Matching Well-being Records</Text>
              <Text style={styles.emptySub}>Try changing your filters, or check back after your elder logs a mood.</Text>
              <TouchableOpacity style={styles.resetBtn} onPress={() => { setMoodFilter('ALL'); setSearchQuery(''); }}>
                <Text style={styles.resetBtnText}>Clear Filters</Text>
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
  moodFilterRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.s5, paddingTop: 10, paddingBottom: 6 },
  moodChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  moodChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  moodChipText: { fontSize: 11, fontWeight: '700', color: C.textSecondary },
  moodChipTextActive: { color: C.primary, fontWeight: '900' },
  listContent: { paddingHorizontal: spacing.s5, paddingBottom: 110 },
  dailyCardHeader: { backgroundColor: C.card, borderRadius: 20, padding: 14, marginTop: 10, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  dailyTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dailyDateTitle: { fontSize: 15, fontWeight: '900', color: C.textPrimary },
  dailySubMeta: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  dailyStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  dailyStatusText: { fontSize: 10, fontWeight: '900' },
  expandChevronRow: { marginTop: 8, alignSelf: 'center' },
  expandChevronText: { fontSize: 11, fontWeight: '800', color: C.primary },
  itemCard: { backgroundColor: C.card, borderRadius: 16, padding: 12, marginTop: 6, marginHorizontal: 4, borderWidth: 1, borderColor: C.border, ...elevation.e1 },
  itemCardMissed: { backgroundColor: C.errorLight, borderColor: C.error },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emojiBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  itemMoodTitle: { fontSize: 15, fontWeight: '900', color: C.textPrimary },
  itemTimeSub: { fontSize: 11, color: C.textSecondary, marginTop: 1 },
  patternText: { fontSize: 11, color: C.textSecondary, marginTop: 6 },
  riskMarkerBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.warningLight, padding: 6, borderRadius: 8, marginTop: 6 },
  riskMarkerText: { fontSize: 10, fontWeight: '800', color: C.warning },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary, marginTop: 12 },
  emptySub: { fontSize: 12, color: C.textSecondary, textAlign: 'center', marginTop: 4, marginHorizontal: 20 },
  resetBtn: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.primary, borderRadius: 12 },
  resetBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
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

export default GuardianWellbeingHistoryScreen;

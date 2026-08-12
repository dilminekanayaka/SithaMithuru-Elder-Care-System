/**
 * MedicationHistoryScreen.tsx — Screen ELDER-S14 (Medication History Screen)
 * Spec: es14.txt
 *
 * Requirements (es14.txt):
 *  1. Read-Only Mandate: Adherence audit log (No editing, deleting, or manual conversion of missed records).
 *  2. Header: Back arrow (←), Title "Medication History".
 *  3. Medication Banner: 💊 Medication Name (e.g. Morning Medicine) & Dose (1 Tablet / 5 mg).
 *  4. Month Navigation Controls: "< August 2026 >" (Next disabled if current month reached).
 *  5. Factual Adherence Summary: "27 of 29 doses marked as taken" (No confusing clinical percentage score).
 *  6. Chronological Date Grouping: TODAY, YESTERDAY, 08 AUGUST, 07 AUGUST.
 *  7. Log Record Item:
 *     - Taken: ✓ 8:05 AM | Taken | Scheduled for 8:00 AM (Green check badge)
 *     - Missed: ! 8:00 AM | Not marked as taken | Scheduled for 8:00 AM (Amber warning badge)
 *  8. Pagination: [ Load Older ] button at list end.
 *  9. Empty State: "No history yet. Your medication history will appear here after your first scheduled dose."
 * 10. 100% Offline-First
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

export interface MedicationHistoryRecord {
  id: string;
  scheduledTime: string;
  actualTime?: string;
  status: 'TAKEN' | 'MISSED';
  dateLabel: string;
  group: 'TODAY' | 'YESTERDAY' | 'EARLIER';
  medicationName?: string;
}

interface MedicationHistoryProps {
  onBack: () => void;
  elderId?: string | number;
  token?: string;
  medicationId?: string;
  medicationName?: string;
  medicationDose?: string;
}

const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const MedicationHistoryScreen: React.FC<MedicationHistoryProps> = ({
  onBack,
  elderId,
  token,
  medicationId,
  medicationName,
  medicationDose,
}) => {
  const [records, setRecords] = useState<MedicationHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        if (!elderId || !token) return;
        const { apiFetch } = require('../../services/api');
        const res = await apiFetch(`/guardian/medications/${elderId}/history?days=30`, token);
        let events: any[] = Array.isArray(res?.events) ? res.events : [];

        if (medicationId) {
          events = events.filter((e) => String(e.medication_id) === String(medicationId));
        }
        events = events.filter((e) => e.status === 'TAKEN' || e.status === 'MISSED');

        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        const mapped: MedicationHistoryRecord[] = events.map((e) => ({
          id: `${e.medication_id}_${e.date}`,
          scheduledTime: e.scheduled_time || 'Any time',
          actualTime: e.taken_at || undefined,
          status: e.status === 'TAKEN' ? 'TAKEN' : 'MISSED',
          dateLabel:
            e.date === todayStr
              ? 'Today'
              : e.date === yesterdayStr
              ? 'Yesterday'
              : new Date(e.date).toLocaleDateString('en-US', { day: '2-digit', month: 'long' }).toUpperCase(),
          group: e.date === todayStr ? 'TODAY' : e.date === yesterdayStr ? 'YESTERDAY' : 'EARLIER',
          medicationName: e.name,
        }));
        setRecords(mapped);
      } catch (e) {
        console.warn('Failed to load medication history:', e);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [elderId, token, medicationId]);

  const takenCount = records.filter((r) => r.status === 'TAKEN').length;
  const totalCount = records.length;

  useEffect(() => {
    if (!loading) {
      AccessibilityInfo.announceForAccessibility(
        `Medication History. ${takenCount} of ${totalCount} doses marked as taken in ${currentMonthName}.`
      );
    }
  }, [takenCount, totalCount, loading]);

  const todayItems = records.filter((r) => r.group === 'TODAY');
  const yesterdayItems = records.filter((r) => r.group === 'YESTERDAY');
  const earlierItems = records.filter((r) => r.group === 'EARLIER').slice(0, visibleCount);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es14.txt Section 1 & 4) ─── */}
      <ScreenHeader title="Medication History" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── MEDICATION NAME BANNER (es14.txt Section 4) ─── */}
        <View style={styles.medBanner}>
          <View style={styles.medIconBox}>
            <MaterialCommunityIcons name="pill" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.medNameText}>{medicationName || 'All Medications'}</Text>
            {medicationDose ? <Text style={styles.medDoseText}>{medicationDose}</Text> : null}
          </View>
        </View>

        {/* ─── CURRENT PERIOD LABEL ───
             History is sourced from the last 30 days of real doses (backend has
             no month-scoped query), so month-to-month browsing isn't backed by
             any real data and was removed rather than faked. */}
        <View style={styles.monthSelectorRow}>
          <Text style={styles.monthLabelText}>{currentMonthName}</Text>
        </View>

        {/* ─── FACTUAL ADHERENCE SUMMARY (es14.txt Section 5 & 20) ─── */}
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="chart-box-outline" size={22} color={colors.success} style={{ marginRight: 10 }} />
          <Text style={styles.summaryText}>
            <Text style={{ fontWeight: '800', color: colors.success }}>{takenCount} of {totalCount} doses</Text> marked as taken
          </Text>
        </View>

        {records.length === 0 && !loading ? (
          /* ─── 17. EMPTY STATE ─── */
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="pill" size={48} color={colors.text.tertiary} />
            </View>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptySubtitle}>
              Your medication history will appear here after your first scheduled dose.
            </Text>
          </View>
        ) : (
          <>
            {/* ─── TODAY GROUP ─── */}
            {todayItems.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.groupLabel}>TODAY</Text>
                {todayItems.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: item.status === 'TAKEN' ? colors.successContainer : colors.warningContainer },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={item.status === 'TAKEN' ? 'check' : 'alert'}
                          size={18}
                          color={item.status === 'TAKEN' ? colors.success : colors.warning}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.timeStatusRow}>
                          <Text style={styles.actualTimeText}>
                            {item.status === 'TAKEN' ? item.actualTime : 'Not marked as taken'}
                          </Text>
                          <Text
                            style={[
                              styles.statusLabel,
                              { color: item.status === 'TAKEN' ? colors.success : colors.warning },
                            ]}
                          >
                            {item.status === 'TAKEN' ? 'Taken' : 'Missed'}
                          </Text>
                        </View>
                        <Text style={styles.scheduledTimeText}>Scheduled for {item.scheduledTime}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ─── YESTERDAY GROUP ─── */}
            {yesterdayItems.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.groupLabel}>YESTERDAY</Text>
                {yesterdayItems.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: item.status === 'TAKEN' ? colors.successContainer : colors.warningContainer },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={item.status === 'TAKEN' ? 'check' : 'alert'}
                          size={18}
                          color={item.status === 'TAKEN' ? colors.success : colors.warning}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.timeStatusRow}>
                          <Text style={styles.actualTimeText}>
                            {item.status === 'TAKEN' ? item.actualTime : 'Not marked as taken'}
                          </Text>
                          <Text
                            style={[
                              styles.statusLabel,
                              { color: item.status === 'TAKEN' ? colors.success : colors.warning },
                            ]}
                          >
                            {item.status === 'TAKEN' ? 'Taken' : 'Missed'}
                          </Text>
                        </View>
                        <Text style={styles.scheduledTimeText}>Scheduled for {item.scheduledTime}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ─── EARLIER RECORDS ─── */}
            {earlierItems.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.groupLabel}>EARLIER</Text>
                {earlierItems.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <Text style={styles.itemDateHeader}>{item.dateLabel}</Text>
                    <View style={styles.cardHeaderRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: item.status === 'TAKEN' ? colors.successContainer : colors.warningContainer },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={item.status === 'TAKEN' ? 'check' : 'alert'}
                          size={18}
                          color={item.status === 'TAKEN' ? colors.success : colors.warning}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.timeStatusRow}>
                          <Text style={styles.actualTimeText}>
                            {item.status === 'TAKEN' ? item.actualTime : 'Not marked as taken'}
                          </Text>
                          <Text
                            style={[
                              styles.statusLabel,
                              { color: item.status === 'TAKEN' ? colors.success : colors.warning },
                            ]}
                          >
                            {item.status === 'TAKEN' ? 'Taken' : 'Missed'}
                          </Text>
                        </View>
                        <Text style={styles.scheduledTimeText}>Scheduled for {item.scheduledTime}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ─── 18. PAGINATION BUTTON [ LOAD OLDER ] ─── */}
            {visibleCount < records.filter((r) => r.group === 'EARLIER').length && (
              <TouchableOpacity
                style={styles.loadOlderBtn}
                onPress={() => setVisibleCount((prev) => prev + 5)}
              >
                <Text style={styles.loadOlderBtnText}>Load Older</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4 || 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s4 || 16,
    paddingBottom: spacing.s8 || 32,
  },
  medBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  medIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  medNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  medDoseText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  monthSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  monthArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  monthLabelText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    borderRadius: radius.lg || 16,
    padding: 14,
    marginBottom: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.status.taken.border,
  },
  summaryText: {
    fontSize: 14,
    color: colors.successDark,
  },
  groupSection: {
    marginBottom: spacing.s4 || 16,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s3 || 12,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  itemDateHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timeStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actualTimeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  scheduledTimeText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  loadOlderBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    height: 48,
    borderRadius: 16,
    marginTop: 8,
    gap: 6,
  },
  loadOlderBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});

export default MedicationHistoryScreen;

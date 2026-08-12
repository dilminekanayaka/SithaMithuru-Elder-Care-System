/**
 * MoodHistoryScreen.tsx — Screen ELDER-S20 (Mood History Screen)
 * Spec: es20.txt
 *
 * Requirements (es20.txt):
 *  1. Read-Only Mandate: Emotional journey audit log (No editing, deleting, or clinical diagnosis).
 *  2. Header: Back arrow (←), Title "Mood History".
 *  3. Month Navigation Controls: "< August 2026 >" (Next disabled if current month reached).
 *  4. Factual Summary Card: "18 mood check-ins" (No diagnostic percentage score).
 *  5. Chronological Date Grouping: TODAY, 09 AUGUST, 08 AUGUST, 07 AUGUST.
 *  6. Mood Entry Card:
 *     - Emoji Icon (😊 / 😐 / 😔 / 😟 / 😴 / 😄)
 *     - Mood Label (Happy, Okay, Sad, Worried, Tired, Excited)
 *     - Date & Time (e.g. 10 August • 10:30 AM)
 *     - Optional User Note in quotes (e.g. "I miss my daughter today."). Hide if empty.
 *  7. Empty State: "No mood history yet. Your mood check-ins will appear here." + [ CHECK IN NOW ]
 *  8. 100% Offline-First
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

export interface MoodHistoryRecord {
  id: string;
  mood: 'Happy' | 'Okay' | 'Sad' | 'Worried' | 'Tired' | 'Excited';
  emoji: string;
  dateStr: string;
  timeStr: string;
  note?: string;
  group: 'TODAY' | 'EARLIER';
  color: string;
  accent: string;
}

interface MoodHistoryProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  elderId?: string | number;
  token?: string;
}

// Mirrors MoodScreen.tsx's MOOD_OPTIONS exactly — mood_type is written to the
// backend using these title-case labels, so history lookups must key off the
// same values to render the right emoji/color per entry.
const MOOD_STYLE: Record<string, { emoji: string; color: string; accent: string }> = {
  Happy: { emoji: '😊', color: colors.successContainer, accent: colors.success },
  Okay: { emoji: '😐', color: colors.warningContainer, accent: colors.warning },
  Sad: { emoji: '😔', color: colors.primaryContainer, accent: colors.primary },
  Worried: { emoji: '😟', color: colors.category.journal.bg, accent: colors.category.journal.accent },
  Tired: { emoji: '😴', color: colors.surfaceVariant, accent: colors.text.secondary },
  Excited: { emoji: '😄', color: colors.errorContainer, accent: colors.error },
};

const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const MoodHistoryScreen: React.FC<MoodHistoryProps> = ({ onBack, onNavigate = () => {}, elderId, token }) => {
  const [records, setRecords] = useState<MoodHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const { getDB } = require('../../database/db');
        const { apiFetch } = require('../../services/api');
        const db = await getDB();

        const localMoods: any[] = await db.getAllAsync(
          'SELECT * FROM mood_logs_offline WHERE elder_id = ? OR elder_id = ? ORDER BY action_timestamp DESC',
          [elderId ? String(elderId) : 'elder_default', 'elder_default']
        );

        let rows: any[] = localMoods.map((m) => ({
          id: String(m.id),
          mood_type: m.mood_type,
          notes: m.notes || null,
          created_at: m.action_timestamp || m.logged_date,
        }));

        if (elderId && token) {
          try {
            const res = await apiFetch(`/mood/elder/${elderId}`, token);
            if (res && Array.isArray(res.history)) {
              rows = res.history;
            }
          } catch {
            // Fallback to SQLite cache
          }
        }

        const todayDate = new Date().toISOString().split('T')[0];
        const mapped: MoodHistoryRecord[] = rows.map((r) => {
          const style = MOOD_STYLE[r.mood_type] || MOOD_STYLE.Okay;
          const created = r.created_at ? new Date(r.created_at) : new Date();
          const entryDate = r.date || created.toISOString().split('T')[0];
          return {
            id: String(r.id),
            mood: r.mood_type,
            emoji: style.emoji,
            dateStr: created.toLocaleDateString('en-US', { day: '2-digit', month: 'long' }),
            timeStr: created.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            note: r.notes || undefined,
            group: entryDate === todayDate ? 'TODAY' : 'EARLIER',
            color: style.color,
            accent: style.accent,
          };
        });
        setRecords(mapped);
      } catch (e) {
        console.warn('Failed to load mood history:', e);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [elderId, token]);

  const totalCount = records.length;

  useEffect(() => {
    if (!loading) {
      AccessibilityInfo.announceForAccessibility(
        `Mood History. ${totalCount} mood check-ins recorded in ${currentMonthName}.`
      );
    }
  }, [totalCount, loading]);

  const todayItems = records.filter((r) => r.group === 'TODAY');
  const earlierItems = records.filter((r) => r.group === 'EARLIER');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es20.txt Section 1 & 2) ─── */}
      <ScreenHeader title="Mood History" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── CURRENT PERIOD LABEL ───
             Note: history is sourced from the last 7 days of real check-ins
             (backend has no month-scoped query), so month-to-month browsing
             isn't backed by any real data and was removed rather than faked. */}
        <View style={styles.monthSelectorRow}>
          <Text style={styles.monthLabelText}>{currentMonthName}</Text>
        </View>

        {/* ─── FACTUAL SUMMARY CARD (es20.txt Section 11 & 568) ─── */}
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="heart-outline" size={22} color={colors.primary} style={{ marginRight: 10 }} />
          <Text style={styles.summaryText}>
            <Text style={{ fontWeight: '800', color: colors.primary }}>{totalCount} mood check-ins</Text> recorded
          </Text>
        </View>

        {records.length === 0 && !loading ? (
          /* ─── 15. EMPTY STATE ─── */
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🙂</Text>
            <Text style={styles.emptyTitle}>No mood history yet</Text>
            <Text style={styles.emptySubtitle}>Your mood check-ins will appear here.</Text>
            <TouchableOpacity
              style={styles.emptyCtaBtn}
              onPress={() => onNavigate('mood')}
            >
              <Text style={styles.emptyCtaBtnText}>CHECK IN NOW</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ─── TODAY GROUP ─── */}
            {todayItems.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.groupLabel}>TODAY</Text>
                {todayItems.map((item) => (
                  <View key={item.id} style={[styles.card, { backgroundColor: item.color }]}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.emojiText}>{item.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.moodNameText, { color: item.accent }]}>{item.mood}</Text>
                        <Text style={styles.dateTimeText}>
                          {item.dateStr} • {item.timeStr}
                        </Text>
                      </View>
                    </View>

                    {item.note ? (
                      <View style={styles.noteBox}>
                        <Text style={styles.noteText}>"{item.note}"</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            {/* ─── EARLIER GROUP ─── */}
            {earlierItems.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.groupLabel}>EARLIER</Text>
                {earlierItems.map((item) => (
                  <View key={item.id} style={[styles.card, { backgroundColor: item.color }]}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.emojiText}>{item.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.moodNameText, { color: item.accent }]}>{item.mood}</Text>
                        <Text style={styles.dateTimeText}>
                          {item.dateStr} • {item.timeStr}
                        </Text>
                      </View>
                    </View>

                    {item.note ? (
                      <View style={styles.noteBox}>
                        <Text style={styles.noteText}>"{item.note}"</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
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
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.lg || 16,
    padding: 14,
    marginBottom: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
  },
  summaryText: {
    fontSize: 14,
    color: colors.primaryDark,
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
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s3 || 12,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 40,
    marginRight: 14,
  },
  moodNameText: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  dateTimeText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  noteBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  noteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.text.primary,
    lineHeight: 20,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
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
    marginBottom: 24,
  },
  emptyCtaBtn: {
    height: 52,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCtaBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
  },
});

export default MoodHistoryScreen;

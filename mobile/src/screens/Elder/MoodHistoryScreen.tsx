import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { colors, typography, spacing, radius, elevation } from "../../theme";

export interface MoodLogItem {
  id: string;
  mood: string;
  date: string;
  dayName: string;
  time: string;
  notes?: string;
}

interface MoodHistoryScreenProps {
  onBack: () => void;
  elderId?: number;
  token?: string;
  initialLogs?: MoodLogItem[];
}

const SAMPLE_MOOD_LOGS: MoodLogItem[] = [
  {
    id: "1",
    mood: "Happy",
    date: "2026-07-31",
    dayName: "Friday",
    time: "08:30 AM",
    notes: "Had a peaceful morning walk in the garden.",
  },
  {
    id: "2",
    mood: "Happy",
    date: "2026-07-30",
    dayName: "Thursday",
    time: "07:15 PM",
    notes: "Spoke with my son Dilmin over video call.",
  },
  {
    id: "3",
    mood: "Neutral",
    date: "2026-07-29",
    dayName: "Wednesday",
    time: "01:00 PM",
    notes: "Resting after lunch.",
  },
  {
    id: "4",
    mood: "Anxious",
    date: "2026-07-28",
    dayName: "Tuesday",
    time: "09:45 AM",
    notes: "Felt slightly dizzy before taking morning blood pressure medicine.",
  },
  {
    id: "5",
    mood: "Sad",
    date: "2026-07-27",
    dayName: "Monday",
    time: "04:20 PM",
    notes: "Missed family dinner yesterday.",
  },
  {
    id: "6",
    mood: "Happy",
    date: "2026-07-26",
    dayName: "Sunday",
    time: "11:00 AM",
    notes: "Listened to classic Sinhala songs.",
  },
];

const getMoodConfig = (mood: string) => {
  switch (mood) {
    case "Happy":
      return {
        icon: "emoticon-happy-outline",
        color: "#D4F5E9",
        accent: "#27AE60",
        label: "Happy",
        category: "positive",
      };
    case "Neutral":
      return {
        icon: "emoticon-neutral-outline",
        color: "#FFF5D6",
        accent: "#F39C12",
        label: "Neutral",
        category: "neutral",
      };
    case "Sad":
      return {
        icon: "emoticon-sad-outline",
        color: "#EBF2FF",
        accent: "#2D8CFF",
        label: "Sad",
        category: "attention",
      };
    case "Anxious":
      return {
        icon: "emoticon-worried-outline",
        color: "#FFF0E5",
        accent: "#FF7F50",
        label: "Anxious",
        category: "attention",
      };
    case "Angry":
      return {
        icon: "emoticon-angry-outline",
        color: "#FFE5E5",
        accent: "#E74C3C",
        label: "Angry",
        category: "attention",
      };
    default:
      return {
        icon: "emoticon-neutral-outline",
        color: colors.surfaceVariant,
        accent: colors.text.secondary,
        label: mood,
        category: "neutral",
      };
  }
};

type FilterTab = "all" | "positive" | "attention";

const MoodHistoryScreen: React.FC<MoodHistoryScreenProps> = ({
  onBack,
  initialLogs = SAMPLE_MOOD_LOGS,
}) => {
  const [logs] = useState<MoodLogItem[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [refreshing, setRefreshing] = useState(false);

  const handleTabChange = (tab: FilterTab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const filteredLogs = useMemo(() => {
    if (activeTab === "all") return logs;
    return logs.filter((item) => {
      const cfg = getMoodConfig(item.mood);
      if (activeTab === "positive") return cfg.category === "positive";
      if (activeTab === "attention") return cfg.category === "attention";
      return true;
    });
  }, [logs, activeTab]);

  const happyCount = useMemo(
    () => logs.filter((l) => l.mood === "Happy").length,
    [logs]
  );
  const attentionCount = useMemo(
    () =>
      logs.filter((l) => {
        const c = getMoodConfig(l.mood);
        return c.category === "attention";
      }).length,
    [logs]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={28}
            color={colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mood History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* STATS HERO CARD */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeaderRow}>
            <View>
              <Text style={styles.statsSubtitle}>LAST 30 DAYS</Text>
              <Text style={styles.statsTitle}>Emotional Well-Being</Text>
            </View>
            <View style={styles.statsIconBox}>
              <MaterialCommunityIcons
                name="chart-timeline-variant"
                size={28}
                color={colors.primary}
              />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{logs.length}</Text>
              <Text style={styles.statLabel}>Total Logs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.successDark }]}>
                {happyCount}
              </Text>
              <Text style={styles.statLabel}>Happy Days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.error }]}>
                {attentionCount}
              </Text>
              <Text style={styles.statLabel}>Needs Care</Text>
            </View>
          </View>

          <View style={styles.trendBanner}>
            <MaterialCommunityIcons
              name="heart-pulse"
              size={18}
              color={colors.successDark}
            />
            <Text style={styles.trendBannerText}>
              Your overall mood trend is positive this week!
            </Text>
          </View>
        </View>

        {/* FILTER TABS */}
        <View style={styles.filterTabRow}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeTab === "all" && styles.filterTabActive,
            ]}
            onPress={() => handleTabChange("all")}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === "all" && styles.filterTabTextActive,
              ]}
            >
              All Logs ({logs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeTab === "positive" && styles.filterTabActive,
            ]}
            onPress={() => handleTabChange("positive")}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === "positive" && styles.filterTabTextActive,
              ]}
            >
              Positive
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeTab === "attention" && styles.filterTabActive,
            ]}
            onPress={() => handleTabChange("attention")}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === "attention" && styles.filterTabTextActive,
              ]}
            >
              Needs Attention
            </Text>
          </TouchableOpacity>
        </View>

        {/* LOGS LIST */}
        <Text style={styles.sectionHeading}>History Record</Text>
        {filteredLogs.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons
              name="emoticon-neutral-outline"
              size={48}
              color={colors.text.disabled}
            />
            <Text style={styles.emptyText}>No mood logs in this filter.</Text>
          </View>
        ) : (
          filteredLogs.map((item) => {
            const cfg = getMoodConfig(item.mood);
            return (
              <View
                key={item.id}
                style={[styles.logCard, { borderLeftColor: cfg.accent }]}
              >
                <View
                  style={[styles.iconCircle, { backgroundColor: cfg.color }]}
                >
                  <MaterialCommunityIcons
                    name={cfg.icon}
                    size={32}
                    color={cfg.accent}
                  />
                </View>

                <View style={styles.logContent}>
                  <View style={styles.logHeaderRow}>
                    <Text style={[styles.logMoodTitle, { color: cfg.accent }]}>
                      {item.mood}
                    </Text>
                    <Text style={styles.logDateText}>
                      {item.dayName}, {item.date}
                    </Text>
                  </View>

                  <Text style={styles.logTimeText}>{item.time}</Text>

                  {item.notes ? (
                    <View style={styles.noteBox}>
                      <Text style={styles.noteText}>"{item.notes}"</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: {
    padding: spacing.s1,
  },
  headerTitle: {
    ...typography.titleLarge,
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s10,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s5,
    marginBottom: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e2,
  },
  statsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.s4,
  },
  statsSubtitle: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontWeight: "700",
  },
  statsTitle: {
    ...typography.headlineSmall,
    color: colors.text.primary,
    fontWeight: "800",
  },
  statsIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: spacing.s2,
    marginBottom: spacing.s4,
  },
  statBox: {
    alignItems: "center",
  },
  statNumber: {
    ...typography.headlineMedium,
    color: colors.text.primary,
    fontWeight: "900",
  },
  statLabel: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.outlineVariant,
  },
  trendBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successContainer,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.lg,
    gap: spacing.s2,
  },
  trendBannerText: {
    ...typography.labelMedium,
    color: colors.successDark,
    fontWeight: "700",
    flex: 1,
  },
  filterTabRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.s5,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.s2,
    alignItems: "center",
    borderRadius: radius.pill,
  },
  filterTabActive: {
    backgroundColor: colors.surface,
    ...elevation.e1,
  },
  filterTabText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  sectionHeading: {
    ...typography.titleMedium,
    color: colors.text.primary,
    fontWeight: "800",
    marginBottom: spacing.s3,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.s10,
    gap: spacing.s2,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.disabled,
  },
  logCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s4,
    marginBottom: spacing.s3,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderLeftWidth: 5,
    ...elevation.e1,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.s3,
  },
  logContent: {
    flex: 1,
  },
  logHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logMoodTitle: {
    ...typography.titleMedium,
    fontWeight: "800",
  },
  logDateText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  logTimeText: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  noteBox: {
    marginTop: spacing.s2,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.md,
  },
  noteText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontStyle: "italic",
  },
});

export default MoodHistoryScreen;

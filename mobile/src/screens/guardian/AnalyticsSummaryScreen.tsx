import React, { useState } from "react";
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
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { colors, typography, spacing, radius, elevation } from "../../theme";
import { reportExporter } from "../../services/reportExportService";

interface AnalyticsSummaryScreenProps {
  onBack: () => void;
  elderName?: string;
}

const WEEK_DAYS = [
  { day: "Mon", score: 100 },
  { day: "Tue", score: 85 },
  { day: "Wed", score: 100 },
  { day: "Thu", score: 90 },
  { day: "Fri", score: 100 },
  { day: "Sat", score: 75 },
  { day: "Sun", score: 95 },
];

const AnalyticsSummaryScreen: React.FC<AnalyticsSummaryScreenProps> = ({
  onBack,
  elderName = "Dilmin Ekanayaka",
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<"7D" | "30D">("7D");

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const handleExport = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await reportExporter.generateAndSharePDF({
        elderName: elderName,
        guardianName: "Guardian",
        dateRange: filterPeriod === "7D" ? "Last 7 Days" : "Last 30 Days",
        medicationAdherence: filterPeriod === "7D" ? 92 : 88,
        moodLogsCount: 14,
        sosAlertsCount: 0,
        notesText: `Comprehensive Care Analytics Summary generated for ${elderName}. Period: ${filterPeriod}.`,
      });
      Toast.show({
        type: "success",
        text1: "Report Generated",
        text2: `Health analytics summary for ${elderName} is ready to share.`,
        position: "top",
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Export Failed",
        text2: err.message,
        position: "top",
      });
    }
  };

  const adherenceScore = filterPeriod === "7D" ? 92 : 88;

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
        <Text style={styles.headerTitle}>Care Analytics</Text>
        <TouchableOpacity style={styles.exportIconBtn} onPress={handleExport}>
          <MaterialCommunityIcons
            name="share-variant-outline"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
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
        {/* ELDER SELECTOR HERO */}
        <View style={styles.elderBanner}>
          <View style={styles.elderAvatarBox}>
            <MaterialCommunityIcons
              name="face-man-outline"
              size={32}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.elderSubtitle}>MONITORING REPORT</Text>
            <Text style={styles.elderNameText}>{elderName}</Text>
          </View>
          <View style={styles.periodToggle}>
            <TouchableOpacity
              style={[
                styles.periodBtn,
                filterPeriod === "7D" && styles.periodBtnActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setFilterPeriod("7D");
              }}
            >
              <Text
                style={[
                  styles.periodText,
                  filterPeriod === "7D" && styles.periodTextActive,
                ]}
              >
                7D
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodBtn,
                filterPeriod === "30D" && styles.periodBtnActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setFilterPeriod("30D");
              }}
            >
              <Text
                style={[
                  styles.periodText,
                  filterPeriod === "30D" && styles.periodTextActive,
                ]}
              >
                30D
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* OVERALL SCORE CARD */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeaderRow}>
            <Text style={styles.scoreCardTitle}>Overall Adherence Score</Text>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>Excellent</Text>
            </View>
          </View>

          <View style={styles.scoreNumberRow}>
            <Text style={styles.scoreBigText}>{adherenceScore}%</Text>
            <View style={styles.scoreStatsCol}>
              <Text style={styles.scoreStatLabel}>✅ 26 Taken on Time</Text>
              <Text style={styles.scoreStatLabel}>⚠️ 2 Missed Doses</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${adherenceScore}%` },
              ]}
            />
          </View>

          {/* Weekly strip */}
          <Text style={styles.chartSubtitle}>Weekly Consistency</Text>
          <View style={styles.weekChartRow}>
            {WEEK_DAYS.map((item, idx) => (
              <View key={idx} style={styles.dayCol}>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${item.score}%`,
                        backgroundColor:
                          item.score >= 90
                            ? colors.successDark
                            : colors.warningDark,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.dayText}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* MOOD TREND CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons
                name="emoticon-happy-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Mood Trend Analysis</Text>
              <Text style={styles.cardSubtitle}>
                Emotional stability over the selected period
              </Text>
            </View>
          </View>

          <View style={styles.moodBarRow}>
            <View style={styles.moodBarItem}>
              <Text style={styles.moodPercentText}>78%</Text>
              <Text style={styles.moodLabelText}>Positive / Calm</Text>
              <View style={styles.miniBarBg}>
                <View
                  style={[
                    styles.miniBarFill,
                    {
                      width: "78%",
                      backgroundColor: colors.successDark,
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.moodBarItem}>
              <Text style={[styles.moodPercentText, { color: colors.error }]}>
                22%
              </Text>
              <Text style={styles.moodLabelText}>Needs Attention</Text>
              <View style={styles.miniBarBg}>
                <View
                  style={[
                    styles.miniBarFill,
                    { width: "22%", backgroundColor: colors.error },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* EMERGENCY SOS SUMMARY CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View
              style={[
                styles.cardIconBox,
                { backgroundColor: colors.errorContainer },
              ]}
            >
              <MaterialCommunityIcons
                name="alert-decagram"
                size={24}
                color={colors.error}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>SOS Readiness & Alerts</Text>
              <Text style={styles.cardSubtitle}>
                Emergency system reliability metrics
              </Text>
            </View>
          </View>

          <View style={styles.sosStatsGrid}>
            <View style={styles.sosStatBox}>
              <Text style={styles.sosStatNumber}>0</Text>
              <Text style={styles.sosStatLabel}>Real SOS Alerts</Text>
            </View>
            <View style={styles.sosStatBox}>
              <Text style={[styles.sosStatNumber, { color: colors.primary }]}>
                3
              </Text>
              <Text style={styles.sosStatLabel}>Voice/Button Tests</Text>
            </View>
            <View style={styles.sosStatBox}>
              <Text
                style={[
                  styles.sosStatNumber,
                  { color: colors.successDark },
                ]}
              >
                {"<1m"}
              </Text>
              <Text style={styles.sosStatLabel}>Avg Response Time</Text>
            </View>
          </View>
        </View>

        {/* EXPORT ACTION CTA */}
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={22}
            color={colors.surface}
          />
          <Text style={styles.exportBtnText}>
            Export Summary PDF Report
          </Text>
        </TouchableOpacity>
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
  exportIconBtn: {
    padding: spacing.s2,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s10,
  },
  elderBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s4,
    marginBottom: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: spacing.s3,
    ...elevation.e1,
  },
  elderAvatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  elderSubtitle: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontWeight: "700",
  },
  elderNameText: {
    ...typography.titleMedium,
    color: colors.text.primary,
    fontWeight: "800",
  },
  periodToggle: {
    flexDirection: "row",
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.pill,
    padding: 3,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  periodBtnActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    fontWeight: "700",
  },
  periodTextActive: {
    color: colors.surface,
  },
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s5,
    marginBottom: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e2,
  },
  scoreHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.s3,
  },
  scoreCardTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    fontWeight: "800",
  },
  statusChip: {
    backgroundColor: colors.successContainer,
    paddingHorizontal: spacing.s3,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusChipText: {
    ...typography.labelSmall,
    color: colors.successDark,
    fontWeight: "800",
  },
  scoreNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.s4,
  },
  scoreBigText: {
    ...typography.displayLarge,
    color: colors.primary,
    fontWeight: "900",
  },
  scoreStatsCol: {
    gap: 4,
  },
  scoreStatLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  progressBg: {
    height: 12,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.pill,
    overflow: "hidden",
    marginBottom: spacing.s5,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  chartSubtitle: {
    ...typography.labelMedium,
    color: colors.text.tertiary,
    fontWeight: "700",
    marginBottom: spacing.s3,
  },
  weekChartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
    paddingHorizontal: spacing.s2,
  },
  dayCol: {
    alignItems: "center",
    gap: 6,
  },
  barBg: {
    width: 20,
    height: 75,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.pill,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: radius.pill,
  },
  dayText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s5,
    marginBottom: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    marginBottom: spacing.s4,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    fontWeight: "800",
  },
  cardSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  moodBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.s4,
  },
  moodBarItem: {
    flex: 1,
  },
  moodPercentText: {
    ...typography.headlineMedium,
    color: colors.successDark,
    fontWeight: "900",
  },
  moodLabelText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    marginBottom: spacing.s2,
  },
  miniBarBg: {
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  miniBarFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  sosStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.s2,
  },
  sosStatBox: {
    alignItems: "center",
    flex: 1,
  },
  sosStatNumber: {
    ...typography.headlineMedium,
    color: colors.text.primary,
    fontWeight: "900",
  },
  sosStatLabel: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: 4,
  },
  exportBtn: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.s4,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s2,
    ...elevation.e2,
  },
  exportBtnText: {
    ...typography.titleMedium,
    color: colors.surface,
    fontWeight: "800",
  },
});

export default AnalyticsSummaryScreen;

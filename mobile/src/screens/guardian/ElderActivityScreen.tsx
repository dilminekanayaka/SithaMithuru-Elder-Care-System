import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import { apiFetch, SessionExpiredError } from "../../services/api";
import { reportExporter } from "../../services/reportExportService";

interface ElderActivityScreenProps {
  onBack: () => void;
  token: string;
  elderId: string | null;
  onNavigate?: (screen: string) => void;
  onSessionExpired?: () => void;
}

interface ActivityItem {
  type: string;
  title: string;
  detail: string;
  event_time: string;
  icon: string;
  color: string;
}

interface GroupedActivity {
  title: string;
  data: ActivityItem[];
}

type FilterPreset = "7d" | "14d" | "30d" | "custom";

const PRESETS: { label: string; value: FilterPreset; days?: number }[] = [
  { label: "7 Days", value: "7d", days: 7 },
  { label: "14 Days", value: "14d", days: 14 },
  { label: "30 Days", value: "30d", days: 30 },
  { label: "Custom", value: "custom" },
];

const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const ElderActivityScreen: React.FC<ElderActivityScreenProps> = ({
  onBack,
  token,
  elderId,
  onNavigate,
  onSessionExpired,
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [preset, setPreset] = useState<FilterPreset>("7d");
  const [fromDate, setFromDate] = useState<Date>(daysAgo(7));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const fetchActivity = useCallback(async () => {
    if (!elderId || !token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const from = fromDate.toISOString().split("T")[0];
      const to = toDate.toISOString().split("T")[0];
      const data = await apiFetch(
        `/guardian/activity/${elderId}?from=${from}&to=${to}`,
        token
      );
      setActivities(Array.isArray(data) ? data : []);
    } catch (error: any) {
      if (error instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load activity log",
        position: "top",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [elderId, token, fromDate, toDate]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivity();
  };

  const applyPreset = (p: FilterPreset, days?: number) => {
    setPreset(p);
    if (days) {
      setFromDate(daysAgo(days));
      setToDate(new Date());
    }
  };

  const onFromChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowFromPicker(false);
    if (date) {
      setFromDate(date);
      setPreset("custom");
    }
  };

  const onToChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowToPicker(false);
    if (date) {
      setToDate(date);
      setPreset("custom");
    }
  };

  const getGroupedActivities = (): GroupedActivity[] => {
    const groups: { [key: string]: ActivityItem[] } = {};
    activities.forEach((activity) => {
      if (!activity.event_time) return;
      const date = new Date(activity.event_time);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let dateString = "";
      if (date.toDateString() === today.toDateString()) {
        dateString = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateString = "Yesterday";
      } else {
        dateString = date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });
      }
      if (!groups[dateString]) groups[dateString] = [];
      groups[dateString].push(activity);
    });

    return Object.keys(groups).map((key) => ({ title: key, data: groups[key] }));
  };

  const formatTimeOnly = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderActivityItem = ({
    item,
    index,
    sectionLength,
  }: {
    item: ActivityItem;
    index: number;
    sectionLength: number;
  }) => {
    const showTimelineLine = index < sectionLength - 1;
    return (
      <View style={styles.activityItemContainer}>
        <View style={styles.timelineContainer}>
          <View style={[styles.timelineIconBg, { backgroundColor: item.color + "15" }]}>
            <MaterialCommunityIcons name={item.icon || "clock-outline"} size={20} color={item.color || "#6C63FF"} />
          </View>
          {showTimelineLine && <View style={styles.timelineLine} />}
        </View>
        <View style={styles.activityContentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.activityTime}>{formatTimeOnly(item.event_time)}</Text>
          </View>
          {item.detail ? (
            <Text style={styles.activityDetail}>{item.detail}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  const groupedData = getGroupedActivities();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity History</Text>
        <TouchableOpacity
          onPress={async () => {
            try {
              await reportExporter.generateAndSharePDF({
                elderName: "Linked Elder",
                guardianName: "Guardian",
                dateRange: `${formatDate(fromDate)} - ${formatDate(toDate)}`,
                medicationAdherence: 95,
                moodLogsCount: activities.length,
                sosAlertsCount: 0,
                notesText: `Activity log report exported for period ${formatDate(fromDate)} to ${formatDate(toDate)}. Total events: ${activities.length}.`,
              });
            } catch (err: any) {
              Toast.show({ type: "error", text1: "Export Failed", text2: err.message, position: "top" });
            }
          }}
          style={{ width: 48, height: 48, justifyContent: 'center', alignItems: 'center' }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Export activity report to PDF"
        >
          <MaterialCommunityIcons name="file-pdf-box" size={28} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterSection}>
        <View style={styles.presetRow}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.presetChip, preset === p.value && styles.presetChipActive]}
              onPress={() => applyPreset(p.value, p.days)}
              accessibilityLabel={`Filter by ${p.label}`}
            >
              <Text style={[styles.presetChipText, preset === p.value && styles.presetChipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {preset === "custom" && (
          <View style={styles.customDateRow}>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFromPicker(true)}>
              <MaterialCommunityIcons name="calendar-start" size={16} color="#6C63FF" />
              <Text style={styles.dateBtnText}>{formatDate(fromDate)}</Text>
            </TouchableOpacity>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#BDC3C7" />
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowToPicker(true)}>
              <MaterialCommunityIcons name="calendar-end" size={16} color="#6C63FF" />
              <Text style={styles.dateBtnText}>{formatDate(toDate)}</Text>
            </TouchableOpacity>
          </View>
        )}

        {showFromPicker && (
          <DateTimePicker
            value={fromDate}
            mode="date"
            display="default"
            onChange={onFromChange}
            maximumDate={toDate}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={toDate}
            mode="date"
            display="default"
            onChange={onToChange}
            minimumDate={fromDate}
            maximumDate={new Date()}
          />
        )}
      </View>

      {/* Content */}
      {!elderId ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-heart-outline" size={72} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>No Elder Linked</Text>
          <Text style={styles.emptySubtitle}>
            Please link an elder from the Dashboard to monitor their activity logs.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Fetching activity timeline...</Text>
        </View>
      ) : groupedData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="history" size={72} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>No Activity Logs Yet</Text>
          <Text style={styles.emptySubtitle}>
            We haven't recorded any activity events for the selected date range.
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6C63FF"]} />
          }
          renderItem={({ item: group }) => (
            <View style={styles.dateGroupContainer}>
              <Text style={styles.dateGroupTitle}>{group.title}</Text>
              {group.data.map((item, idx) =>
                renderActivityItem({
                  item,
                  index: idx,
                  sectionLength: group.data.length,
                })
              )}
            </View>
          )}
        />
      )}

      {/* Floating Bottom Navigation */}
      {onNavigate && (
        <View style={styles.bottomNavWrapper}>
          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("guardianDashboard")}>
              <MaterialCommunityIcons name="home-outline" size={24} color="#4A5568" />
              <Text style={styles.navLabel}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("guardianNotifications")}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#4A5568" />
              <Text style={styles.navLabel}>Alerts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("elderActivity")}>
              <MaterialCommunityIcons name="history" size={26} color="#6C63FF" />
              <Text style={[styles.navLabel, { color: "#6C63FF" }]}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("guardianSettings")}>
              <MaterialCommunityIcons name="cog-outline" size={24} color="#4A5568" />
              <Text style={styles.navLabel}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  header: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  backBtn: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#2C3E50" },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
    backgroundColor: "#FFFFFF",
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  presetChipActive: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4A5568",
  },
  presetChipTextActive: {
    color: "#FFFFFF",
  },
  customDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0F4FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0E0FF",
  },
  dateBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6C63FF",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { fontSize: 15, color: "#4A5568", fontWeight: "600" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
    backgroundColor: "#F7F8FA",
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#2C3E50", marginTop: 8 },
  emptySubtitle: {
    fontSize: 14,
    color: "#4A5568",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  refreshBtn: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  refreshBtnText: { color: "#FFFFFF", fontWeight: "700" },
  listContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 110 },
  dateGroupContainer: { marginBottom: 24 },
  dateGroupTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#4A5568",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  activityItemContainer: { flexDirection: "row", marginBottom: 12 },
  timelineContainer: { alignItems: "center", marginRight: 16, width: 44 },
  timelineIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  timelineLine: { width: 2, flex: 1, backgroundColor: "#E2E8F0", marginTop: 4 },
  activityContentCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  activityTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: "#2C3E50" },
  activityTime: { fontSize: 12, color: "#BDC3C7", fontWeight: "600" },
  activityDetail: {
    fontSize: 13,
    color: "#4A5568",
    marginTop: 6,
    lineHeight: 18,
    fontWeight: "500",
  },
  bottomNavWrapper: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 72,
    borderRadius: 36,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4A5568",
    marginTop: 4,
  },
});

export default ElderActivityScreen;

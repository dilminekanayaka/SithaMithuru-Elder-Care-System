/**
 * ElderDashboardScreen.tsx — Screen ELDER-S09 (Elder Home Dashboard)
 * Spec: es9.txt
 *
 * Requirements (es9.txt):
 *  1. Information Hierarchy:
 *     - Header (Time-based greeting "Good morning, Kamal", Date "Monday, 10 August", Notification bell with unread dot, Profile icon)
 *     - Emergency Help Card (Prominent, large CTA, Manual confirmation modal flow)
 *     - Mood Check-in ("How are you feeling today?" -> [ Happy 😊 ] [ Okay 😐 ] [ Sad 😔 ], Supportive suggestion for Sad)
 *     - Today's Medication Card ("💊 Morning Medicine 9:00 AM" + [ Mark as Taken ])
 *     - Today's Tasks Card ("✓ Drink 3 glasses of water Today" + [ Complete ])
 *     - Safety Status Banner ("🛡 You're doing well")
 *     - Guardian Status Banner ("Guardian 🟢 Connected")
 *  2. Fixed 4-Tab Bottom Navigation:
 *     - Home | Medicine | Tasks | More
 *     - "More" opens secondary navigation (Mood, Journal, Memories, Guardian, Notifications, Profile, Settings)
 *  3. Offline-First:
 *     - Reads local data immediately without full-screen spinners
 *     - Subtle offline status banner when internet is disconnected
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Animated,
  Modal,
  AccessibilityInfo,
  RefreshControl,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Text from "../../components/AppText";
import { colors, spacing, radius, elevation } from "../../theme";
import { voiceDetector } from "../../services/voiceKeywordDetector";
import VoiceEmergencyModal from "../../components/VoiceEmergencyModal";
import SyncStatusBanner from "../../components/SyncStatusBanner";
import { getDB } from "../../database/db";

const { width } = Dimensions.get("window");

interface ElderDashboardProps {
  onLogout?: () => void;
  userName?: string;
  userEmail?: string;
  userInitials?: string;
  elderId?: string | number;
  token?: string;
  onNavigate: (screen: string) => void;
}

const ElderDashboardScreen: React.FC<ElderDashboardProps> = ({
  onLogout = () => { },
  userName = "Kamal",
  userEmail = "kamal@gmail.com",
  userInitials = "KP",
  elderId,
  token,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState("home");
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showEmergencyConfirmModal, setShowEmergencyConfirmModal] = useState(false);

  // Time-based Greeting (es9.txt Section 5 & 6)
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Local State for Today's Medication (es9.txt Section 11 & 12)
  const [todayMedication, setTodayMedication] = useState<any>(null);

  // Local State for Today's Task (es9.txt Section 14 & 15)
  const [todayTask, setTodayTask] = useState<any>(null);

  // Local State for Mood Check-in (es9.txt Section 16 & 17)
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showMoodSuggestion, setShowMoodSuggestion] = useState(false);

  // Emergency Detector State (es9.txt Section 9)
  const [isDetectorReady, setIsDetectorReady] = useState(true);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [detectedKeyword, setDetectedKeyword] = useState("");

  // Offline / Network Status Indicator (es9.txt Section 31)
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `${getTimeBasedGreeting()}, ${userName}. SithaMithuru Home Dashboard.`
    );

    // Voice detector integration
    voiceDetector.startListening({
      onKeywordDetected: (keyword) => {
        setDetectedKeyword(keyword);
        setVoiceModalVisible(true);
      },
      onError: () => setIsDetectorReady(false),
      onStatusChange: (listening) => setIsDetectorReady(listening),
    });

    // Fetch real data from local DB
    const loadDashboardData = async () => {
      try {
        const db = await getDB();
        const med = await db.getFirstAsync("SELECT * FROM medications_local WHERE is_active = 1 ORDER BY created_at ASC LIMIT 1");
        if (med) setTodayMedication(med);

        const task = await db.getFirstAsync("SELECT * FROM daily_tasks_local WHERE is_active = 1 ORDER BY due_time ASC LIMIT 1");
        if (task) setTodayTask(task);
      } catch (e) {
        console.error("Error loading dashboard data:", e);
      }
    };
    loadDashboardData();

    return () => {
      voiceDetector.stopListening();
    };
  }, [userName]);

  // Handle Mark Medication as Taken (es9.txt Section 13)
  const handleMarkMedicationTaken = async () => {
    if (!todayMedication) return;
    try {
      const db = await getDB();
      await db.runAsync(
        "UPDATE medications_local SET taken = 1 WHERE id = ?",
        [todayMedication.id]
      );
      setTodayMedication((prev: any) => ({ ...prev, status: "TAKEN" }));
    } catch (e) {
      console.error("Failed to mark medication as taken:", e);
    }
  };

  // Handle Task Completion (es9.txt Section 14)
  const handleCompleteTask = async () => {
    if (!todayTask) return;
    try {
      const db = await getDB();
      await db.runAsync(
        "UPDATE daily_tasks_local SET completed = 1 WHERE id = ?",
        [todayTask.id]
      );
      setTodayTask((prev: any) => ({ ...prev, completed: true }));
    } catch (e) {
      console.error("Failed to complete task:", e);
    }
  };

  // Handle Mood Selection (es9.txt Section 16 & 17)
  const handleSelectMood = (mood: "HAPPY" | "OKAY" | "SAD") => {
    setSelectedMood(mood);
    if (mood === "SAD") {
      setShowMoodSuggestion(true);
    } else {
      setShowMoodSuggestion(false);
    }
  };

  // Formatted Date
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── 1. HEADER (GREETING, DATE, NOTIF, PROFILE) (es9.txt Section 4, 5, 6) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingText}>
              {getTimeBasedGreeting()}, <Text style={styles.greetingName}>{userName}</Text>
            </Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>

          <View style={styles.headerActions}>
            {/* NOTIFICATION BELL WITH UNREAD BADGE */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => onNavigate("notifications")}
              accessible={true}
              accessibilityLabel="Notifications"
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color={colors.text.primary} />
              <View style={styles.unreadDot} />
            </TouchableOpacity>

            {/* PROFILE BUTTON */}
            <TouchableOpacity
              style={styles.profileAvatarBtn}
              onPress={() => onNavigate("profile")}
              accessible={true}
              accessibilityLabel="Profile"
            >
              <Text style={styles.avatarInitialsText}>{userInitials}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* SUBTLE OFFLINE & SYNC STATUS BANNER */}
      <SyncStatusBanner />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── 2. EMERGENCY HELP CARD (es9.txt Section 7, 8, 9, 10) ─── */}
        <TouchableOpacity
          style={styles.emergencyCard}
          onPress={() => setShowEmergencyConfirmModal(true)}
          activeOpacity={0.85}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Emergency Help. Tap here if you need immediate help."
        >
          <View style={styles.emergencyIconBox}>
            <MaterialCommunityIcons name="alert-decagram" size={36} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>EMERGENCY HELP</Text>
            <Text style={styles.emergencySubtext}>Tap here if you need immediate help</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {!isDetectorReady && (
          <View style={styles.detectorWarningBox}>
            <MaterialCommunityIcons name="microphone-off" size={16} color="#D97706" style={{ marginRight: 6 }} />
            <Text style={styles.detectorWarningText}>Emergency Support: Microphone detector needs attention</Text>
          </View>
        )}

        {/* ─── 3. MOOD CHECK-IN (es9.txt Section 16, 17, 18) ─── */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>How are you feeling today?</Text>

          <View style={styles.moodRow}>
            <TouchableOpacity
              style={[styles.moodChip, selectedMood === "HAPPY" && styles.moodChipActive]}
              onPress={() => handleSelectMood("HAPPY")}
            >
              <Text style={styles.moodEmoji}>😊</Text>
              <Text style={styles.moodLabel}>Happy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.moodChip, selectedMood === "OKAY" && styles.moodChipActive]}
              onPress={() => handleSelectMood("OKAY")}
            >
              <Text style={styles.moodEmoji}>😐</Text>
              <Text style={styles.moodLabel}>Okay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.moodChip, selectedMood === "SAD" && styles.moodChipActive]}
              onPress={() => handleSelectMood("SAD")}
            >
              <Text style={styles.moodEmoji}>😔</Text>
              <Text style={styles.moodLabel}>Sad</Text>
            </TouchableOpacity>
          </View>

          {/* MOOD SUPPORTIVE SUGGESTION (es9.txt Section 17) */}
          {showMoodSuggestion && (
            <View style={styles.moodSuggestionCard}>
              <MaterialCommunityIcons name="heart-outline" size={20} color="#0284C7" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.moodSuggestionText}>
                  You might enjoy looking through one of your favorite memories.
                </Text>
                <TouchableOpacity
                  style={styles.suggestionActionBtn}
                  onPress={() => onNavigate("memories")}
                >
                  <Text style={styles.suggestionActionText}>View Memories →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.todayHeaderLabel}>TODAY</Text>

        {/* ─── 4. TODAY'S MEDICATION CARD (es9.txt Section 11, 12, 13) ─── */}
        <View style={styles.cardBox}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: "#E0F2FE" }]}>
              <MaterialCommunityIcons name="pill" size={24} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{todayMedication ? (todayMedication.name || todayMedication.medication_name) : "No pending medication"}</Text>
              <Text style={styles.cardSubtext}>{todayMedication ? `${todayMedication.time || '09:00 AM'} • ${todayMedication.dose || '1 Pill'}` : "All set for today"}</Text>
            </View>
            {todayMedication && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {todayMedication.status === "TAKEN" || todayMedication.taken ? "✓ TAKEN" : "IT'S TIME"}
                </Text>
              </View>
            )}
          </View>

          {todayMedication ? (
            todayMedication.status !== "TAKEN" && !todayMedication.taken ? (
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={handleMarkMedicationTaken}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Mark as Taken</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.completedBadgeRow}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.completedBadgeText}>Taken Today</Text>
              </View>
            )
          ) : null}
        </View>

        {/* ─── 5. TODAY'S TASKS CARD (es9.txt Section 14, 15) ─── */}
        <View style={styles.cardBox}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconCircle, { backgroundColor: "#ECFDF5" }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={24} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{todayTask ? (todayTask.title || todayTask.task_name) : "No tasks pending"}</Text>
              <Text style={styles.cardSubtext}>{todayTask ? (todayTask.time || todayTask.due_time || 'Today') : "Great job completing your activities"}</Text>
            </View>
          </View>

          {todayTask ? (
            !todayTask.completed ? (
              <TouchableOpacity
                style={[styles.actionBtnPrimary, { backgroundColor: "#059669" }]}
                onPress={handleCompleteTask}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Complete</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.completedBadgeRow}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.completedBadgeText}>Completed Today</Text>
              </View>
            )
          ) : null}
        </View>

        {/* ─── 6. SAFETY STATUS BANNER (es9.txt Section 19, 20) ─── */}
        <View style={styles.safetyCard}>
          <MaterialCommunityIcons name="shield-check" size={24} color="#059669" style={{ marginRight: 10 }} />
          <Text style={styles.safetyCardText}>🛡 You're doing well</Text>
        </View>

        {/* ─── 7. GUARDIAN STATUS BANNER (es9.txt Section 21, 30) ─── */}
        <TouchableOpacity
          style={styles.guardianCard}
          onPress={() => onNavigate("guardianStatus")}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="account-heart" size={22} color="#0284C7" style={{ marginRight: 10 }} />
          <Text style={styles.guardianLabelText}>Guardian</Text>
          <View style={styles.guardianStatusDot} />
          <Text style={styles.guardianStatusText}>Connected</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── 8. MANUAL EMERGENCY CONFIRMATION MODAL (es9.txt Section 10) ─── */}
      <Modal
        visible={showEmergencyConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmergencyConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="alert-decagram" size={54} color="#DC2626" style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Are you sure you need help?</Text>
            <Text style={styles.modalSubtitle}>
              Tapping YES will alert your connected Guardians and emergency support immediately.
            </Text>

            <TouchableOpacity
              style={styles.modalYesBtn}
              onPress={() => {
                setShowEmergencyConfirmModal(false);
                onNavigate("sos");
              }}
            >
              <Text style={styles.modalYesBtnText}>YES, GET HELP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowEmergencyConfirmModal(false)}
            >
              <Text style={styles.modalCancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── 9. FIXED 4-TAB BOTTOM NAVIGATION BAR (es9.txt Section 23, 24, 25) ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveTab("home")}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="home" size={26} color={activeTab === "home" ? "#0284C7" : "#64748B"} />
          <Text style={[styles.navTabLabel, activeTab === "home" && styles.navTabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => onNavigate("medicines")}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="pill" size={26} color="#64748B" />
          <Text style={styles.navTabLabel}>Medicine</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => onNavigate("tasks")}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="check-circle-outline" size={26} color="#64748B" />
          <Text style={styles.navTabLabel}>Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setShowMoreModal(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="dots-horizontal" size={26} color="#64748B" />
          <Text style={styles.navTabLabel}>More</Text>
        </TouchableOpacity>
      </View>

      {/* MORE MODAL / SECONDARY NAVIGATION (es9.txt Section 24) */}
      <Modal
        visible={showMoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoreModal(false)}
      >
        <TouchableOpacity
          style={styles.moreOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreModal(false)}
        >
          <View style={styles.moreSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.moreSheetTitle}>More Options</Text>

            <TouchableOpacity style={styles.moreItem} onPress={() => { setShowMoreModal(false); onNavigate("mood"); }}>
              <MaterialCommunityIcons name="emoticon-happy-outline" size={22} color="#0284C7" />
              <Text style={styles.moreItemText}>How I Feel (Mood)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreItem} onPress={() => { setShowMoreModal(false); onNavigate("journal"); }}>
              <MaterialCommunityIcons name="book-open-page-variant" size={22} color="#0284C7" />
              <Text style={styles.moreItemText}>My Journal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreItem} onPress={() => { setShowMoreModal(false); onNavigate("memories"); }}>
              <MaterialCommunityIcons name="image-multiple-outline" size={22} color="#0284C7" />
              <Text style={styles.moreItemText}>Memories</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreItem} onPress={() => { setShowMoreModal(false); onNavigate("guardianStatus"); }}>
              <MaterialCommunityIcons name="account-heart-outline" size={22} color="#0284C7" />
              <Text style={styles.moreItemText}>Guardian Connection</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreItem} onPress={() => { setShowMoreModal(false); onNavigate("notifications"); }}>
              <MaterialCommunityIcons name="bell-outline" size={22} color="#0284C7" />
              <Text style={styles.moreItemText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreItem} onPress={() => { setShowMoreModal(false); onNavigate("profile"); }}>
              <MaterialCommunityIcons name="account-outline" size={22} color="#0284C7" />
              <Text style={styles.moreItemText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreItem} onPress={() => { setShowMoreModal(false); onNavigate("settings"); }}>
              <MaterialCommunityIcons name="cog-outline" size={22} color="#0284C7" />
              <Text style={styles.moreItemText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Voice Emergency Keyword Modal */}
      <VoiceEmergencyModal
        visible={voiceModalVisible}
        detectedKeyword={detectedKeyword}
        onConfirm={() => {
          setVoiceModalVisible(false);
          onNavigate("sos");
        }}
        onCancel={() => {
          setVoiceModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s3 || 12,
    paddingBottom: spacing.s4 || 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    ...elevation.e1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text.primary,
  },
  greetingName: {
    fontWeight: "800",
    color: colors.primary,
  },
  dateText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  unreadDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  profileAvatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0284C7",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitialsText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  offlineBannerText: {
    fontSize: 12,
    color: "#0369A1",
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s4 || 16,
    paddingBottom: 110,
  },
  emergencyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    borderRadius: radius.xxl || 24,
    padding: spacing.s5 || 20,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emergencyIconBox: {
    marginRight: 14,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  emergencySubtext: {
    fontSize: 13,
    color: "#FEE2E2",
    marginTop: 2,
  },
  detectorWarningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: spacing.s4 || 16,
  },
  detectorWarningText: {
    fontSize: 12,
    color: "#B45309",
    fontWeight: "600",
  },
  sectionBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...elevation.e1,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 12,
  },
  moodRow: {
    flexDirection: "row",
    gap: 10,
  },
  moodChip: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  moodChipActive: {
    backgroundColor: "#E0F2FE",
    borderColor: "#0284C7",
  },
  moodEmoji: {
    fontSize: 22,
    marginRight: 6,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  moodSuggestionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  moodSuggestionText: {
    fontSize: 13,
    color: "#0369A1",
    lineHeight: 18,
  },
  suggestionActionBtn: {
    marginTop: 6,
  },
  suggestionActionText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0284C7",
  },
  todayHeaderLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 10,
  },
  cardBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...elevation.e1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  cardSubtext: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0284C7",
  },
  actionBtnPrimary: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#0284C7",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  completedBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
  },
  safetyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: radius.xl || 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  safetyCardText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#047857",
  },
  guardianCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.xl || 20,
    padding: 14,
    marginBottom: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  guardianLabelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
  },
  guardianStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#059669",
    marginRight: 6,
  },
  guardianStatusText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  modalYesBtn: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  modalYesBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modalCancelBtn: {
    width: "100%",
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelBtnText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    elevation: 8,
  },
  navTab: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navTabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  navTabLabelActive: {
    color: "#0284C7",
    fontWeight: "800",
  },
  moreOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  moreSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 16,
  },
  moreSheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 16,
  },
  moreItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  moreItemText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
});

export default ElderDashboardScreen;

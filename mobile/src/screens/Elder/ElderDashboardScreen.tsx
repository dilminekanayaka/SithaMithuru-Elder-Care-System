import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import BottomNavBar from "../../components/BottomNavBar";

const { width, height } = Dimensions.get("window");

interface ElderDashboardProps {
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
  userInitials?: string;
  onNavigate: (screen: string) => void;
}

const ElderDashboardScreen: React.FC<ElderDashboardProps> = ({
  onLogout,
  userName = "Sanath",
  userEmail = "sanath@gmail.com",
  userInitials = "SJ",
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState("home");
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current; // Start hidden to left
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Sidebar Animation Logic
  useEffect(() => {
    if (isSidebarVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width * 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSidebarVisible]);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  const handleNav = (screen: string) => {
    // If staying on dashboard (home), just update tab
    if (screen === "home") {
      setActiveTab("home");
      return;
    }

    // For other screens, update tab AND navigate
    setActiveTab(screen === "elderDashboard" ? "home" : screen);
    if (screen !== "elderDashboard") {
      onNavigate(screen);
    }
  };

  const menuItems = [
    {
      id: 1,
      title: "Emergency SOS",
      icon: "alert-octagon",
      bgColor: "#FFE5E5", // Light Red
      accentColor: "#FF4D4D",
      onPress: () => handleNav("sos"),
    },
    {
      id: 2,
      title: "My Medicines",
      icon: "pill",
      bgColor: "#E5F9E5", // Light Green
      accentColor: "#00B300",
      onPress: () => handleNav("medicines"),
    },
    {
      id: 3,
      title: "Daily Tasks",
      icon: "checkbox-marked-circle-outline",
      bgColor: "#E5F2FF", // Light Blue
      accentColor: "#2D8CFF",
      onPress: () => handleNav("tasks"),
    },
    {
      id: 4,
      title: "How I Feel",
      icon: "emoticon-happy-outline",
      bgColor: "#FFF9E5", // Light Yellow
      accentColor: "#FFB800",
      onPress: () => handleNav("mood"),
    },
    {
      id: 7,
      title: "My Journal",
      icon: "book-open-page-variant",
      bgColor: "#FFF0D4", // Light Orange
      accentColor: "#F39C12",
      onPress: () => handleNav("journal"),
    },
  ];

  const reminders = [
    {
      id: 1,
      type: "med",
      title: "Metformin 500mg",
      time: "14:00",
      icon: "pill",
      color: "#6C63FF",
    },
    {
      id: 2,
      type: "task",
      title: "Drink Water (Glass 4)",
      time: "14:30",
      icon: "cup-water",
      color: "#2D8CFF",
    },
    {
      id: 3,
      type: "med",
      title: "Atorvastatin",
      time: "20:00",
      icon: "pill",
      color: "#6C63FF",
    },
  ];

  const missedItems = [{ id: 1, title: "Morning Medicine", time: "9:00 AM" }];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Premium Top Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
            <MaterialCommunityIcons name="menu" size={28} color="#2C3E50" />
          </TouchableOpacity>

          <View style={styles.greetingContainer}>
            <Text style={styles.greetingSub}>Good Morning</Text>
            <Text style={styles.greetingName}>{userName}</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <MaterialCommunityIcons
                name="bell-ring-outline"
                size={24}
                color="#2C3E50"
              />
              <View style={styles.badge} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => handleNav("profile")}
            >
              {/* Placeholder Avatar */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#6C63FF",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                  {userInitials}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date and Weather Widget */}
        <View style={styles.weatherDateContainer}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Missed Items Alert */}
        {missedItems.length > 0 && (
          <View style={styles.missedContainer}>
            <View style={styles.missedHeader}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={24}
                color="#C0392B"
              />
              <Text style={styles.missedTitle}>Missed Reminders</Text>
            </View>
            {missedItems.map((item) => (
              <View key={item.id} style={styles.missedItem}>
                <Text style={styles.missedText}>
                  {item.title} ({item.time})
                </Text>
                <TouchableOpacity style={styles.missedActionBtn}>
                  <Text style={styles.missedActionText}>Check</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Reminders Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Upcoming Reminders</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.remindersList}
          >
            {reminders.map((item) => (
              <View key={item.id} style={styles.reminderCard}>
                <View
                  style={[
                    styles.reminderIconBox,
                    { backgroundColor: item.color + "20" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={24}
                    color={item.color}
                  />
                </View>
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderTime}>{item.time}</Text>
                  <Text style={styles.reminderTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
                <View style={styles.reminderStatus} />
              </View>
            ))}
          </ScrollView>
        </View>

        <Text style={[styles.sectionHeader, { marginTop: 20 }]}>
          Quick Access
        </Text>

        {/* Dashboard Grid */}
        <View style={styles.gridContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { backgroundColor: item.bgColor }]}
              onPress={item.onPress}
              activeOpacity={0.9}
            >
              <View
                style={[styles.iconContainer, { backgroundColor: "#FFFFFF" }]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={32}
                  color={item.accentColor}
                />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Bottom Navigation */}
      <BottomNavBar
        activeTab={
          activeTab === "home" || activeTab === "elderDashboard"
            ? "home"
            : activeTab
        }
        onNavigate={onNavigate}
      />

      {/* Custom Sidebar / Drawer */}
      {isSidebarVisible && (
        <View style={styles.sidebarOverlay}>
          <TouchableWithoutFeedback onPress={toggleSidebar}>
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.sidebarContainer,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarAvatar}>
                <Text
                  style={{ color: "#FFF", fontSize: 28, fontWeight: "bold" }}
                >
                  {userInitials}
                </Text>
              </View>
              <Text style={styles.sidebarName} numberOfLines={1}>
                {userName}
              </Text>
              <Text style={styles.sidebarEmail} numberOfLines={1}>
                {userEmail}
              </Text>
            </View>

            <ScrollView
              style={styles.sidebarMenu}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                style={styles.sidebarItem}
                onPress={() => {
                  toggleSidebar();
                  handleNav("home");
                }}
              >
                <MaterialCommunityIcons
                  name="home-outline"
                  size={24}
                  color="#2C3E50"
                />
                <Text style={styles.sidebarItemText}>Home</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#BDC3C7"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarItem}
                onPress={() => {
                  toggleSidebar();
                  handleNav("profile");
                }}
              >
                <MaterialCommunityIcons
                  name="account-outline"
                  size={24}
                  color="#2C3E50"
                />
                <Text style={styles.sidebarItemText}>My Profile</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#BDC3C7"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarItem}
                onPress={() => {
                  toggleSidebar();
                  handleNav("settings");
                }}
              >
                <MaterialCommunityIcons
                  name="cog-outline"
                  size={24}
                  color="#2C3E50"
                />
                <Text style={styles.sidebarItemText}>Settings</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#BDC3C7"
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem}>
                <MaterialCommunityIcons
                  name="help-circle-outline"
                  size={24}
                  color="#2C3E50"
                />
                <Text style={styles.sidebarItemText}>Help & Support</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#BDC3C7"
                />
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity style={styles.sidebarLogout} onPress={onLogout}>
              <MaterialCommunityIcons name="logout" size={24} color="#E74C3C" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuButton: {
    padding: 8,
    backgroundColor: "#F7F9FC",
    borderRadius: 12,
  },
  greetingContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  greetingSub: {
    fontSize: 12,
    color: "#7F8C8D",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  greetingName: {
    fontSize: 20,
    color: "#2C3E50",
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 8,
    marginRight: 10,
    backgroundColor: "#F7F9FC",
    borderRadius: 12,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E74C3C",
    borderWidth: 1,
    borderColor: "#F7F9FC",
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#6C63FF",
    padding: 2,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },

  // Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },

  // Weather Date
  weatherDateContainer: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
  },

  // Missed Items
  missedContainer: {
    backgroundColor: "#FADBD8",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F1948A",
  },
  missedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  missedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C0392B",
    marginLeft: 8,
  },
  missedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  missedText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C0392B",
  },
  missedActionBtn: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  missedActionText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#C0392B",
  },

  // Reminders Section
  sectionContainer: {
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginLeft: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C63FF",
  },
  remindersList: {
    marginLeft: -4, // Counteract container padding for full width feel if wanted, but standard is fine
  },
  reminderCard: {
    width: 160,
    height: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  reminderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTime: {
    fontSize: 12,
    fontWeight: "700",
    color: "#95A5A6",
    marginBottom: 4,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2C3E50",
  },
  reminderStatus: {
    // Could point to status
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  card: {
    width: (width - 52) / 2,
    height: 140,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C3E50",
    marginTop: 12,
  },

  // Sidebar
  sidebarOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(44, 62, 80, 0.7)", // Darker, premium backdrop
  },
  sidebarContainer: {
    width: width * 0.75, // Slightly narrower for a sleeker look
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  sidebarHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    backgroundColor: "#F8F9FA", // Subtle contrast for header
    borderBottomRightRadius: 40,
  },
  sidebarAvatar: {
    marginBottom: 16,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  sidebarName: {
    fontSize: 22,
    fontWeight: "800", // Extra bold
    color: "#2C3E50",
    marginBottom: 4,
  },
  sidebarEmail: {
    fontSize: 14,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  sidebarMenu: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF", // Clean background
    // Subtle interaction hint
    borderWidth: 1,
    borderColor: "transparent",
  },
  // Add a style for active or pressed state if needed, handled via logic or just rely on touch opacity
  sidebarItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginLeft: 16,
    flex: 1,
  },
  sidebarLogout: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 30,
    marginHorizontal: 16,
    backgroundColor: "#FFF5F5", // Light red bg for danger action
    borderRadius: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E74C3C",
    marginLeft: 16,
  },
});

export default ElderDashboardScreen;

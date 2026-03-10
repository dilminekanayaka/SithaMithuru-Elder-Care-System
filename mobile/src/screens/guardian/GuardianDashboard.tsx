import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const { width } = Dimensions.get("window");

interface GuardianDashboardProps {
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
  userInitials?: string;
  onNavigate: (screen: string) => void;
}

const GuardianDashboard: React.FC<GuardianDashboardProps> = ({
  onLogout,
  userName = "Mr. Dumidu",
  userEmail,
  userInitials = "MD",
  onNavigate,
}: GuardianDashboardProps) => {
  const [activeTab, setActiveTab] = useState("home");

  const activityList = [
    {
      id: 1,
      type: "med",
      title: "Took Morning medicine dose",
      time: "2 hours ago",
      icon: "pill",
    },
    {
      id: 2,
      type: "mood",
      title: "Feeling Happy Today",
      time: "4 hours ago",
      icon: "emoticon-happy-outline",
    },
    {
      id: 3,
      type: "med",
      title: "Missed Dinner medicine dose",
      time: "yesterday",
      icon: "pill",
    },
    {
      id: 4,
      type: "med",
      title: "Took Lunch medicine dose",
      time: "yesterday",
      icon: "pill",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Black Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <MaterialCommunityIcons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <View style={{ alignItems: "flex-end", marginRight: 12 }}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userRole}>Son</Text>
          </View>
          <View
            style={{
              width: 45,
              height: 45,
              borderRadius: 22.5,
              borderWidth: 2,
              borderColor: "#FFFFFF",
              backgroundColor: "#6C63FF",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "bold" }}>
              {userInitials}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Elder Dropdown Section */}
        <View style={styles.elderSelector}>
          <Text style={styles.elderLabel}>Elder : </Text>
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>John De Silva</Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color="#000"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Dashboard</Text>

        {/* Dashboard Grid */}
        <View style={styles.grid}>
          {/* Status Card */}
          <View style={[styles.card, { borderColor: "#2ECC71" }]}>
            <View style={[styles.cardIconBox, { backgroundColor: "#E8F8F0" }]}>
              <MaterialCommunityIcons
                name="account-outline"
                size={24}
                color="#2ECC71"
              />
            </View>
            <Text style={styles.cardLabel}>Status</Text>
            <Text style={[styles.cardValue, { color: "#2ECC71" }]}>Active</Text>
            <Text style={styles.cardSubValue}>Last seen 10 min ago</Text>
          </View>

          {/* Medications Card */}
          <View style={[styles.card, { borderColor: "#3498DB" }]}>
            <View style={[styles.cardIconBox, { backgroundColor: "#EBF5FB" }]}>
              <MaterialCommunityIcons name="pill" size={24} color="#3498DB" />
            </View>
            <Text style={styles.cardLabel}>Medications</Text>
            <Text style={[styles.cardValue, { color: "#2980B9" }]}>1/3</Text>
            <Text style={styles.cardSubValue}>Taken today</Text>
          </View>

          {/* Tasks Card */}
          <View style={[styles.card, { borderColor: "#9B59B6" }]}>
            <View style={[styles.cardIconBox, { backgroundColor: "#F4ECF7" }]}>
              <MaterialCommunityIcons
                name="checkbox-marked-outline"
                size={24}
                color="#9B59B6"
              />
            </View>
            <Text style={styles.cardLabel}>Tasks</Text>
            <Text style={[styles.cardValue, { color: "#8E44AD" }]}>2/6</Text>
            <Text style={styles.cardSubValue}>Completed</Text>
          </View>

          {/* Mood Card */}
          <View style={[styles.card, { borderColor: "#F1C40F" }]}>
            <View style={[styles.cardIconBox, { backgroundColor: "#FEF9E7" }]}>
              <MaterialCommunityIcons
                name="emoticon-dead-outline"
                size={24}
                color="#F1C40F"
              />
            </View>
            <Text style={styles.cardLabel}>Mood</Text>
            <Text style={[styles.cardValue, { color: "#F39C12" }]}>Happy</Text>
            <Text style={styles.cardSubValue}>4 hours ago</Text>
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {activityList.map((item) => (
            <View key={item.id} style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color="#3F51B5"
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigate("guardianDashboard")}
        >
          <MaterialCommunityIcons name="home" size={28} color="#6C63FF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={28}
            color="#95A5A6"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.plusButton}>
          <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigate("manageElder")}
        >
          <MaterialCommunityIcons
            name="account-cog-outline"
            size={28}
            color="#95A5A6"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons
            name="cog-outline"
            size={28}
            color="#95A5A6"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 100,
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  menuButton: {
    padding: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  userRole: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.8,
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  elderSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  elderLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: (width - 60) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    padding: 15,
    marginBottom: 20,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardSubValue: {
    fontSize: 10,
    color: "#95A5A6",
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  viewAll: {
    fontSize: 14,
    color: "#3F51B5",
    fontWeight: "bold",
  },
  activityList: {
    backgroundColor: "#FFFFFF",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#E8EAF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
  },
  activityTime: {
    fontSize: 12,
    color: "#7F8C8D",
    marginTop: 2,
  },
  bottomNav: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    top: -5,
  },
});

export default GuardianDashboard;

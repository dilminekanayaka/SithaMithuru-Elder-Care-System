import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { colors } from "../theme";

export type GuardianTabType =
  | "guardianDashboard"
  | "manageElder"
  | "elderActivity"
  | "guardianProfile";

interface GuardianBottomNavProps {
  activeTab: GuardianTabType;
  onNavigate: (screen: string) => void;
}

const TABS: { id: GuardianTabType; label: string; icon: string; activeIcon: string }[] = [
  {
    id: "guardianDashboard",
    label: "Dashboard",
    icon: "home-outline",
    activeIcon: "home",
  },
  {
    id: "manageElder",
    label: "Elder Care",
    icon: "heart-pulse",
    activeIcon: "heart-pulse",
  },
  {
    id: "elderActivity",
    label: "Activity",
    icon: "walk",
    activeIcon: "run",
  },
  {
    id: "guardianProfile",
    label: "Profile",
    icon: "account-outline",
    activeIcon: "account",
  },
];

const GuardianBottomNav: React.FC<GuardianBottomNavProps> = ({ activeTab, onNavigate }) => {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => onNavigate(tab.id)}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            <View style={[styles.iconBox, isActive && styles.activeIconBox]}>
              <MaterialCommunityIcons
                name={isActive ? tab.activeIcon : tab.icon}
                size={24}
                color={isActive ? colors.navActive : colors.text.secondary}
              />
            </View>
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: colors.navBg,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: 8,
    paddingBottom: Platform.OS === "android" ? 14 : 24,
    paddingHorizontal: 12,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    zIndex: 100,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  iconBox: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 2,
  },
  activeIconBox: {
    backgroundColor: colors.primaryContainer,
  },
  tabLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  activeTabLabel: {
    color: colors.navActive,
    fontWeight: "800",
  },
});

export default GuardianBottomNav;

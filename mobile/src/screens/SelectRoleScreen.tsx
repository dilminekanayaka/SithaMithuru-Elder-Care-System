import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { colors, typography, spacing, radius, elevation } from "../theme";

const { width } = Dimensions.get("window");

export type RoleType = "Elder" | "Guardian";

interface SelectRoleScreenProps {
  onRoleSelected: (role: RoleType) => void;
  onBack?: () => void;
}

const SelectRoleScreen: React.FC<SelectRoleScreenProps> = ({
  onRoleSelected,
  onBack,
}) => {
  const [selectedRole, setSelectedRole] = useState<RoleType>("Elder");

  const handleSelectRole = (role: RoleType) => {
    Haptics.selectionAsync();
    setSelectedRole(role);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRoleSelected(selectedRole);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
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
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.headerTitle}>Select Role</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>How will you use SithaMithuru?</Text>
          <Text style={styles.subtitle}>
            Choose your role to personalize your care experience. You can manage
            permissions anytime.
          </Text>
        </View>

        {/* Role Option: ELDER */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === "Elder" && styles.roleCardSelectedElder,
          ]}
          onPress={() => handleSelectRole("Elder")}
          activeOpacity={0.85}
          accessibilityLabel="Select Elder role"
        >
          <View
            style={[
              styles.iconBox,
              selectedRole === "Elder"
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.primaryContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="heart-pulse"
              size={36}
              color={selectedRole === "Elder" ? colors.onPrimary : colors.primary}
            />
          </View>
          <View style={styles.roleCardContent}>
            <View style={styles.roleTitleRow}>
              <Text
                style={[
                  styles.roleTitle,
                  selectedRole === "Elder" && { color: colors.primary },
                ]}
              >
                I am an Elder (60+)
              </Text>
              {selectedRole === "Elder" && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={colors.primary}
                />
              )}
            </View>
            <Text style={styles.roleDescription}>
              Large readable text, easy voice emergency SOS, daily medication
              reminders, and simple mood check-ins.
            </Text>
            <View style={styles.featureChipRow}>
              <View style={styles.featureChip}>
                <Text style={styles.featureChipText}>Voice SOS</Text>
              </View>
              <View style={styles.featureChip}>
                <Text style={styles.featureChipText}>Big Buttons</Text>
              </View>
              <View style={styles.featureChip}>
                <Text style={styles.featureChipText}>Pill Reminders</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Role Option: GUARDIAN */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === "Guardian" && styles.roleCardSelectedGuardian,
          ]}
          onPress={() => handleSelectRole("Guardian")}
          activeOpacity={0.85}
          accessibilityLabel="Select Guardian role"
        >
          <View
            style={[
              styles.iconBox,
              selectedRole === "Guardian"
                ? { backgroundColor: colors.successDark }
                : { backgroundColor: colors.successContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-account"
              size={36}
              color={selectedRole === "Guardian" ? colors.onPrimary : colors.successDark}
            />
          </View>
          <View style={styles.roleCardContent}>
            <View style={styles.roleTitleRow}>
              <Text
                style={[
                  styles.roleTitle,
                  selectedRole === "Guardian" && { color: colors.successDark },
                ]}
              >
                I am a Guardian
              </Text>
              {selectedRole === "Guardian" && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={colors.successDark}
                />
              )}
            </View>
            <Text style={styles.roleDescription}>
              Monitor your elder’s well-being, receive instant emergency alerts,
              check medication adherence, and view health reports.
            </Text>
            <View style={styles.featureChipRow}>
              <View
                style={[
                  styles.featureChip,
                  { backgroundColor: colors.successContainer },
                ]}
              >
                <Text
                  style={[
                    styles.featureChipText,
                    { color: colors.successDark },
                  ]}
                >
                  Live Alerts
                </Text>
              </View>
              <View
                style={[
                  styles.featureChip,
                  { backgroundColor: colors.successContainer },
                ]}
              >
                <Text
                  style={[
                    styles.featureChipText,
                    { color: colors.successDark },
                  ]}
                >
                  Adherence Charts
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueBtn,
            selectedRole === "Guardian" && {
              backgroundColor: colors.successDark,
              shadowColor: colors.successDark,
            },
          ]}
          onPress={handleContinue}
          accessibilityLabel={`Continue as ${selectedRole}`}
        >
          <Text style={styles.continueBtnText}>
            Continue as {selectedRole}
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={22}
            color={colors.onPrimary}
          />
        </TouchableOpacity>
      </View>
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
    paddingTop: spacing.s3,
    paddingBottom: spacing.s10,
  },
  titleSection: {
    marginBottom: spacing.s6,
  },
  title: {
    ...typography.headlineLarge,
    color: colors.text.primary,
    marginBottom: spacing.s2,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  roleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s5,
    marginBottom: spacing.s4,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    ...elevation.e2,
  },
  roleCardSelectedElder: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer + "60",
    ...elevation.e3,
  },
  roleCardSelectedGuardian: {
    borderColor: colors.successDark,
    backgroundColor: colors.successContainer + "70",
    ...elevation.e3,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.s3,
  },
  roleCardContent: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.s2,
  },
  roleTitle: {
    ...typography.headlineSmall,
    color: colors.text.primary,
    fontWeight: "800",
  },
  roleDescription: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.s3,
  },
  featureChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s2,
  },
  featureChip: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderRadius: radius.pill,
  },
  featureChipText: {
    ...typography.labelSmall,
    color: colors.primary,
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s4,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  continueBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.s4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    ...typography.titleMedium,
    color: colors.text.inverse,
    fontWeight: "800",
  },
});

export default SelectRoleScreen;

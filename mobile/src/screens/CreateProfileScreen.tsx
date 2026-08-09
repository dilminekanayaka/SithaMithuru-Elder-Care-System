import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { colors, typography, spacing, radius, elevation } from "../theme";
import { RoleType } from "./SelectRoleScreen";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];

interface CreateProfileScreenProps {
  role: RoleType;
  initialName?: string;
  initialEmail?: string;
  token?: string;
  onComplete: (profileData: any) => void;
  onBack?: () => void;
}

const CreateProfileScreen: React.FC<CreateProfileScreenProps> = ({
  role,
  initialName = "",
  initialEmail = "",
  onComplete,
  onBack,
}) => {
  const [name, setName] = useState(initialName);
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [bloodType, setBloodType] = useState("O+");
  const [gender, setGender] = useState("Male");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSelectBloodType = (type: string) => {
    Haptics.selectionAsync();
    setBloodType(type);
  };

  const handleSelectGender = (val: string) => {
    Haptics.selectionAsync();
    setGender(val);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Name Required",
        text2: "Please enter your full name.",
        position: "top",
      });
      return;
    }

    if (role === "Elder" && !age.trim()) {
      Toast.show({
        type: "error",
        text1: "Age Required",
        text2: "Please enter your age for accurate healthcare monitoring.",
        position: "top",
      });
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      const profileData = {
        name: name.trim(),
        email: initialEmail,
        age: age ? parseInt(age, 10) : null,
        phone_number: phone.trim(),
        emergency_phone: emergencyPhone.trim(),
        blood_type: bloodType,
        gender,
        address: address.trim(),
        role,
      };
      setSaving(false);
      Toast.show({
        type: "success",
        text1: "Profile Created!",
        text2: `Welcome to SithaMithuru as a ${role}.`,
        position: "top",
      });
      onComplete(profileData);
    }, 500);
  };

  const isElder = role === "Elder";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

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
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Role Indicator Badge */}
          <View style={styles.roleBadgeRow}>
            <View
              style={[
                styles.roleBadge,
                isElder
                  ? { backgroundColor: colors.primaryContainer }
                  : { backgroundColor: colors.successContainer },
              ]}
            >
              <MaterialCommunityIcons
                name={isElder ? "heart-pulse" : "shield-account"}
                size={20}
                color={isElder ? colors.primary : colors.successDark}
              />
              <Text
                style={[
                  styles.roleBadgeText,
                  isElder
                    ? { color: colors.primary }
                    : { color: colors.successDark },
                ]}
              >
                Setting up as {role}
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.sectionHeader}>Personal Information</Text>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={22}
                  color={colors.text.tertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Dilmin Ekanayaka"
                  placeholderTextColor={colors.text.disabled}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Age & Phone in a row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Age {isElder && <Text style={styles.required}>*</Text>}
                </Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="calendar-account-outline"
                    size={22}
                    color={colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 68"
                    placeholderTextColor={colors.text.disabled}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1.3, marginLeft: spacing.s3 }]}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="phone-outline"
                    size={22}
                    color={colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="077xxxxxxx"
                    placeholderTextColor={colors.text.disabled}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            {/* Gender Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.chipRow}>
                {GENDERS.map((item) => {
                  const selected = gender === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.genderChip,
                        selected && styles.genderChipSelected,
                      ]}
                      onPress={() => handleSelectGender(item)}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          selected && styles.genderChipTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Blood Type Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Group</Text>
              <View style={styles.bloodGrid}>
                {BLOOD_TYPES.map((type) => {
                  const selected = bloodType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.bloodChip,
                        selected && styles.bloodChipSelected,
                      ]}
                      onPress={() => handleSelectBloodType(type)}
                    >
                      <Text
                        style={[
                          styles.bloodChipText,
                          selected && styles.bloodChipTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Emergency / Primary Guardian Phone */}
            {isElder && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Primary Guardian Phone (For SOS Calling){" "}
                  <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="phone-alert-outline"
                    size={22}
                    color={colors.error}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Guardian's mobile number"
                    placeholderTextColor={colors.text.disabled}
                    value={emergencyPhone}
                    onChangeText={setEmergencyPhone}
                    keyboardType="phone-pad"
                  />
                </View>
                <Text style={styles.hintText}>
                  This number will be dialed immediately when you trigger voice
                  SOS or push the emergency button.
                </Text>
              </View>
            )}

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Home Address (Optional)</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="home-outline"
                  size={22}
                  color={colors.text.tertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="City or residential address"
                  placeholderTextColor={colors.text.disabled}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            saving && styles.saveBtnDisabled,
            role === "Guardian" && {
              backgroundColor: colors.successDark,
              shadowColor: colors.successDark,
            },
          ]}
          onPress={handleSaveProfile}
          disabled={saving}
          accessibilityLabel="Save profile and enter app"
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.saveBtnText}>Complete & Enter SithaMithuru</Text>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={22}
                color="#FFFFFF"
              />
            </>
          )}
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
    paddingTop: spacing.s2,
    paddingBottom: spacing.s10,
  },
  roleBadgeRow: {
    alignItems: "center",
    marginBottom: spacing.s4,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s1,
    borderRadius: radius.pill,
    gap: spacing.s1,
  },
  roleBadgeText: {
    ...typography.labelMedium,
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e2,
  },
  sectionHeader: {
    ...typography.titleMedium,
    color: colors.text.primary,
    fontWeight: "800",
    marginBottom: spacing.s4,
  },
  inputGroup: {
    marginBottom: spacing.s4,
  },
  label: {
    ...typography.labelMedium,
    color: colors.text.primary,
    marginBottom: spacing.s1,
  },
  required: {
    color: colors.error,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.s3,
  },
  inputIcon: {
    marginRight: spacing.s2,
  },
  input: {
    flex: 1,
    height: 52,
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.s2,
  },
  genderChip: {
    flex: 1,
    paddingVertical: spacing.s3,
    alignItems: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  genderChipSelected: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  genderChipText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  genderChipTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  bloodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s2,
  },
  bloodChip: {
    width: "22%",
    paddingVertical: spacing.s2,
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  bloodChipSelected: {
    backgroundColor: colors.errorContainer,
    borderColor: colors.error,
  },
  bloodChipText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  bloodChipTextSelected: {
    color: colors.errorDark,
    fontWeight: "800",
  },
  hintText: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    marginTop: spacing.s1,
  },
  footer: {
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s4,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  saveBtn: {
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
  saveBtnDisabled: {
    backgroundColor: colors.text.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    ...typography.titleMedium,
    color: colors.text.inverse,
    fontWeight: "800",
  },
});

export default CreateProfileScreen;

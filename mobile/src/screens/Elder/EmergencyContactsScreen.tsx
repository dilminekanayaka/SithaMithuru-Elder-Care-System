import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Switch,
  Alert,
  Linking,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { colors, typography, spacing, radius, elevation } from "../../theme";

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary?: boolean;
}

interface EmergencyContactsScreenProps {
  onBack: () => void;
  token?: string;
  elderId?: number;
  initialContacts?: EmergencyContact[];
}

const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: "1",
    name: "Primary Guardian",
    relationship: "Son / Daughter",
    phone: "0771234567",
    isPrimary: true,
  },
  {
    id: "2",
    name: "1990 Suwa Seriya",
    relationship: "National Ambulance",
    phone: "1990",
    isPrimary: false,
  },
  {
    id: "3",
    name: "Dr. Silva",
    relationship: "Family Doctor",
    phone: "0112345678",
    isPrimary: false,
  },
];

const RELATIONSHIPS = [
  "Guardian",
  "Son / Daughter",
  "Spouse",
  "Doctor",
  "Neighbor",
  "Emergency Service",
];

const EmergencyContactsScreen: React.FC<EmergencyContactsScreenProps> = ({
  onBack,
  initialContacts = DEFAULT_CONTACTS,
}) => {
  const [contacts, setContacts] =
    useState<EmergencyContact[]>(initialContacts);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Son / Daughter");
  const [phone, setPhone] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const openAddModal = () => {
    Haptics.selectionAsync();
    setEditingContactId(null);
    setName("");
    setRelationship("Son / Daughter");
    setPhone("");
    setIsPrimary(contacts.length === 0);
    setModalVisible(true);
  };

  const openEditModal = (contact: EmergencyContact) => {
    Haptics.selectionAsync();
    setEditingContactId(contact.id);
    setName(contact.name);
    setRelationship(contact.relationship);
    setPhone(contact.phone);
    setIsPrimary(!!contact.isPrimary);
    setModalVisible(true);
  };

  const handleCall = (phoneNumber: string, contactName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Toast.show({
            type: "error",
            text1: "Cannot Call",
            text2: `Dialing not supported on this device (${phoneNumber})`,
            position: "top",
          });
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.error("An error occurred", err));
  };

  const handleSaveContact = () => {
    if (!name.trim() || !phone.trim()) {
      Toast.show({
        type: "error",
        text1: "Fields Required",
        text2: "Please enter both contact name and phone number.",
        position: "top",
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    let updatedList = [...contacts];

    if (isPrimary) {
      updatedList = updatedList.map((c) => ({ ...c, isPrimary: false }));
    }

    if (editingContactId) {
      updatedList = updatedList.map((c) =>
        c.id === editingContactId
          ? {
              ...c,
              name: name.trim(),
              relationship,
              phone: phone.trim(),
              isPrimary,
            }
          : c
      );
      Toast.show({
        type: "success",
        text1: "Contact Updated",
        text2: `${name} has been updated.`,
        position: "top",
      });
    } else {
      const newContact: EmergencyContact = {
        id: Date.now().toString(),
        name: name.trim(),
        relationship,
        phone: phone.trim(),
        isPrimary: isPrimary || updatedList.length === 0,
      };
      updatedList.push(newContact);
      Toast.show({
        type: "success",
        text1: "Contact Added",
        text2: `${name} added to emergency list.`,
        position: "top",
      });
    }

    setContacts(updatedList);
    setModalVisible(false);
  };

  const handleDeleteContact = (id: string, contactName: string) => {
    Alert.alert(
      "Delete Contact",
      `Are you sure you want to remove "${contactName}" from your emergency contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setContacts((prev) => prev.filter((c) => c.id !== id));
            Toast.show({
              type: "info",
              text1: "Contact Removed",
              text2: `${contactName} deleted.`,
              position: "top",
            });
          },
        },
      ]
    );
  };

  const primaryContact = contacts.find((c) => c.isPrimary);
  const otherContacts = contacts.filter((c) => !c.isPrimary);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

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
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <TouchableOpacity
          style={styles.addIconBtn}
          onPress={openAddModal}
          accessibilityLabel="Add emergency contact"
        >
          <MaterialCommunityIcons
            name="plus"
            size={26}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons
            name="shield-alert-outline"
            size={24}
            color={colors.error}
          />
          <Text style={styles.infoBannerText}>
            Your Primary Contact will be dialed automatically during voice SOS or
            when you press the emergency button.
          </Text>
        </View>

        {/* PRIMARY CONTACT HERO CARD */}
        <Text style={styles.sectionTitle}>Primary SOS Contact</Text>
        {primaryContact ? (
          <View style={styles.primaryCard}>
            <View style={styles.primaryBadgeRow}>
              <View style={styles.primaryBadge}>
                <MaterialCommunityIcons
                  name="star"
                  size={14}
                  color={colors.error}
                />
                <Text style={styles.primaryBadgeText}>PRIMARY SOS</Text>
              </View>
              <TouchableOpacity
                onPress={() => openEditModal(primaryContact)}
                accessibilityLabel={`Edit ${primaryContact.name}`}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={22}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.primaryContentRow}>
              <View style={styles.primaryAvatar}>
                <MaterialCommunityIcons
                  name="account-heart"
                  size={36}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.primaryInfo}>
                <Text style={styles.primaryName}>{primaryContact.name}</Text>
                <Text style={styles.primaryRelation}>
                  {primaryContact.relationship}
                </Text>
                <Text style={styles.primaryPhone}>
                  📞 {primaryContact.phone}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryCallBtn}
              onPress={() =>
                handleCall(primaryContact.phone, primaryContact.name)
              }
              accessibilityLabel={`Call ${primaryContact.name} now`}
            >
              <MaterialCommunityIcons
                name="phone"
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.primaryCallBtnText}>
                Call {primaryContact.name} Now
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.emptyPrimaryCard}
            onPress={openAddModal}
          >
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={36}
              color={colors.error}
            />
            <Text style={styles.emptyPrimaryText}>
              Set a Primary Emergency Contact
            </Text>
          </TouchableOpacity>
        )}

        {/* OTHER CONTACTS LIST */}
        <Text style={styles.sectionTitle}>Additional Contacts</Text>
        {otherContacts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyBoxText}>
              No additional emergency contacts added yet.
            </Text>
          </View>
        ) : (
          otherContacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactAvatar}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={26}
                  color={colors.primary}
                />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelation}>
                  {contact.relationship}
                </Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleCall(contact.phone, contact.name)}
                  accessibilityLabel={`Call ${contact.name}`}
                >
                  <MaterialCommunityIcons
                    name="phone"
                    size={20}
                    color={colors.successDark}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => openEditModal(contact)}
                  accessibilityLabel={`Edit ${contact.name}`}
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={20}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDeleteContact(contact.id, contact.name)}
                  accessibilityLabel={`Delete ${contact.name}`}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Big Add Button */}
        <TouchableOpacity
          style={styles.addBigBtn}
          onPress={openAddModal}
          accessibilityLabel="Add another emergency contact"
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
          <Text style={styles.addBigBtnText}>Add Emergency Contact</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ADD / EDIT CONTACT MODAL */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingContactId ? "Edit Contact" : "Add Emergency Contact"}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Son - Dilmin"
                placeholderTextColor={colors.text.disabled}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 0771234567"
                placeholderTextColor={colors.text.disabled}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relationship</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relScroll}
              >
                {RELATIONSHIPS.map((rel) => {
                  const sel = relationship === rel;
                  return (
                    <TouchableOpacity
                      key={rel}
                      style={[styles.relChip, sel && styles.relChipSelected]}
                      onPress={() => setRelationship(rel)}
                    >
                      <Text
                        style={[
                          styles.relChipText,
                          sel && styles.relChipTextSelected,
                        ]}
                      >
                        {rel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Set as Primary SOS Contact</Text>
              <Switch
                value={isPrimary}
                onValueChange={setIsPrimary}
                trackColor={{ false: "#E2E8F0", true: colors.errorContainer }}
                thumbColor={isPrimary ? colors.error : "#F5F5F5"}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleSaveContact}
              >
                <Text style={styles.saveModalBtnText}>Save Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addIconBtn: {
    padding: spacing.s1,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s10,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.errorContainer,
    borderRadius: radius.lg,
    padding: spacing.s3,
    marginBottom: spacing.s5,
    gap: spacing.s2,
  },
  infoBannerText: {
    ...typography.bodySmall,
    color: colors.errorDark,
    flex: 1,
    fontWeight: "600",
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    fontWeight: "800",
    marginBottom: spacing.s3,
  },
  primaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s4,
    marginBottom: spacing.s5,
    borderWidth: 2,
    borderColor: colors.error,
    ...elevation.e3,
  },
  primaryBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.s3,
  },
  primaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.errorContainer,
    paddingHorizontal: spacing.s2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 4,
  },
  primaryBadgeText: {
    ...typography.labelSmall,
    color: colors.errorDark,
    fontWeight: "800",
  },
  primaryContentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.s4,
  },
  primaryAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.s3,
  },
  primaryInfo: {
    flex: 1,
  },
  primaryName: {
    ...typography.headlineSmall,
    color: colors.text.primary,
    fontWeight: "800",
  },
  primaryRelation: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: 2,
  },
  primaryPhone: {
    ...typography.titleSmall,
    color: colors.errorDark,
    fontWeight: "700",
    marginTop: 4,
  },
  primaryCallBtn: {
    backgroundColor: colors.error,
    borderRadius: radius.pill,
    paddingVertical: spacing.s3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s2,
  },
  primaryCallBtnText: {
    ...typography.titleMedium,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  emptyPrimaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.errorContainer,
    borderStyle: "dashed",
    marginBottom: spacing.s5,
    gap: spacing.s2,
  },
  emptyPrimaryText: {
    ...typography.titleMedium,
    color: colors.error,
    fontWeight: "700",
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s3,
    marginBottom: spacing.s2,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e1,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.s3,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...typography.titleMedium,
    color: colors.text.primary,
    fontWeight: "700",
  },
  contactRelation: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },
  contactPhone: {
    ...typography.labelMedium,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: "row",
    gap: spacing.s1,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyBox: {
    paddingVertical: spacing.s5,
    alignItems: "center",
  },
  emptyBoxText: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
  },
  addBigBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.lg,
    paddingVertical: spacing.s3,
    marginTop: spacing.s3,
    gap: spacing.s2,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addBigBtnText: {
    ...typography.titleSmall,
    color: colors.primary,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: spacing.s5,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s5,
    ...elevation.e5,
  },
  modalTitle: {
    ...typography.headlineSmall,
    color: colors.text.primary,
    fontWeight: "800",
    marginBottom: spacing.s4,
  },
  inputGroup: {
    marginBottom: spacing.s3,
  },
  label: {
    ...typography.labelMedium,
    color: colors.text.primary,
    marginBottom: spacing.s1,
  },
  input: {
    height: 50,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s3,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  relScroll: {
    gap: spacing.s2,
  },
  relChip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  relChipSelected: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  relChipText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },
  relChipTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: spacing.s3,
  },
  switchLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.s3,
    marginTop: spacing.s3,
  },
  cancelBtn: {
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s4,
  },
  cancelBtnText: {
    ...typography.titleSmall,
    color: colors.text.secondary,
  },
  saveModalBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s5,
  },
  saveModalBtnText: {
    ...typography.titleSmall,
    color: colors.text.inverse,
    fontWeight: "700",
  },
});

export default EmergencyContactsScreen;

/**
 * EditProfileScreen.tsx — Screen ELDER-S30 (Edit Personal Information Screen)
 * Spec: es30.txt
 *
 * Requirements (es30.txt):
 *  1. Header: Back arrow (←), Title "Personal Information".
 *  2. Editable Fields (es30.txt Section 2, 4, 5, 7, 358-381):
 *     - Full Name Input (Prefilled with "Kamal Perera", required, supports Sinhala/Tamil/English)
 *     - Date of Birth Input (Prefilled with "12 March 1952" 📅, future dates rejected)
 *     - Preferred Language Selector (Sinhala / Tamil / English)
 *  3. Save Action (es30.txt Section 10 & 169):
 *     - [ SAVE CHANGES ] button (≥52dp height)
 *     - Updates local profile state immediately (100% Offline-First)
 *  4. Unsaved Changes Alert Modal (es30.txt Section 15):
 *     - Triggers on Back if form is dirty: "Discard changes? Your changes have not been saved. [ KEEP EDITING ] [ DISCARD ]"
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';

interface EditProfileProps {
  userData?: any;
  token?: string;
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onSave?: (updatedUser: any) => Promise<void> | void;
}

const EditProfileScreen: React.FC<EditProfileProps> = ({
  userData,
  onBack,
  onNavigate,
  onSave,
}) => {
  const initialName = userData?.name || 'Kamal Perera';
  const initialDob = userData?.date_of_birth || '12 March 1952';
  const initialLang = userData?.preferred_language || 'Sinhala';

  const [name, setName] = useState(initialName);
  const [dob, setDob] = useState(initialDob);
  const [language, setLanguage] = useState<'Sinhala' | 'Tamil' | 'English'>(initialLang);

  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  const isDirty = name !== initialName || dob !== initialDob || language !== initialLang;

  const handleBackPress = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      onBack();
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter your name.',
        position: 'top',
      });
      return;
    }

    const updated = {
      ...userData,
      name: name.trim(),
      date_of_birth: dob.trim(),
      preferred_language: language,
    };

    if (onSave) {
      onSave(updated);
    }

    Toast.show({
      type: 'success',
      text1: 'Profile Updated ✓',
      text2: 'Your personal information was saved.',
      position: 'top',
    });

    onBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es30.txt Section 1) ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackPress}
          accessible={true}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── FULL NAME INPUT (es30.txt Section 4) ─── */}
        <View style={styles.inputSection}>
          <Text style={styles.fieldLabel}>Your name</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
        </View>

        {/* ─── DATE OF BIRTH INPUT (es30.txt Section 5) ─── */}
        <View style={styles.inputSection}>
          <Text style={styles.fieldLabel}>Date of birth</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={dob}
              onChangeText={setDob}
              placeholder="12 March 1952"
              placeholderTextColor={colors.text.tertiary}
            />
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color={colors.primary} />
          </View>
        </View>

        {/* ─── PREFERRED LANGUAGE SELECTOR (es30.txt Section 7) ─── */}
        <View style={styles.inputSection}>
          <Text style={styles.fieldLabel}>Preferred language</Text>
          <TouchableOpacity
            style={styles.inputBoxBtn}
            onPress={() => setShowLangModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.langValueText}>{language}</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* ─── SAVE CHANGES CTA (es30.txt Section 10 & 377) ─── */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Save Changes"
        >
          <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── UNSAVED CHANGES DISCARD MODAL (es30.txt Section 15) ─── */}
      <Modal
        visible={showDiscardModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDiscardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.modalTitle}>Discard changes?</Text>
            <Text style={styles.modalSubtitle}>
              Your changes have not been saved.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalKeepBtn}
                onPress={() => setShowDiscardModal(false)}
              >
                <Text style={styles.modalKeepBtnText}>KEEP EDITING</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalDiscardBtn} onPress={onBack}>
                <Text style={styles.modalDiscardBtnText}>DISCARD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── LANGUAGE SELECTION MODAL (es30.txt Section 7) ─── */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Preferred Language</Text>
            {(['Sinhala', 'Tamil', 'English'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langOptionCard,
                  language === lang && styles.langOptionSelected,
                ]}
                onPress={() => {
                  setLanguage(lang);
                  setShowLangModal(false);
                }}
              >
                <Text
                  style={[
                    styles.langOptionText,
                    language === lang && styles.langOptionTextSelected,
                  ]}
                >
                  {lang === 'Sinhala' ? 'Sinhala (සිංහල)' : lang === 'Tamil' ? 'Tamil (தமிழ்)' : 'English'}
                </Text>
                {language === lang && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.onPrimary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowLangModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNavBar activeTab="profile" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4 || 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s5 || 20,
    paddingBottom: 110,
  },
  inputSection: {
    marginBottom: spacing.s5 || 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: radius.xl || 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  inputBoxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: radius.xl || 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    padding: 0,
  },
  langValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  saveBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    ...elevation.e2,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    ...elevation.e3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalKeepBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeepBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  modalDiscardBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: colors.status.missed.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDiscardBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.error,
  },
  langOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  langOptionSelected: {
    backgroundColor: colors.primary,
  },
  langOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  langOptionTextSelected: {
    color: colors.onPrimary,
  },
  modalCloseBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
  },
});

export default EditProfileScreen;

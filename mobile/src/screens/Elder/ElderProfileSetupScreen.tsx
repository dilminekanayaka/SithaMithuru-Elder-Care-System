/**
 * ElderProfileSetupScreen.tsx — Screen ELDER-S04 (Elder Profile Setup Screen)
 * Spec: es4.txt
 *
 * Requirements (es4.txt):
 *  • Step 3 of 3 in Onboarding sequence (Splash -> Welcome -> Language Selection -> Profile Setup)
 *  • Required Fields: First Name, Last Name, Date of Birth
 *  • Optional Field: Profile Photo
 *  • Accepts Sinhala, Tamil, and English names (no restrictive [A-Za-z] regex)
 *  • Native / Modal Date Picker for DOB (Future dates rejected, age auto-calculated)
 *  • Add Photo opens bottom sheet modal (Camera/Gallery permissions requested ONLY on tap)
 *  • CONTINUE button is DISABLED until required fields are valid
 *  • Local-first: Saves profile locally in AsyncStorage & SecureStore, works 100% offline
 *  • Top header back arrow + Android hardware back navigation to Language Selection screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
  Modal,
  BackHandler,
  AccessibilityInfo,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, radius, elevation } from '../../theme';
import { STORE_USER } from '../../services/startupService';

const { width } = Dimensions.get('window');

interface ElderProfileSetupScreenProps {
  onComplete: (profileData: any) => void;
  onBack?: () => void;
  initialData?: any;
}

const ONBOARDING_STATUS_KEY = 'sithamithuru_onboarding_status';

const ElderProfileSetupScreen: React.FC<ElderProfileSetupScreenProps> = ({
  onComplete,
  onBack,
  initialData,
}) => {
  // Form State
  const [firstName, setFirstName] = useState(initialData?.firstName || initialData?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(initialData?.lastName || initialData?.name?.split(' ').slice(1).join(' ') || '');
  const [dob, setDob] = useState<Date | null>(
    initialData?.dateOfBirth ? new Date(initialData.dateOfBirth) : null
  );
  const [profilePhoto, setProfilePhoto] = useState<string | null>(initialData?.profilePhoto || null);

  // Validation Error Messages
  const [firstNameError, setFirstNameError] = useState<string>('');
  const [lastNameError, setLastNameError] = useState<string>('');
  const [dobError, setDobError] = useState<string>('');

  // UI Modals / Pickers
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Screen Mount Accessibility
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      'Elder Profile Setup. Step 3 of 3. Please enter your first name, last name, and date of birth.'
    );
  }, []);

  // Hardware Back Button Handler (es4.txt Section 32)
  useEffect(() => {
    const handleBackPress = () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => sub.remove();
  }, [onBack]);

  // Real-time Form Validation
  const validateFirstName = (text: string) => {
    setFirstName(text);
    if (!text.trim()) {
      setFirstNameError('Please enter your first name.');
    } else {
      setFirstNameError('');
    }
  };

  const validateLastName = (text: string) => {
    setLastName(text);
    if (!text.trim()) {
      setLastNameError('Please enter your last name.');
    } else {
      setLastNameError('');
    }
  };

  const validateDob = (selectedDate: Date) => {
    const today = new Date();
    if (selectedDate > today) {
      setDobError('Please select a valid date of birth.');
      return false;
    } else {
      setDobError('');
      setDob(selectedDate);
      return true;
    }
  };

  // Age Calculator from DOB (es4.txt Section 2 & 13)
  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Date Picker Change Handler
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      validateDob(selectedDate);
    }
  };

  // Photo Selector Actions (es4.txt Section 6 & 7: Permissions requested ONLY on tap)
  const handleTakePhoto = async () => {
    setShowPhotoModal(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.granted) {
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setProfilePhoto(result.assets[0].uri);
        }
      }
    } catch (err) {
      console.warn('Camera error:', err);
    }
  };

  const handleChooseGallery = async () => {
    setShowPhotoModal(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.granted) {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setProfilePhoto(result.assets[0].uri);
        }
      }
    } catch (err) {
      console.warn('Gallery error:', err);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setShowPhotoModal(false);
  };

  // Check if Form is Complete & Valid for CONTINUE button (es4.txt Section 14)
  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    dob !== null &&
    dob <= new Date() &&
    !firstNameError &&
    !lastNameError &&
    !dobError;

  // Local-First Profile Save (es4.txt Section 22, 23 & 24)
  const handleContinuePress = useCallback(async () => {
    if (!isFormValid || !dob) return;

    setSaving(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const computedAge = calculateAge(dob);

    const profileData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: fullName,
      dateOfBirth: dob.toISOString(),
      age: computedAge,
      profilePhoto: profilePhoto,
      role: 'Elder',
      profileCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Save local session in SecureStore & AsyncStorage
      const existingUserStr = await SecureStore.getItemAsync(STORE_USER);
      let existingUser = {};
      if (existingUserStr) {
        try {
          existingUser = JSON.parse(existingUserStr);
        } catch {}
      }

      const mergedUser = { ...existingUser, ...profileData };
      await SecureStore.setItemAsync(STORE_USER, JSON.stringify(mergedUser));
      await AsyncStorage.setItem('userData', JSON.stringify(mergedUser));
      await AsyncStorage.setItem(ONBOARDING_STATUS_KEY, 'COMPLETED');
    } catch (err) {
      console.warn('Local save warning:', err);
    }

    setSaving(false);
    onComplete(profileData);
  }, [firstName, lastName, dob, profilePhoto, isFormValid, onComplete]);

  // Formatted Date String for display
  const formattedDob = dob
    ? dob.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* TOP HEADER WITH BACK ARROW & STEP 3 OF 3 LABEL */}
      <View style={styles.topHeader}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back to Language Selection"
          >
            <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <Text style={styles.stepHeaderLabel}>Step 3 of 3</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* TITLE & DESCRIPTION */}
          <View style={styles.titleBox}>
            <Text style={styles.mainTitle}>Tell us about you</Text>
            <Text style={styles.subTitle}>Let's set up your profile.</Text>
          </View>

          {/* PROFILE PHOTO CONTAINER (es4.txt Section 5 & 18: Optional, 110dp circular) */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => setShowPhotoModal(true)}
              activeOpacity={0.85}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Add profile photo"
            >
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
              ) : (
                <MaterialCommunityIcons name="account" size={64} color={colors.text.tertiary} />
              )}
              <View style={styles.cameraBadge}>
                <MaterialCommunityIcons name="camera" size={16} color={colors.onPrimary} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPhotoModal(true)}>
              <Text style={styles.addPhotoText}>
                {profilePhoto ? 'Change photo' : 'Add photo (Optional)'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* FORM FIELDS CARD */}
          <View style={styles.formCard}>
            {/* FIRST NAME INPUT (es4.txt Section 8 & 21: Visible label above input) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                First name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={[styles.inputWrapper, firstNameError ? styles.inputWrapperError : null]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your first name"
                  placeholderTextColor={colors.text.tertiary}
                  value={firstName}
                  onChangeText={validateFirstName}
                  autoCapitalize="words"
                  accessible={true}
                  accessibilityLabel="First name input"
                />
              </View>
              {firstNameError ? <Text style={styles.errorText}>{firstNameError}</Text> : null}
            </View>

            {/* LAST NAME INPUT (es4.txt Section 9 & 21) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Last name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={[styles.inputWrapper, lastNameError ? styles.inputWrapperError : null]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your last name"
                  placeholderTextColor={colors.text.tertiary}
                  value={lastName}
                  onChangeText={validateLastName}
                  autoCapitalize="words"
                  accessible={true}
                  accessibilityLabel="Last name input"
                />
              </View>
              {lastNameError ? <Text style={styles.errorText}>{lastNameError}</Text> : null}
            </View>

            {/* DATE OF BIRTH PICKER (es4.txt Section 11 & 12: Native Date Picker, Future dates rejected) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Date of birth <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.inputWrapper, dobError ? styles.inputWrapperError : null]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.85}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={dob ? `Date of birth: ${formattedDob}` : 'Select date of birth'}
              >
                <Text style={[styles.dateText, !dob && styles.datePlaceholder]}>
                  {dob ? formattedDob : 'Select date'}
                </Text>
                <MaterialCommunityIcons name="calendar-month" size={24} color={colors.primary || colors.primary} />
              </TouchableOpacity>
              {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}

              {/* Show calculated age if DOB selected */}
              {dob && !dobError ? (
                <Text style={styles.ageHintText}>Age: {calculateAge(dob)} years old</Text>
              ) : null}
            </View>

            {/* RENDER DATE PICKER FOR ANDROID/IOS */}
            {showDatePicker && (
              <DateTimePicker
                value={dob || new Date(1955, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()} // Prevent future dates
                onChange={handleDateChange}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FOOTER: CONTINUE BUTTON (DISABLED UNTIL FORM IS VALID) */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isFormValid || saving ? styles.continueButtonDisabled : styles.continueButtonEnabled,
          ]}
          onPress={handleContinuePress}
          disabled={!isFormValid || saving}
          activeOpacity={0.85}
          accessible={true}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isFormValid || saving }}
          accessibilityLabel="Continue"
        >
          <Text
            style={[
              styles.buttonText,
              !isFormValid || saving ? styles.buttonTextDisabled : styles.buttonTextEnabled,
            ]}
          >
            {saving ? 'SAVING...' : 'CONTINUE'}
          </Text>
          {isFormValid && !saving ? (
            <MaterialCommunityIcons name="arrow-right" size={22} color={colors.onPrimary} style={{ marginLeft: 8 }} />
          ) : null}
        </TouchableOpacity>
      </View>

      {/* PROFILE PHOTO SELECTION BOTTOM SHEET MODAL (es4.txt Section 6) */}
      <Modal
        visible={showPhotoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoModal(false)}
        >
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetIndicator} />
              <Text style={styles.bottomSheetTitle}>Add Profile Photo</Text>
            </View>

            <TouchableOpacity style={styles.modalOptionButton} onPress={handleTakePhoto}>
              <MaterialCommunityIcons name="camera" size={24} color={colors.primary || colors.primary} />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOptionButton} onPress={handleChooseGallery}>
              <MaterialCommunityIcons name="image-album" size={24} color={colors.primary || colors.primary} />
              <Text style={styles.modalOptionText}>Choose From Gallery</Text>
            </TouchableOpacity>

            {profilePhoto && (
              <TouchableOpacity style={styles.modalOptionButton} onPress={handleRemovePhoto}>
                <MaterialCommunityIcons name="trash-can-outline" size={24} color={colors.error} />
                <Text style={[styles.modalOptionText, { color: colors.error }]}>Remove Photo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowPhotoModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4 || 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  stepHeaderLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s3 || 12,
    paddingBottom: spacing.s8 || 32,
    alignItems: 'center',
  },
  titleBox: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    marginBottom: spacing.s5 || 20,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.s6 || 24,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: colors.surface,
    ...elevation.e2,
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary || colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary || colors.primary,
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  inputGroup: {
    marginBottom: spacing.s5 || 20,
  },
  inputLabel: {
    fontSize: 16, // es4.txt Section 19: 16-18sp label
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  requiredStar: {
    color: colors.error,
  },
  inputWrapper: {
    width: '100%',
    height: 54, // es4.txt Section 19: 52-56dp height
    backgroundColor: colors.background,
    borderRadius: radius.lg || 14,
    borderWidth: 1.5,
    borderColor: colors.outline,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputWrapperError: {
    borderColor: colors.error,
    backgroundColor: colors.errorContainer,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 18, // es4.txt Section 19: 18sp+ input
    fontWeight: '500',
    color: colors.text.primary,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text.primary,
  },
  datePlaceholder: {
    color: colors.text.tertiary,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
    marginTop: 4,
  },
  ageHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: spacing.s5 || 20,
    paddingVertical: spacing.s4 || 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    maxWidth: 420,
    height: 56, // es4.txt Section 19: 56dp height
    borderRadius: radius.lg || 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: colors.outline,
    elevation: 0,
    shadowOpacity: 0,
  },
  continueButtonEnabled: {
    backgroundColor: colors.primary || colors.primary,
    elevation: 4,
    shadowColor: colors.primary || colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  buttonTextDisabled: {
    color: colors.text.tertiary,
  },
  buttonTextEnabled: {
    color: colors.onPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl || 24,
    borderTopRightRadius: radius.xxl || 24,
    paddingHorizontal: spacing.s5 || 20,
    paddingBottom: spacing.s8 || 32,
    paddingTop: spacing.s3 || 12,
  },
  bottomSheetHeader: {
    alignItems: 'center',
    marginBottom: spacing.s4 || 16,
  },
  bottomSheetIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outline,
    marginBottom: 12,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.outlineVariant,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 16,
  },
  modalCancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.lg || 12,
    backgroundColor: colors.surfaceVariant,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
  },
});

export default ElderProfileSetupScreen;

/**
 * EditMemoryScreen.tsx — Screen ELDER-S24 (Edit Memory Screen)
 * Spec: es24.txt
 *
 * Requirements (es24.txt):
 *  1. Header: Back arrow (←), Title "Edit Memory".
 *  2. Pre-Filled Form (Section 3):
 *     - Pre-filled Title ("My Daughter's Birthday")
 *     - Pre-filled Content ("We had a wonderful day together...")
 *     - Pre-filled Date ("10 August 2026")
 *     - Pre-filled Photo with Change Photo / Remove Photo options
 *  3. Editable Fields: Title, Content (with Voice Dictation 🎤), Date, Photo.
 *  4. Validation:
 *     - Title required
 *     - If no photo, content is required
 *  5. Unsaved Changes Alert: "Discard changes? Your changes have not been saved." modal.
 *  6. Primary CTA: [ SAVE CHANGES ] (≥52dp height).
 *  7. Secondary Action: Delete Memory button at bottom with confirmation modal.
 *  8. 100% Offline-First
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
  Image,
  Modal,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import VoiceDictationModal from '../../components/VoiceDictationModal';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';

interface MemoryEditData {
  id: string;
  title: string;
  dateStr: string;
  content: string;
  imageUri?: string;
}

interface EditMemoryProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  memoryData?: MemoryEditData;
  onSave?: (memory: MemoryEditData) => void;
}

const DEFAULT_EDIT_MEMORY: MemoryEditData = {
  id: 'm_default',
  title: "My Daughter's Birthday",
  dateStr: '10 August 2026',
  content:
    'We had a wonderful day together with the family. We had lunch and spent the afternoon together.',
  imageUri: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800',
};

const EditMemoryScreen: React.FC<EditMemoryProps> = ({
  onBack,
  onNavigate,
  memoryData = DEFAULT_EDIT_MEMORY,
  onSave,
}) => {
  const [title, setTitle] = useState(memoryData.title);
  const [content, setContent] = useState(memoryData.content);
  const [memoryDate, setMemoryDate] = useState(memoryData.dateStr);
  const [photoUri, setPhotoUri] = useState<string | undefined>(memoryData.imageUri);

  const [dictationVisible, setDictationVisible] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  const isFormDirty =
    title !== memoryData.title ||
    content !== memoryData.content ||
    memoryDate !== memoryData.dateStr ||
    photoUri !== memoryData.imageUri;

  const handleBackPress = () => {
    if (isFormDirty) {
      setShowDiscardModal(true);
    } else {
      onBack();
    }
  };

  const handlePickFromGallery = async () => {
    setShowPhotoPicker(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Permission Needed', text2: 'Allow photo library access to add a photo.', position: 'top' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    setShowPhotoPicker(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Permission Needed', text2: 'Allow camera access to take a photo.', position: 'top' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSaveChanges = async () => {
    if (!title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Title Required',
        text2: 'Please enter a title for your memory.',
        position: 'top',
      });
      return;
    }

    if (!photoUri && !content.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Content Required',
        text2: 'Add a photo or write something about this memory.',
        position: 'top',
      });
      return;
    }

    const updatedMemory: MemoryEditData = {
      id: memoryData.id,
      title: title.trim(),
      content: content.trim(),
      dateStr: memoryDate,
      imageUri: photoUri,
    };

    try {
      const { getDB } = require('../../database/db');
      const db = await getDB();
      await db.runAsync(
        `UPDATE memories_local SET title = ?, description = ?, image_uri = ?, updated_at = ? WHERE id = ?`,
        [updatedMemory.title, updatedMemory.content, updatedMemory.imageUri || null, new Date().toISOString(), updatedMemory.id]
      );
    } catch (e) {
      console.warn('Failed to update memory in SQLite:', e);
      Toast.show({ type: 'error', text1: 'Save Failed', text2: 'Could not save your changes. Please try again.', position: 'top' });
      return;
    }

    if (onSave) onSave(updatedMemory);

    Toast.show({
      type: 'success',
      text1: 'Memory Updated',
      text2: 'Your memory changes have been saved.',
      position: 'top',
    });

    onNavigate('memoryDetails');
  };

  const handleConfirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      const { getDB } = require('../../database/db');
      const db = await getDB();
      await db.runAsync('DELETE FROM memories_local WHERE id = ?', [memoryData.id]);
    } catch (e) {
      console.warn('Failed to delete memory from SQLite:', e);
    }
    Toast.show({
      type: 'info',
      text1: 'Memory Removed',
      text2: 'The memory has been deleted.',
      position: 'top',
    });
    onNavigate('memories');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es24.txt Section 1) ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackPress}
          accessible={true}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Memory</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── PHOTO EDITING AREA (es24.txt Section 5 & 6) ─── */}
        {photoUri ? (
          <View style={styles.photoBox}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
            <View style={styles.photoActionRow}>
              <TouchableOpacity
                style={styles.photoActionBtn}
                onPress={() => setShowPhotoPicker(true)}
              >
                <MaterialCommunityIcons name="camera-outline" size={18} color={colors.primary} />
                <Text style={styles.photoActionText}>Change Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoActionBtn, styles.photoRemoveBtn]}
                onPress={() => setPhotoUri(undefined)}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                <Text style={[styles.photoActionText, { color: colors.error }]}>Remove Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addPhotoArea}
            onPress={() => setShowPhotoPicker(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="camera-plus-outline" size={40} color={colors.primary} />
            <Text style={styles.addPhotoText}>+ Add Photo</Text>
          </TouchableOpacity>
        )}

        {/* ─── TITLE FIELD (es24.txt Section 4 & 7) ─── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Title *</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Title your memory"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        {/* ─── MEMORY CONTENT FIELD (es24.txt Section 4 & 25) ─── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Your memory</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textAreaInput}
              value={content}
              onChangeText={setContent}
              placeholder="Write about this memory..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => setDictationVisible(true)}
              accessible={true}
              accessibilityLabel="Dictate text with voice"
            >
              <MaterialCommunityIcons name="microphone" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── MEMORY DATE FIELD (es24.txt Section 10 & 26) ─── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Memory date</Text>
          <View style={styles.chipRow}>
            {['10 August 2026', '08 August 2026', '12 April 1965'].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dateChip, memoryDate === d && styles.dateChipSelected]}
                onPress={() => setMemoryDate(d)}
              >
                <MaterialCommunityIcons
                  name="calendar-month-outline"
                  size={18}
                  color={memoryDate === d ? colors.onPrimary : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.dateChipText,
                    memoryDate === d && styles.dateChipTextSelected,
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── SAVE CHANGES PRIMARY CTA (es24.txt Section 11 & 46) ─── */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveChanges}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Save Changes"
        >
          <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
        </TouchableOpacity>

        {/* ─── DELETE MEMORY SECONDARY ACTION (es24.txt Section 16 & 49) ─── */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => setShowDeleteModal(true)}
          accessible={true}
          accessibilityLabel="Delete Memory"
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
          <Text style={styles.deleteBtnText}>Delete Memory</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── PHOTO PICKER MODAL ─── */}
      <Modal
        visible={showPhotoPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoPicker(false)}
        >
          <View style={styles.pickerBox}>
            <Text style={styles.pickerTitle}>Change Photo</Text>
            <TouchableOpacity
              style={styles.pickerItem}
              onPress={handlePickFromGallery}
            >
              <MaterialCommunityIcons name="image-multiple-outline" size={24} color={colors.primary} />
              <Text style={styles.pickerItemText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerItem}
              onPress={handleTakePhoto}
            >
              <MaterialCommunityIcons name="camera-outline" size={24} color={colors.primary} />
              <Text style={styles.pickerItemText}>Take a Photo</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── DISCARD CHANGES MODAL (es24.txt Section 18) ─── */}
      <Modal
        visible={showDiscardModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDiscardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.warning} />
            <Text style={styles.modalTitle}>Discard changes?</Text>
            <Text style={styles.modalSubtitle}>Your changes have not been saved.</Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalStayBtn}
                onPress={() => setShowDiscardModal(false)}
              >
                <Text style={styles.modalStayBtnText}>KEEP EDITING</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalLeaveBtn}
                onPress={() => {
                  setShowDiscardModal(false);
                  onBack();
                }}
              >
                <Text style={styles.modalLeaveBtnText}>DISCARD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── DELETE CONFIRMATION MODAL (es24.txt Section 16) ─── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="trash-can-outline" size={48} color={colors.error} />
            <Text style={styles.modalTitle}>Delete this memory?</Text>
            <Text style={styles.modalSubtitle}>
              This memory and its photos will be removed from your account.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalStayBtn}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalStayBtnText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalLeaveBtn}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.modalLeaveBtnText}>DELETE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Voice Dictation Modal */}
      <VoiceDictationModal
        visible={dictationVisible}
        onClose={() => setDictationVisible(false)}
        onTextDictated={(t) => setContent(t)}
        fieldType="journal_content"
        fieldName="Memory Story"
      />

      <BottomNavBar activeTab="memories" onNavigate={onNavigate} />
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
  photoBox: {
    marginBottom: spacing.s5 || 20,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: radius.xxl || 24,
    marginBottom: 10,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    gap: 6,
  },
  photoRemoveBtn: {
    borderColor: colors.status.missed.border,
    backgroundColor: colors.errorContainer,
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  addPhotoArea: {
    height: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s5 || 20,
  },
  addPhotoText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
  },
  fieldGroup: {
    marginBottom: spacing.s5 || 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    height: 52,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text.primary,
  },
  textAreaContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 12,
  },
  textAreaInput: {
    height: 100,
    fontSize: 16,
    color: colors.text.primary,
  },
  micBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  dateChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  dateChipTextSelected: {
    color: colors.onPrimary,
  },
  saveBtn: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
    ...elevation.e3,
  },
  saveBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  deleteBtn: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: colors.errorContainer,
    borderRadius: radius.lg || 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.status.missed.border,
    gap: 8,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerBox: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    ...elevation.e3,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 14,
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.outlineVariant,
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
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
    marginTop: 12,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalStayBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalStayBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  modalLeaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLeaveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
});

export default EditMemoryScreen;

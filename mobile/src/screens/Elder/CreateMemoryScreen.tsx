/**
 * CreateMemoryScreen.tsx — Screen ELDER-S22 (Create Memory / Journal Entry Screen)
 * Spec: es22.txt
 *
 * Requirements (es22.txt):
 *  1. Header: Back arrow (←), Title "Create Memory".
 *  2. Subtitle: "Add a special moment".
 *  3. Form Fields:
 *     - Add Photo Area: (+ 📷 Add a photo) with image preview and '✕' remove button.
 *     - Title Input (Required): "My Daughter's Birthday" / "Our Family Trip".
 *     - Your Memory Text Input (Optional if photo provided): Multi-line journaling box + Voice Dictation.
 *     - Memory Date Picker: "10 August 2026" (Allows current or historical dates).
 *  4. Unsaved Changes Alert: "Leave without saving? Your memory has not been saved." modal if dirty and Back pressed.
 *  5. Primary CTA: [ SAVE MEMORY ] (≥52dp height).
 *  6. Success & Navigation: Toast notification "Memory saved" -> Redirects to My Memories.
 *  7. 100% Offline-First (Local image preview and storage).
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

interface CreateMemoryProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  elderId?: string;
  onSave?: (memory: any) => void;
}

const CreateMemoryScreen: React.FC<CreateMemoryProps> = ({ onBack, onNavigate, elderId, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [memoryDate, setMemoryDate] = useState('10 August 2026');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [dictationVisible, setDictationVisible] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  const isFormDirty = title.trim().length > 0 || content.trim().length > 0 || photoUri !== null;

  const handleBackPress = () => {
    if (isFormDirty) {
      setShowUnsavedModal(true);
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
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

  const handleSaveMemory = async () => {
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

    const memoryId = `mem_${Date.now()}`;
    const newMemory = {
      id: memoryId,
      title: title.trim(),
      content: content.trim(),
      dateStr: memoryDate,
      imageUri: photoUri || undefined,
      type: photoUri ? (content.trim() ? 'PHOTO_TEXT' : 'PHOTO') : 'TEXT',
    };

    // Offline-First: persist to the local SQLite memories table (this feature
    // has no server-side data model — memories are 100% on-device by design).
    try {
      const { getDB } = require('../../database/db');
      const db = await getDB();
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO memories_local (id, elder_id, title, description, image_uri, sync_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'local_only', ?, ?)`,
        [memoryId, elderId || 'elder_default', newMemory.title, newMemory.content, newMemory.imageUri || null, now, now]
      );
    } catch (e) {
      console.warn('Failed to save memory to SQLite:', e);
      Toast.show({ type: 'error', text1: 'Save Failed', text2: 'Could not save this memory. Please try again.', position: 'top' });
      return;
    }

    if (onSave) onSave(newMemory);

    Toast.show({
      type: 'success',
      text1: 'Memory Saved ❤️',
      text2: 'Your special moment has been preserved.',
      position: 'top',
    });

    onNavigate('memories');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es22.txt Section 1) ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackPress}
          accessible={true}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Create Memory</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── SUBTITLE BANNER (es22.txt Section 2 & 3) ─── */}
        <View style={styles.bannerBox}>
          <Text style={styles.bannerSubtitle}>Add a special moment</Text>
        </View>

        {/* ─── PHOTO SELECTION AREA (es22.txt Section 4 & 5) ─── */}
        {photoUri ? (
          <View style={styles.photoPreviewBox}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
            <TouchableOpacity
              style={styles.removePhotoBtn}
              onPress={() => setPhotoUri(null)}
              accessible={true}
              accessibilityLabel="Remove photo"
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addPhotoArea}
            onPress={() => setShowPhotoPicker(true)}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Add a photo"
          >
            <MaterialCommunityIcons name="camera-plus-outline" size={42} color={colors.primary} />
            <Text style={styles.addPhotoText}>+ Add a photo</Text>
          </TouchableOpacity>
        )}

        {/* ─── TITLE INPUT (es22.txt Section 6) ─── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Title *</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. My Daughter's Birthday"
            placeholderTextColor={colors.text.tertiary}
            accessible={true}
            accessibilityLabel="Memory title input"
          />
        </View>

        {/* ─── MEMORY TEXT / JOURNALING AREA (es22.txt Section 7) ─── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Your memory</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textAreaInput}
              value={content}
              onChangeText={setContent}
              placeholder="Write about this special moment..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              accessible={true}
              accessibilityLabel="Memory content input"
            />
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => setDictationVisible(true)}
              accessible={true}
              accessibilityLabel="Dictate memory text using voice"
            >
              <MaterialCommunityIcons name="microphone" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── MEMORY DATE (es22.txt Section 10) ─── */}
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

        {/* ─── SAVE MEMORY CTA (es22.txt Section 14 & 37) ─── */}
        <TouchableOpacity
          style={[styles.saveBtn, (!title.trim() || (!photoUri && !content.trim())) && styles.saveBtnDisabled]}
          onPress={handleSaveMemory}
          disabled={!title.trim() || (!photoUri && !content.trim())}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Save Memory"
        >
          <Text style={styles.saveBtnText}>SAVE MEMORY</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── PHOTO PICKER MODAL (es22.txt Section 4) ─── */}
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
            <Text style={styles.pickerTitle}>Add Photo</Text>
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

      {/* ─── UNSAVED CHANGES MODAL (es22.txt Section 23) ─── */}
      <Modal
        visible={showUnsavedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnsavedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.warning} />
            <Text style={styles.modalTitle}>Leave without saving?</Text>
            <Text style={styles.modalSubtitle}>Your memory has not been saved.</Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalStayBtn}
                onPress={() => setShowUnsavedModal(false)}
              >
                <Text style={styles.modalStayBtnText}>STAY</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalLeaveBtn}
                onPress={() => {
                  setShowUnsavedModal(false);
                  onBack();
                }}
              >
                <Text style={styles.modalLeaveBtnText}>LEAVE</Text>
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
  bannerBox: {
    marginBottom: spacing.s4 || 16,
  },
  bannerSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  addPhotoArea: {
    height: 140,
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
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 8,
  },
  photoPreviewBox: {
    position: 'relative',
    height: 180,
    borderRadius: radius.xxl || 24,
    overflow: 'hidden',
    marginBottom: spacing.s5 || 20,
    ...elevation.e2,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 10,
    ...elevation.e3,
  },
  saveBtnDisabled: {
    backgroundColor: colors.outline,
    elevation: 0,
  },
  saveBtnText: {
    fontSize: 18,
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

export default CreateMemoryScreen;

/**
 * MemoryDetailsScreen.tsx — Screen ELDER-S23 (Memory Details / Preview Screen)
 * Spec: es23.txt
 *
 * Requirements (es23.txt):
 *  1. Header: Back arrow (←), Overflow menu (⋮) with Edit Memory and Delete Memory choices.
 *  2. Photo Presentation:
 *     - Photo Memory: Full-width hero image (tappable to view full-screen).
 *     - Text-Only Memory: Large 📝 note icon banner.
 *  3. Title & Date: 24-26sp title ("My Daughter's Birthday") + 16-18sp date ("10 August 2026").
 *  4. Story Body: 18-20sp text with comfortable line spacing and vertical scroll.
 *  5. Actions:
 *     - [ Edit Memory ] CTA button (navigates to Screen 24 Edit Memory)
 *     - [ Delete Memory ] opens confirmation modal ("Delete this memory? This memory and its photos will be removed.")
 *  6. 100% Offline-First
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  Modal,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';

export interface MemoryDetailData {
  id: string;
  title: string;
  dateStr: string;
  content: string;
  imageUri?: string;
}

interface MemoryDetailsProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  memoryData?: MemoryDetailData;
}

const DEFAULT_MEMORY: MemoryDetailData = {
  id: 'm_default',
  title: "My Daughter's Birthday",
  dateStr: '10 August 2026',
  content:
    'We all got together for my daughter’s birthday. We had a wonderful lunch and spent the whole afternoon talking and laughing together with the family.',
  imageUri: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800',
};

const MemoryDetailsScreen: React.FC<MemoryDetailsProps> = ({
  onBack,
  onNavigate,
  memoryData = DEFAULT_MEMORY,
}) => {
  const [currentMemory, setCurrentMemory] = useState<MemoryDetailData>(memoryData);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);

  const handleConfirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      const { getDB } = require('../../database/db');
      const db = await getDB();
      await db.runAsync('DELETE FROM memories_local WHERE id = ?', [currentMemory.id]);
    } catch (e) {
      console.warn('Failed to delete memory from SQLite:', e);
    }
    Toast.show({
      type: 'info',
      text1: 'Memory Removed',
      text2: 'The memory has been deleted from your account.',
      position: 'top',
    });
    onNavigate('memories');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es23.txt Section 1) ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          accessible={true}
          accessibilityLabel="Go back to My Memories"
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Memory Details</Text>

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setShowMenuModal(true)}
          accessible={true}
          accessibilityLabel="More options"
        >
          <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── HERO PHOTO / TEXT ICON PRESENTATION (es23.txt Section 3 & 4) ─── */}
        {currentMemory.imageUri ? (
          <TouchableOpacity
            style={styles.heroImageContainer}
            onPress={() => setShowFullscreenImage(true)}
            activeOpacity={0.9}
            accessible={true}
            accessibilityLabel="View full photo"
          >
            <Image
              source={{ uri: currentMemory.imageUri }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.textOnlyHero}>
            <MaterialCommunityIcons name="notebook-outline" size={60} color={colors.primary} />
          </View>
        )}

        {/* ─── TITLE & DATE (es23.txt Section 6 & 7) ─── */}
        <View style={styles.metaSection}>
          <Text style={styles.memoryTitleText}>{currentMemory.title}</Text>
          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.memoryDateText}>{currentMemory.dateStr}</Text>
          </View>
        </View>

        {/* ─── STORY CONTENT (es23.txt Section 8 & 9) ─── */}
        <View style={styles.storyCard}>
          <Text style={styles.storyText}>{currentMemory.content}</Text>
        </View>

        {/* ─── EDIT MEMORY SECONDARY CTA (es23.txt Section 10) ─── */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onNavigate('editMemory')}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Edit Memory"
        >
          <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
          <Text style={styles.editBtnText}>Edit Memory</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── OVERFLOW MENU MODAL (es23.txt Section 11) ─── */}
      <Modal
        visible={showMenuModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenuModal(false)}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenuModal(false);
                onNavigate('editMemory');
              }}
            >
              <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
              <Text style={styles.menuItemText}>Edit Memory</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenuModal(false);
                setShowDeleteModal(true);
              }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>Delete Memory</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── DELETE CONFIRMATION MODAL (es23.txt Section 12) ─── */}
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
                style={styles.modalCancelBtn}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.modalDeleteBtnText}>DELETE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── FULLSCREEN PHOTO VIEWER MODAL (es23.txt Section 3) ─── */}
      <Modal
        visible={showFullscreenImage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFullscreenImage(false)}
      >
        <TouchableOpacity
          style={styles.fullscreenOverlay}
          activeOpacity={1}
          onPress={() => setShowFullscreenImage(false)}
        >
          <TouchableOpacity
            style={styles.closeFullscreenBtn}
            onPress={() => setShowFullscreenImage(false)}
          >
            <MaterialCommunityIcons name="close" size={28} color={colors.onPrimary} />
          </TouchableOpacity>
          {currentMemory.imageUri ? (
            <Image
              source={{ uri: currentMemory.imageUri }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          ) : null}
        </TouchableOpacity>
      </Modal>

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
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s5 || 20,
    paddingBottom: 110,
  },
  heroImageContainer: {
    height: 220,
    borderRadius: radius.xxl || 24,
    overflow: 'hidden',
    marginBottom: spacing.s5 || 20,
    ...elevation.e2,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  textOnlyHero: {
    height: 120,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s5 || 20,
  },
  metaSection: {
    marginBottom: spacing.s4 || 16,
  },
  memoryTitleText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memoryDateText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  storyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s5 || 20,
    marginBottom: spacing.s5 || 20,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  storyText: {
    fontSize: 18,
    color: colors.text.primary,
    lineHeight: 28,
  },
  editBtn: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    gap: 8,
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menuBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 8,
    width: 180,
    ...elevation.e3,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
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
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  modalDeleteBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDeleteBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullscreenBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullscreenImage: {
    width: '94%',
    height: '80%',
  },
});

export default MemoryDetailsScreen;

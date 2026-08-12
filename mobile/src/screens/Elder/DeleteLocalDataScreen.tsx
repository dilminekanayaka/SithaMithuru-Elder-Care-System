/**
 * DeleteLocalDataScreen.tsx — Screen ELDER-S77 (Delete Local Data Screen)
 * Spec: es77.txt
 *
 * Requirements (es77.txt):
 *  1. Header: Back arrow (←), Title "Delete Local Data".
 *  2. Guidance Subtitle (es77.txt Section 2):
 *     - "This will remove selected information stored on this device."
 *  3. Warning Box (es77.txt Section 2 & 5):
 *     - "⚠ Before you continue: Information that has not been synchronized may be permanently removed."
 *  4. INFORMATION THAT MAY BE REMOVED List (es77.txt Section 8):
 *     - • Local medication information
 *     - • Local reminder information
 *     - • Local notification records
 *     - • Offline synchronization data
 *     - • Selected app preferences
 *  5. Reassurance Note (es77.txt Section 2):
 *     - "This action cannot be undone."
 *  6. Action Buttons (es77.txt Section 18, 19, 20):
 *     - [ CANCEL ] CTA button -> returns to Screen 76 (localData)
 *     - [ DELETE LOCAL DATA ] Destructive CTA button -> processing state -> opens Screen 78 (localDataDeleted).
 *  7. 100% Offline-First (es77.txt Section 30 & 446)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface DeleteLocalDataProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const DeleteLocalDataScreen: React.FC<DeleteLocalDataProps> = ({
  onBack,
  onNavigate,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      Toast.show({
        type: 'info',
        text1: 'Local Data Deleted',
        text2: 'Selected local data removed.',
        position: 'top',
      });
      onNavigate('localDataDeleted');
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es77.txt Section 1) ─── */}
      <ScreenHeader title="Delete Local Data" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE SUBTITLE (es77.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          This will remove selected information stored on this device.
        </Text>

        {/* ─── WARNING BOX (es77.txt Section 2 & 5) ─── */}
        <View style={styles.warningBox}>
          <MaterialCommunityIcons name="alert-outline" size={24} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>Before you continue</Text>
            <Text style={styles.warningText}>
              Information that has not been synchronized may be permanently removed.
            </Text>
          </View>
        </View>

        {/* ─── INFORMATION THAT MAY BE REMOVED LIST (es77.txt Section 8) ─── */}
        <Text style={styles.sectionHeaderTitle}>INFORMATION THAT MAY BE REMOVED</Text>

        <View style={styles.card}>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Local medication information</Text>
          </View>

          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Local reminder information</Text>
          </View>

          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Local notification records</Text>
          </View>

          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Offline synchronization data</Text>
          </View>

          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Selected app preferences</Text>
          </View>
        </View>

        {/* ─── REASSURANCE NOTE (es77.txt Section 2) ─── */}
        <Text style={styles.footerNoteText}>This action cannot be undone.</Text>

        {/* ─── ACTION BUTTONS (es77.txt Section 18, 19, 20) ─── */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onBack}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Cancel data deletion"
        >
          <Text style={styles.cancelBtnText}>CANCEL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteBtn, isDeleting && { opacity: 0.7 }]}
          onPress={handleDelete}
          disabled={isDeleting}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Confirm Delete Local Data"
        >
          {isDeleting ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color={colors.onPrimary} />
              <Text style={styles.deleteBtnText}>Deleting Local Data...</Text>
            </View>
          ) : (
            <Text style={styles.deleteBtnText}>DELETE LOCAL DATA</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <BottomNavBar activeTab="settings" onNavigate={onNavigate} />
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
    paddingTop: spacing.s4 || 16,
    paddingBottom: 110,
  },
  guidanceText: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: colors.warningContainer,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.status.upcoming.border,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.warningDark,
    marginBottom: 2,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warningDark,
    lineHeight: 18,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    marginBottom: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 10,
  },
  bulletDot: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  bulletText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  footerNoteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  cancelBtn: {
    height: 52,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  deleteBtn: {
    height: 56,
    backgroundColor: colors.error,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e2,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
});

export default DeleteLocalDataScreen;

/**
 * DataUsageScreen.tsx — Screen ELDER-S74 (Data Usage Screen)
 * Spec: es74.txt
 *
 * Requirements (es74.txt):
 *  1. Header: Back arrow (←), Title "Data Usage".
 *  2. Guidance Text (es74.txt Section 2):
 *     - "SithaMithuru uses information to provide medication, safety and Guardian features."
 *  3. Categories (es74.txt Section 4, 77-80):
 *     - MEDICATION: Medication Information ("Used to provide your medication reminders and history.")
 *     - SAFETY: Safety Information ("Used to support safety alerts and emergency features.")
 *     - GUARDIAN: Guardian Information ("Used to provide Guardian connection and notifications.")
 *     - DEVICE: App Settings ("Used to remember your preferred application settings.")
 *  4. Informational & Offline-First (es74.txt Section 3 & 14): No switches, fully offline view.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface DataUsageProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const DataUsageScreen: React.FC<DataUsageProps> = ({
  onBack,
  onNavigate,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es74.txt Section 1) ─── */}
      <ScreenHeader title="Data Usage" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es74.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          SithaMithuru uses information to provide medication, safety and Guardian features.
        </Text>

        {/* ─── MEDICATION ─── */}
        <Text style={styles.sectionHeaderTitle}>MEDICATION</Text>
        <View style={styles.card}>
          <Text style={styles.itemTitle}>Medication Information</Text>
          <Text style={styles.itemSubtitle}>Used to provide your medication reminders and history.</Text>
        </View>

        {/* ─── SAFETY ─── */}
        <Text style={styles.sectionHeaderTitle}>SAFETY</Text>
        <View style={styles.card}>
          <Text style={styles.itemTitle}>Safety Information</Text>
          <Text style={styles.itemSubtitle}>Used to support safety alerts and emergency features.</Text>
        </View>

        {/* ─── GUARDIAN ─── */}
        <Text style={styles.sectionHeaderTitle}>GUARDIAN</Text>
        <View style={styles.card}>
          <Text style={styles.itemTitle}>Guardian Information</Text>
          <Text style={styles.itemSubtitle}>Used to provide Guardian connection and notifications.</Text>
        </View>

        {/* ─── DEVICE ─── */}
        <Text style={styles.sectionHeaderTitle}>DEVICE</Text>
        <View style={styles.card}>
          <Text style={styles.itemTitle}>App Settings</Text>
          <Text style={styles.itemSubtitle}>Used to remember your preferred application settings.</Text>
        </View>

        <Text style={styles.footerNoteText}>
          Some information is stored on your device so important features can continue working when you are offline.
        </Text>
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
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
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
  itemTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  footerNoteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 8,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default DataUsageScreen;

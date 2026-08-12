/**
 * PrivacyDataScreen.tsx — Screen ELDER-S73 (Privacy & Data Screen)
 * Spec: es73.txt
 *
 * Requirements (es73.txt):
 *  1. Header: Back arrow (←), Title "Privacy & Data".
 *  2. Guidance Text (es73.txt Section 2):
 *     - "Your information is used to provide medication, safety and Guardian features."
 *  3. YOUR DATA Section (es73.txt Section 4 & 5):
 *     - "What data we use" ➔ navigates to dataUsage (Screen ELDER-S74)
 *     - "Guardian Data Sharing" ➔ navigates to guardianDataSharing (Screen ELDER-S75)
 *  4. DEVICE DATA Section (es73.txt Section 7):
 *     - "Local Data" ➔ navigates to localData (Screen ELDER-S76)
 *  5. DATA MANAGEMENT Section (es73.txt Section 8 & 9):
 *     - "Delete Local Data" ➔ navigates to deleteLocalData (Screen ELDER-S77)
 *  6. 100% Offline-First (es73.txt Section 14 & 466)
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

interface PrivacyDataProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const PrivacyDataScreen: React.FC<PrivacyDataProps> = ({
  onBack,
  onNavigate,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es73.txt Section 1) ─── */}
      <ScreenHeader title="Privacy & Data" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── GUIDANCE TEXT (es73.txt Section 2) ─── */}
        <Text style={styles.guidanceText}>
          Your information is used to provide medication, safety and Guardian features.
        </Text>

        {/* ─── YOUR DATA SECTION (es73.txt Section 4 & 5) ─── */}
        <Text style={styles.sectionHeaderTitle}>YOUR DATA</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => onNavigate('dataUsage')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="What data we use"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.navTitle}>What data we use</Text>
              <Text style={styles.navSubtitle}>Learn about information used by SithaMithuru.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => onNavigate('guardianDataSharing')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Guardian Data Sharing"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.navTitle}>Guardian Data Sharing</Text>
              <Text style={styles.navSubtitle}>Learn what information may be shared with your Guardian.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* ─── DEVICE DATA SECTION (es73.txt Section 7) ─── */}
        <Text style={styles.sectionHeaderTitle}>DEVICE DATA</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => onNavigate('localData')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Local Data"
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.navTitle}>Local Data</Text>
              <Text style={styles.navSubtitle}>Information stored on this device.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* ─── DATA MANAGEMENT SECTION (es73.txt Section 8 & 9) ─── */}
        <Text style={styles.sectionHeaderTitle}>DATA MANAGEMENT</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => onNavigate('deleteLocalData')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Delete Local Data"
          >
            <Text style={[styles.navTitle, { color: colors.error }]}>Delete Local Data</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
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
    marginTop: 8,
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  navSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 12,
  },
});

export default PrivacyDataScreen;

/**
 * GuardianAboutScreen.tsx — Module 9 (Screen 35 About & Legal)
 *
 * Priorities:
 *  • App version & build version
 *  • Privacy Policy & Terms of Service links
 *  • Healthcare compliance & open-source licenses
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface GuardianAboutScreenProps {
  onBack: () => void;
}

const GuardianAboutScreen: React.FC<GuardianAboutScreenProps> = ({ onBack }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <ScreenHeader title="About SithaMithuru" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.brandBox}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="heart-pulse" size={48} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>SithaMithuru Elder Care</Text>
          <Text style={styles.versionText}>Version 1.0.0 (Production Build 104)</Text>
          <Text style={styles.brandDesc}>
            Enterprise Healthcare Platform for Elderly Care & Guardian Monitoring. Designed for Sri Lanka and global elder care.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Legal & Privacy</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowTitle}>Privacy Policy</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowTitle}>Terms & Conditions</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowTitle}>Open Source Licenses</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: { padding: spacing.s1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  scrollContent: { padding: spacing.s5, gap: spacing.s5 },
  brandBox: { alignItems: 'center', paddingVertical: spacing.s4 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s3,
  },
  brandTitle: { fontSize: 22, fontWeight: '900', color: colors.text.primary },
  versionText: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: 2 },
  brandDesc: { fontSize: 13, color: colors.text.secondary, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.text.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e1,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  rowTitle: { fontSize: 15, fontWeight: '800', color: colors.text.primary },
  divider: { height: 1, backgroundColor: colors.outlineVariant },
});

export default GuardianAboutScreen;

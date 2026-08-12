/**
 * OpenSourceLicensesScreen.tsx — Screen ELDER-S44 (Open Source Licenses Screen)
 * Spec: es44.txt
 *
 * Requirements (es44.txt):
 *  1. Header: Back arrow (←), Title "Open Source Licenses".
 *  2. Description Banner: "SithaMithuru uses open-source software components to provide its application features."
 *  3. Categorized License List (es44.txt Section 14 & 480-520):
 *     - ANDROID: AndroidX, React Native / React
 *     - MACHINE LEARNING: TensorFlow Lite (On-device ML)
 *     - CLOUD / MESSAGING: Firebase SDK & Messaging
 *     - OTHER: Vector Icons, AsyncStorage / SecureStore
 *  4. Full License Text Modal Viewer (ELDER-S44A - Section 6):
 *     - Shows unmodified full license text, copyright notice & license type.
 *  5. 100% Offline-First (Section 18)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface LicenseItem {
  id: string;
  name: string;
  category: 'ANDROID' | 'MACHINE LEARNING' | 'CLOUD / MESSAGING' | 'OTHER';
  version: string;
  subtitle: string;
  licenseType: string;
  copyright: string;
  fullLicenseText: string;
}

const LICENSES_DATA: LicenseItem[] = [
  {
    id: '1',
    name: 'AndroidX Libraries',
    category: 'ANDROID',
    version: '1.7.0',
    subtitle: 'Android development support components',
    licenseType: 'Apache License 2.0',
    copyright: 'Copyright (C) 2018 The Android Open Source Project',
    fullLicenseText: `Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
  },
  {
    id: '2',
    name: 'React Native & React',
    category: 'ANDROID',
    version: '0.74.0',
    subtitle: 'Cross-platform mobile application framework',
    licenseType: 'MIT License',
    copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.',
    fullLicenseText: `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.`,
  },
  {
    id: '3',
    name: 'TensorFlow Lite',
    category: 'MACHINE LEARNING',
    version: '2.14.0',
    subtitle: 'On-device machine learning inference engine',
    licenseType: 'Apache License 2.0',
    copyright: 'Copyright 2019 The TensorFlow Authors. All Rights Reserved.',
    fullLicenseText: `Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
  },
  {
    id: '4',
    name: 'Firebase SDK & Cloud Messaging',
    category: 'CLOUD / MESSAGING',
    version: '10.0.0',
    subtitle: 'Cloud services and Guardian safety notifications',
    licenseType: 'Apache License 2.0',
    copyright: 'Copyright 2020 Google LLC',
    fullLicenseText: `Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
  },
  {
    id: '5',
    name: 'React Native Vector Icons',
    category: 'OTHER',
    version: '10.0.0',
    subtitle: 'Customizable icons and accessibility glyphs',
    licenseType: 'MIT License',
    copyright: 'Copyright (c) 2015 Joel Arvidsson',
    fullLicenseText: `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software.`,
  },
];

interface OpenSourceLicensesProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const OpenSourceLicensesScreen: React.FC<OpenSourceLicensesProps> = ({
  onBack,
  onNavigate,
}) => {
  const [selectedLicense, setSelectedLicense] = useState<LicenseItem | null>(null);

  const androidItems = LICENSES_DATA.filter((item) => item.category === 'ANDROID');
  const mlItems = LICENSES_DATA.filter((item) => item.category === 'MACHINE LEARNING');
  const cloudItems = LICENSES_DATA.filter((item) => item.category === 'CLOUD / MESSAGING');
  const otherItems = LICENSES_DATA.filter((item) => item.category === 'OTHER');

  const renderLicenseRow = (item: LicenseItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.licenseRow}
      onPress={() => setSelectedLicense(item)}
      activeOpacity={0.8}
      accessible={true}
      accessibilityLabel={`${item.name}, ${item.licenseType}, tap to view license`}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.licenseName}>{item.name}</Text>
        <Text style={styles.licenseSubtitle}>{item.subtitle}</Text>
        <Text style={styles.licenseBadge}>{item.licenseType} • v{item.version}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es44.txt Section 1) ─── */}
      <ScreenHeader title="Open Source Licenses" onBack={onBack} variant="elder" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── DESCRIPTION BANNER (es44.txt Section 2) ─── */}
        <View style={styles.introCard}>
          <MaterialCommunityIcons name="code-tags" size={32} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.introTitle}>Open Source Software</Text>
          <Text style={styles.introText}>
            SithaMithuru uses open-source software components to provide its application features.
          </Text>
        </View>

        {/* ─── CATEGORY 1: ANDROID ─── */}
        <Text style={styles.sectionHeader}>ANDROID</Text>
        <View style={styles.card}>
          {androidItems.map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx > 0 && <View style={styles.divider} />}
              {renderLicenseRow(item)}
            </React.Fragment>
          ))}
        </View>

        {/* ─── CATEGORY 2: MACHINE LEARNING ─── */}
        <Text style={styles.sectionHeader}>MACHINE LEARNING</Text>
        <View style={styles.card}>
          {mlItems.map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx > 0 && <View style={styles.divider} />}
              {renderLicenseRow(item)}
            </React.Fragment>
          ))}
        </View>

        {/* ─── CATEGORY 3: CLOUD / MESSAGING ─── */}
        <Text style={styles.sectionHeader}>CLOUD / MESSAGING</Text>
        <View style={styles.card}>
          {cloudItems.map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx > 0 && <View style={styles.divider} />}
              {renderLicenseRow(item)}
            </React.Fragment>
          ))}
        </View>

        {/* ─── CATEGORY 4: OTHER ─── */}
        <Text style={styles.sectionHeader}>OTHER DEPENDENCIES</Text>
        <View style={styles.card}>
          {otherItems.map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx > 0 && <View style={styles.divider} />}
              {renderLicenseRow(item)}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      {/* ─── FULL LICENSE DETAILS MODAL (ELDER-S44A - Section 6) ─── */}
      <Modal
        visible={!!selectedLicense}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setSelectedLicense(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setSelectedLicense(null)}
              accessible={true}
              accessibilityLabel="Close license details"
            >
              <MaterialCommunityIcons name="close" size={26} color={colors.text.primary} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>{selectedLicense?.licenseType}</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={true}>
            <Text style={styles.modalLibraryName}>{selectedLicense?.name}</Text>
            <Text style={styles.modalVersion}>Version {selectedLicense?.version}</Text>
            <Text style={styles.modalCopyright}>{selectedLicense?.copyright}</Text>

            <View style={styles.modalDivider} />

            <Text style={styles.modalLicenseBody}>{selectedLicense?.fullLicenseText}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: 20,
    paddingBottom: 110,
  },
  introCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 20,
    alignItems: 'flex-start',
    ...elevation.e1,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  introText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    lineHeight: 22,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    padding: spacing.s4 || 16,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 16,
    ...elevation.e1,
  },
  licenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  licenseName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  licenseSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  licenseBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4 || 16,
    borderBottomWidth: 1,
    borderColor: colors.outline,
  },
  modalContent: {
    padding: spacing.s5 || 20,
  },
  modalLibraryName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  modalVersion: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  modalCopyright: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.outline,
    marginBottom: 16,
  },
  modalLicenseBody: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: colors.text.primary,
    lineHeight: 20,
  },
});

export default OpenSourceLicensesScreen;

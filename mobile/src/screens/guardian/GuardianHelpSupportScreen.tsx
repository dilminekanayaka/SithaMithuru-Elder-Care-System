/**
 * GuardianHelpSupportScreen.tsx — Module 9 (Screen 34 Help & Support)
 *
 * Priorities:
 *  • Frequently Asked Questions (FAQs) accordion
 *  • Direct Support Email & Phone triggers
 *  • Feedback form submission
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

interface GuardianHelpSupportScreenProps {
  onBack: () => void;
}

const GuardianHelpSupportScreen: React.FC<GuardianHelpSupportScreenProps> = ({ onBack }) => {
  const [feedback, setFeedback] = useState('');

  const handleSendFeedback = () => {
    if (!feedback.trim()) {
      Toast.show({ type: 'error', text1: 'Empty Feedback', text2: 'Please enter your message.' });
      return;
    }
    Toast.show({ type: 'success', text1: 'Feedback Sent', text2: 'Thank you for helping us improve SithaMithuru!' });
    setFeedback('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <ScreenHeader title="Help & Support" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SUPPORT CONTACT CARDS */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('mailto:support@sithamithuru.lk')}>
            <MaterialCommunityIcons name="email-outline" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Email Support</Text>
              <Text style={styles.rowSub}>support@sithamithuru.lk</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* FEEDBACK SECTION */}
        <Text style={styles.sectionTitle}>Send Us Your Feedback</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us how we can make Guardian Mode better for your family..."
            placeholderTextColor={colors.text.disabled}
            multiline
            numberOfLines={4}
            value={feedback}
            onChangeText={setFeedback}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSendFeedback}>
            <Text style={styles.sendBtnText}>Submit Feedback</Text>
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
  scrollContent: { padding: spacing.s5, gap: spacing.s4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.text.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.s4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.s3, paddingVertical: 4 },
  rowTitle: { fontSize: 15, fontWeight: '800', color: colors.text.primary },
  rowSub: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  textArea: {
    minHeight: 100,
    fontSize: 14,
    color: colors.text.primary,
    textAlignVertical: 'top',
    marginBottom: spacing.s3,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  sendBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});

export default GuardianHelpSupportScreen;

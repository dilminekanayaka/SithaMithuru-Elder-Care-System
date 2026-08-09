/**
 * RegistrationSuccessScreen.tsx — Screen G07 (Authentication Module / Registration Success)
 * Spec: g07.txt
 *
 * Priorities:
 *  • Calm, reassuring healthcare success checkpoint (Apple Health / Epic MyChart standard)
 *  • 96dp Circular Green Success Badge with 0% -> 100% scale animation (500ms)
 *  • Title: "Account Created Successfully" (32sp Bold)
 *  • Description: "Your Guardian account is now ready. The final step is connecting with your elder..."
 *  • "What's Next?" Information Card (Connect elder, medication updates, emergency alerts, daily activities, health reports)
 *  • Guardian Relationship Selector Chips (Son, Daughter, Spouse, Caregiver, Relative, Other)
 *  • Single Primary CTA: "Continue to Pair Elder" (56dp height, 16dp radius)
 *  • Background Initialization Controller (Device registration, SQLite local database, Notification channels)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius, elevation } from '../theme';

interface RegistrationSuccessScreenProps {
  onContinueToPairing: (relationship: string) => void;
}

const RELATIONSHIPS = [
  'Daughter',
  'Son',
  'Spouse',
  'Primary Caregiver',
  'Relative',
  'Other',
];

const NEXT_STEPS = [
  { icon: 'account-plus-outline', text: 'Connect with your elder' },
  { icon: 'pill', text: 'Start receiving medication updates' },
  { icon: 'shield-alert-outline', text: 'Receive emergency alerts' },
  { icon: 'clipboard-check-outline', text: 'Monitor daily activities' },
  { icon: 'chart-box-outline', text: 'View health reports' },
];

const RegistrationSuccessScreen: React.FC<RegistrationSuccessScreenProps> = ({
  onContinueToPairing,
}) => {
  const [selectedRel, setSelectedRel] = useState('Son');
  const [isInitializing, setIsInitializing] = useState(true);

  // Micro-interaction Entrance Animations
  const badgeScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Success badge 0% -> 100% scale animation (500ms)
    Animated.parallel([
      Animated.timing(badgeScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Background Initialization Controller simulation
    const initTimer = setTimeout(() => {
      setIsInitializing(false);
    }, 800);

    return () => clearTimeout(initTimer);
  }, [badgeScale, contentOpacity]);

  const handleFinish = () => {
    Toast.show({
      type: 'success',
      text1: 'Guardian Session Ready',
      text2: `Relationship set to ${selectedRel}. Navigating to pairing...`,
    });
    onContinueToPairing(selectedRel);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SUCCESS BADGE & TITLES */}
        <View style={styles.heroSection}>
          <Animated.View
            style={[
              styles.successBadge,
              {
                transform: [{ scale: badgeScale }],
              },
            ]}
          >
            <MaterialCommunityIcons name="check-decagram" size={64} color={colors.primary} />
          </Animated.View>

          <Text style={styles.title}>Account Created Successfully</Text>
          <Text style={styles.subtitle}>
            Your Guardian account is now ready. The final step is connecting with your elder so you can begin monitoring their health and receive important updates.
          </Text>
        </View>

        <Animated.View style={{ opacity: contentOpacity }}>
          {/* "WHAT'S NEXT?" INFORMATION CARD */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <MaterialCommunityIcons name="compass-outline" size={20} color={colors.primary} />
              <Text style={styles.infoCardTitle}>What's Next?</Text>
            </View>

            <View style={styles.stepsList}>
              {NEXT_STEPS.map((item, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.bulletDot}>
                    <MaterialCommunityIcons name={item.icon as any} size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.stepText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* GUARDIAN RELATIONSHIP SELECTOR */}
          <View style={styles.relCard}>
            <Text style={styles.relCardTitle}>Select Guardian Relationship</Text>
            <View style={styles.chipGrid}>
              {RELATIONSHIPS.map((rel) => {
                const isSelected = selectedRel === rel;
                return (
                  <TouchableOpacity
                    key={rel}
                    style={[styles.relChip, isSelected && styles.relChipActive]}
                    onPress={() => setSelectedRel(rel)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                      size={18}
                      color={isSelected ? colors.primary : '#94A3B8'}
                    />
                    <Text style={[styles.relChipText, isSelected && styles.relChipTextActive]}>{rel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SINGLE PRIMARY CTA BUTTON (56DP HEIGHT, 16DP RADIUS) */}
          <TouchableOpacity
            style={[styles.continueButton, isInitializing && styles.disabledBtn]}
            onPress={handleFinish}
            disabled={isInitializing}
            activeOpacity={0.85}
          >
            <View style={styles.btnRow}>
              <Text style={styles.continueButtonText}>
                {isInitializing ? 'Preparing Device...' : 'Continue to Pair Elder'}
              </Text>
              {!isInitializing && <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s8,
    paddingBottom: spacing.s6,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.s6,
  },
  successBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...elevation.e2,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: spacing.s2,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: spacing.s2,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.s5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.s5,
    ...elevation.e1,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.s4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: spacing.s3,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  stepsList: {
    gap: spacing.s3,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  relCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.s5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.s6,
    ...elevation.e1,
  },
  relCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: spacing.s4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipGrid: {
    gap: spacing.s2,
  },
  relChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: spacing.s4,
    paddingVertical: 13,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  relChipActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  relChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  relChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  continueButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e2,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});

export default RegistrationSuccessScreen;

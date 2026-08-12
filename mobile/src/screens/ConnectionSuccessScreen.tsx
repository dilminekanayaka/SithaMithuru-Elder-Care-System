import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius, elevation } from '../theme';

interface ConnectionSuccessProps {
  connectedName: string;
  role: 'Elder' | 'Guardian';
  onContinue: () => void;
}

const ConnectionSuccessScreen: React.FC<ConnectionSuccessProps> = ({
  connectedName = 'Dilmin Ekanayaka',
  role = 'Guardian',
  onContinue,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="account-heart"
            size={72}
            color={colors.primary}
          />
        </View>

        <Text style={styles.title}>Successfully Connected!</Text>
        <Text style={styles.subtitle}>සාර්ථකව සම්බන්ධ විය!</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {connectedName.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.nameText}>{connectedName}</Text>
          <View style={styles.roleChip}>
            <Text style={styles.roleText}>Connected as your {role}</Text>
          </View>
        </View>

        <Text style={styles.body}>
          {role === 'Guardian'
            ? `${connectedName} can now assist you with medication reminders, health alerts, and emergency SOS monitoring.`
            : `You can now monitor ${connectedName}'s daily medications, mood check-ins, and emergency alerts.`}
        </Text>

        <TouchableOpacity style={styles.button} onPress={onContinue} activeOpacity={0.9}>
          <Text style={styles.buttonText}>Go to Dashboard / මුල් පිටුවට</Text>
          <MaterialCommunityIcons name="arrow-right" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.s6,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s8,
  },
  title: {
    ...typography.displaySmall,
    color: colors.text.primary,
    marginBottom: spacing.s2,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.headlineMedium,
    color: colors.primaryDark,
    marginBottom: spacing.s8,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.s6,
    alignItems: 'center',
    marginBottom: spacing.s8,
    ...elevation.e2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.category.guardian.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s3,
  },
  avatarText: {
    ...typography.displaySmall,
    color: colors.category.guardian.accent,
  },
  nameText: {
    ...typography.headlineLarge,
    color: colors.text.primary,
    marginBottom: spacing.s2,
  },
  roleChip: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s1,
    borderRadius: radius.pill,
  },
  roleText: {
    ...typography.titleMedium,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  body: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.s10,
    maxWidth: 320,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 60,
    paddingHorizontal: spacing.s8,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.s3,
    ...elevation.e3,
  },
  buttonText: {
    ...typography.titleLarge,
    color: colors.onPrimary,
  },
});

export default ConnectionSuccessScreen;

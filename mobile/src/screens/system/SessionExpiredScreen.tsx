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
import { colors, typography, spacing, radius, elevation } from '../../theme';

interface SessionExpiredProps {
  onLoginAgain: () => void;
}

const SessionExpiredScreen: React.FC<SessionExpiredProps> = ({ onLoginAgain }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="clock-alert-outline" size={72} color={colors.warning} />
        </View>

        <Text style={styles.title}>Session Expired</Text>
        <Text style={styles.subtitle}>
          සැසිය කල් ඉකුත් වී ඇත. කරුණාකර නැවත ඇතුළු වන්න.
        </Text>
        <Text style={styles.body}>
          Your login session has ended for your safety and security. Please sign in again to access your SithaMithuru account.
        </Text>

        <TouchableOpacity style={styles.button} onPress={onLoginAgain} activeOpacity={0.9}>
          <MaterialCommunityIcons name="login" size={24} color={colors.onPrimary} />
          <Text style={styles.buttonText}>Sign In Again / නැවත පිවිසෙන්න</Text>
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
    width: 130,
    height: 130,
    borderRadius: radius.full,
    backgroundColor: colors.warningContainer,
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
    ...typography.titleLarge,
    color: colors.warningDark,
    marginBottom: spacing.s4,
    textAlign: 'center',
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

export default SessionExpiredScreen;

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

interface NoInternetProps {
  onRetry: () => void;
}

const NoInternetScreen: React.FC<NoInternetProps> = ({ onRetry }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="wifi-off" size={72} color={colors.error} />
        </View>

        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.subtitle}>
          අන්තර්ජාල සම්බන්ධතාවය අක්‍රියයි.
        </Text>
        <Text style={styles.body}>
          We couldn't connect to the server. Please check your Wi-Fi or mobile data connection and try again.
        </Text>

        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.9}>
          <MaterialCommunityIcons name="refresh" size={24} color={colors.onPrimary} />
          <Text style={styles.buttonText}>Try Again / නැවත උත්සාහ කරන්න</Text>
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
    backgroundColor: colors.errorContainer,
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
    color: colors.errorDark,
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

export default NoInternetScreen;

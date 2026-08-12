import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

interface GuardianInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  relation?: string;
}

interface GuardianManagementProps {
  token: string;
  elderId: string;
  onBack: () => void;
  onSessionExpired?: () => void;
}

const GuardianManagementScreen: React.FC<GuardianManagementProps> = ({
  token,
  elderId,
  onBack,
  onSessionExpired,
}) => {
  const [guardians, setGuardians] = useState<GuardianInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGuardians = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/connection/my-guardians`, token);
      if (Array.isArray(res)) {
        setGuardians(res);
      } else if (res && Array.isArray(res.guardians)) {
        setGuardians(res.guardians);
      }
    } catch (e: any) {
      if (e instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      // Fallback example for UI demonstration if elder has no guardians yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuardians();
  }, [elderId]);

  const handleRemoveGuardian = (guardian: GuardianInfo) => {
    Alert.alert(
      'Remove Guardian / ඉවත් කරන්නද?',
      `Are you sure you want to remove ${guardian.name} as your guardian?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/connection/unlink`, token, {
                method: 'DELETE',
                body: JSON.stringify({ targetId: guardian.id }),
              });
              Toast.show({
                type: 'success',
                text1: 'Guardian Removed',
                text2: `${guardian.name} is no longer connected.`,
                position: 'top',
              });
              loadGuardians();
            } catch (e) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Could not remove guardian.',
                position: 'top',
              });
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: GuardianInfo }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.substring(0, 2).toUpperCase()}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        {item.phone ? <Text style={styles.phone}>{item.phone}</Text> : null}
      </View>

      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => handleRemoveGuardian(item)}
      >
        <MaterialCommunityIcons name="link-variant-off" size={24} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={32} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Guardians</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadGuardians}>
          <MaterialCommunityIcons name="refresh" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={guardians}
          keyExtractor={(g) => String(g.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="account-group" size={64} color={colors.text.disabled} />
              <Text style={styles.emptyText}>No connected guardians yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s4,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.outlineVariant,
  },
  backBtn: {
    padding: spacing.s1,
  },
  headerTitle: {
    ...typography.headlineLarge,
    color: colors.text.primary,
  },
  refreshBtn: {
    padding: spacing.s1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.s5,
    gap: spacing.s4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.s5,
    ...elevation.e2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s4,
  },
  avatarText: {
    ...typography.headlineMedium,
    color: colors.primaryDark,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.headlineSmall,
    color: colors.text.primary,
  },
  email: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  phone: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.s1,
  },
  removeBtn: {
    padding: spacing.s3,
    borderRadius: radius.md,
    backgroundColor: colors.errorContainer,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s16,
  },
  emptyText: {
    ...typography.titleLarge,
    color: colors.text.tertiary,
    marginTop: spacing.s3,
  },
});

export default GuardianManagementScreen;

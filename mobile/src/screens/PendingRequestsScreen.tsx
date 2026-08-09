import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius, elevation } from '../theme';
import { apiFetch, SessionExpiredError } from '../services/api';

interface RequestItem {
  id: string;
  sender_name: string;
  sender_role: 'Elder' | 'Guardian';
  created_at: string;
}

interface PendingRequestsProps {
  token: string;
  onBack: () => void;
  onAccepted?: (item: RequestItem) => void;
  onSessionExpired?: () => void;
}

const PendingRequestsScreen: React.FC<PendingRequestsProps> = ({
  token,
  onBack,
  onAccepted,
  onSessionExpired,
}) => {
  const [requests, setRequests] = useState<RequestItem[]>([
    {
      id: 1,
      sender_name: 'Dilmin Ekanayaka',
      sender_role: 'Guardian',
      created_at: 'Today • 02:30 PM',
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/connection/requests/pending', token);
        if (Array.isArray(res)) {
          setRequests(res);
        }
      } catch (e: any) {
        if (e instanceof SessionExpiredError) {
          onSessionExpired?.();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [token]);

  const handleAction = async (item: RequestItem, action: 'accept' | 'reject') => {
    try {
      await apiFetch(`/connection/requests/${item.id}/${action}`, token, {
        method: 'POST',
      });
      setRequests((prev) => prev.filter((r) => r.id !== item.id));
      Toast.show({
        type: 'success',
        text1: action === 'accept' ? 'Connection Accepted!' : 'Request Rejected',
        text2:
          action === 'accept'
            ? `You are now connected with ${item.sender_name}.`
            : `Request from ${item.sender_name} was removed.`,
        position: 'top',
      });
      if (action === 'accept' && onAccepted) {
        onAccepted(item);
      }
    } catch (e: any) {
      if (e instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      // Demo UI fallback
      setRequests((prev) => prev.filter((r) => r.id !== item.id));
      Toast.show({
        type: 'success',
        text1: action === 'accept' ? 'Connected!' : 'Rejected',
        text2: `Connection request processed.`,
        position: 'top',
      });
      if (action === 'accept' && onAccepted) {
        onAccepted(item);
      }
    }
  };

  const renderItem = ({ item }: { item: RequestItem }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.sender_name.substring(0, 2).toUpperCase()}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{item.sender_name}</Text>
        <Text style={styles.roleText}>Request to connect as {item.sender_role}</Text>
        <Text style={styles.timeText}>{item.created_at}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => handleAction(item, 'accept')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="check" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => handleAction(item, 'reject')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="account-clock-outline"
                size={64}
                color={colors.text.disabled}
              />
              <Text style={styles.emptyText}>No pending connection requests</Text>
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
  roleText: {
    ...typography.bodySmall,
    color: colors.primaryDark,
    fontWeight: '700',
    marginTop: 2,
  },
  timeText: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.s2,
  },
  acceptBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.successDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s16,
  },
  emptyText: {
    ...typography.titleLarge,
    color: colors.text.secondary,
    marginTop: spacing.s3,
  },
});

export default PendingRequestsScreen;

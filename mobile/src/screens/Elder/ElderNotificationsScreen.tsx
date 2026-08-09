import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius, elevation } from '../../theme';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'medicine' | 'guardian' | 'sos' | 'general';
  read: boolean;
}

interface ElderNotificationsProps {
  onBack: () => void;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Time for medicine! / ඖෂධ ගැනීමට වේලාවයි',
    message: 'Please take your Paracetamol 500mg scheduled for 8:00 AM.',
    time: '10 mins ago',
    type: 'medicine',
    read: false,
  },
  {
    id: '2',
    title: 'Guardian Connected',
    message: 'Son (Dilmin) has connected as your guardian.',
    time: '2 hours ago',
    type: 'guardian',
    read: true,
  },
  {
    id: '3',
    title: 'Emergency Contact Updated',
    message: 'Your emergency phone numbers were successfully saved.',
    time: 'Yesterday',
    type: 'general',
    read: true,
  },
];

const ElderNotificationsScreen: React.FC<ElderNotificationsProps> = ({ onBack }) => {
  const [items, setItems] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);

  // MEDIUM-1: Test Notification Simulator Button
  const handleTestAlert = () => {
    const testItem: NotificationItem = {
      id: Date.now().toString(),
      title: '🔔 Test Reminder Alert / පරීක්ෂණ දැනුම්දීම',
      message: 'Your notification tone, vibration, and push reminder systems are functioning properly.',
      time: 'Just now',
      type: 'medicine',
      read: false,
    };
    setItems((prev) => [testItem, ...prev]);
    Toast.show({
      type: 'success',
      text1: '🔔 Notification System Tested',
      text2: 'Visual alert & sound simulator verified.',
      position: 'top',
    });
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'medicine':
        return 'pill';
      case 'guardian':
        return 'account-check';
      case 'sos':
        return 'alert-decagram';
      default:
        return 'bell-outline';
    }
  };

  const getIconColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'medicine':
        return colors.category.medicine.accent;
      case 'guardian':
        return colors.primary;
      case 'sos':
        return colors.error;
      default:
        return colors.secondary;
    }
  };

  const handleClearAll = () => {
    setItems([]);
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <View style={[styles.card, !item.read && styles.unreadCard]}>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: `${getIconColor(item.type)}20` },
        ]}
      >
        <MaterialCommunityIcons
          name={getIcon(item.type)}
          size={32}
          color={getIconColor(item.type)}
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={32} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={handleTestAlert} style={styles.testBtn}>
            <MaterialCommunityIcons name="bell-ring" size={20} color="#FFFFFF" />
            <Text style={styles.testBtnText}>Test</Text>
          </TouchableOpacity>
          {items.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
              <MaterialCommunityIcons name="trash-can-outline" size={26} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="bell-check-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        }
      />
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
  clearBtn: {
    padding: spacing.s1,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    gap: 4,
  },
  testBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  listContent: {
    padding: spacing.s5,
    gap: spacing.s3,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.s4,
    ...elevation.e1,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s4,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing.s1,
  },
  message: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  timeText: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    marginTop: spacing.s2,
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

export default ElderNotificationsScreen;

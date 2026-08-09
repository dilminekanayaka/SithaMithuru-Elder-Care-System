import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

interface MedicationItem {
  id: string;
  name: string;
  dosage?: string;
  time: string;
  taken: boolean;
}

interface MedicationDetailsProps {
  medication: MedicationItem;
  token: string;
  elderId: string;
  onBack: () => void;
  onUpdated: () => void;
  onEdit?: () => void;
  onSessionExpired?: () => void;
}

const MedicationDetailsScreen: React.FC<MedicationDetailsProps> = ({
  medication,
  token,
  elderId,
  onBack,
  onUpdated,
  onEdit,
  onSessionExpired,
}) => {
  const [taken, setTaken] = useState(medication.taken);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggleTaken = async () => {
    setLoading(true);
    const newStatus = !taken;
    try {
      await apiFetch('/medications/log', token, {
        method: 'POST',
        body: JSON.stringify({
          medication_id: medication.id,
          elderId: elderId,
          taken_status: newStatus,
          client_updated_at: new Date().toISOString(),
        }),
      });
      setTaken(newStatus);
      Toast.show({
        type: 'success',
        text1: newStatus ? 'Marked as Taken!' : 'Marked as Not Taken',
        text2: newStatus
          ? 'ඖෂධය ලබාගත් බව සටහන් විය'
          : 'ඖෂධය ලබා නොගත් බව සටහන් විය',
        position: 'top',
      });
      onUpdated();
    } catch (e: any) {
      if (e instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not update status.',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Medicine / ඉවත් කරන්නද?',
      `Are you sure you want to remove ${medication.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await apiFetch(`/medications/${medication.id}`, token, {
                method: 'DELETE',
              });
              Toast.show({
                type: 'success',
                text1: 'Deleted',
                text2: `${medication.name} has been removed.`,
                position: 'top',
              });
              onUpdated();
              onBack();
            } catch (e: any) {
              if (e instanceof SessionExpiredError) {
                onSessionExpired?.();
                return;
              }
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Could not delete medication.',
                position: 'top',
              });
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={32} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicine Details</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.deleteBtn} accessibilityLabel="Edit medicine">
              <MaterialCommunityIcons name="pencil-outline" size={28} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteBtn}
            disabled={deleting}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={28} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                name="pill"
                size={40}
                color={colors.category.medicine.accent}
              />
            </View>

            <View style={styles.badgeBox}>
              <View
                style={[
                  styles.statusChip,
                  taken ? styles.chipTaken : styles.chipPending,
                ]}
              >
                <MaterialCommunityIcons
                  name={taken ? 'check-circle' : 'clock-outline'}
                  size={18}
                  color={taken ? colors.successDark : colors.warningDark}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: taken ? colors.successDark : colors.warningDark },
                  ]}
                >
                  {taken ? 'Taken / ලබා ගත්තා' : 'Pending / ලබා ගත යුතුය'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.medName}>{medication.name}</Text>
          {medication.dosage ? (
            <Text style={styles.medDosage}>{medication.dosage}</Text>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MaterialCommunityIcons
                name="clock-time-four-outline"
                size={26}
                color={colors.primary}
              />
            </View>
            <View>
              <Text style={styles.detailLabel}>Scheduled Time / නියමිත වේලාව</Text>
              <Text style={styles.detailValue}>{medication.time}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MaterialCommunityIcons
                name="calendar-refresh-outline"
                size={26}
                color={colors.primary}
              />
            </View>
            <View>
              <Text style={styles.detailLabel}>Frequency / වාර ගණන</Text>
              <Text style={styles.detailValue}>Daily / දිනපතා</Text>
            </View>
          </View>
        </View>

        {/* Big accessible Mark Taken / Undo button */}
        <TouchableOpacity
          style={[
            styles.mainActionBtn,
            taken ? styles.btnUndo : styles.btnTake,
          ]}
          onPress={handleToggleTaken}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <MaterialCommunityIcons
                name={taken ? 'undo' : 'check-bold'}
                size={28}
                color={colors.onPrimary}
              />
              <Text style={styles.mainActionText}>
                {taken ? 'Mark as Not Taken / අවලංගු කරන්න' : 'Mark as Taken / ලබා ගත්තා'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  deleteBtn: {
    padding: spacing.s2,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s6,
    paddingBottom: spacing.s12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.s6,
    marginBottom: spacing.s8,
    ...elevation.e2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s4,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    backgroundColor: colors.category.medicine.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeBox: {},
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    gap: spacing.s1,
  },
  chipTaken: {
    backgroundColor: colors.successContainer,
  },
  chipPending: {
    backgroundColor: colors.warningContainer,
  },
  chipText: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  medName: {
    ...typography.displaySmall,
    color: colors.text.primary,
    marginBottom: spacing.s1,
  },
  medDosage: {
    ...typography.titleLarge,
    color: colors.text.secondary,
    marginBottom: spacing.s5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginVertical: spacing.s4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s4,
    gap: spacing.s4,
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  detailValue: {
    ...typography.headlineSmall,
    color: colors.text.primary,
  },
  mainActionBtn: {
    flexDirection: 'row',
    height: 68,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.s3,
    ...elevation.e3,
  },
  btnTake: {
    backgroundColor: colors.successDark,
  },
  btnUndo: {
    backgroundColor: colors.secondary,
  },
  mainActionText: {
    ...typography.headlineSmall,
    color: colors.onPrimary,
  },
});

export default MedicationDetailsScreen;

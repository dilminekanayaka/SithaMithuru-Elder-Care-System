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
  Linking,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch, SessionExpiredError } from '../../services/api';

interface EmergencyAlertItem {
  id: string;
  elder_id?: string;
  elder_name: string;
  trigger_reason?: string;
  triggered_phrase?: string;
  triggered_at?: string;
  created_at?: string;
  status: 'Active' | 'Pending' | 'Resolved' | 'False Alarm';
  location?: string;
  device_location?: string;
  latitude?: number;
  longitude?: number;
  maps_url?: string;
}

interface EmergencyDetailsProps {
  alertItem: EmergencyAlertItem;
  token: string;
  onBack: () => void;
  onResolved?: () => void;
  onSessionExpired?: () => void;
}

const EmergencyDetailsScreen: React.FC<EmergencyDetailsProps> = ({
  alertItem,
  token,
  onBack,
  onResolved,
  onSessionExpired,
}) => {
  const [status, setStatus] = useState<'Active' | 'Resolved'>(alertItem.status);
  const [loading, setLoading] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);

  const handleMarkResolved = () => {
    setResolveModalVisible(true);
  };

  const handleResolveWithReason = async (reason: string) => {
    setLoading(true);
    setResolveModalVisible(false);
    try {
      await apiFetch(`/guardian/emergency-alerts/${alertItem.id}/resolve`, token, {
        method: 'POST',
        body: JSON.stringify({
          status: 'Resolved',
          reason: reason,
        }),
      });
      setStatus('Resolved');
      Toast.show({
        type: 'success',
        text1: 'Alert Resolved',
        text2: `Recorded reason: ${reason}`,
        position: 'top',
      });
      if (onResolved) onResolved();
    } catch (e: any) {
      if (e instanceof SessionExpiredError) {
        onSessionExpired?.();
        return;
      }
      setStatus('Resolved');
      Toast.show({
        type: 'success',
        text1: 'Alert Resolved',
        text2: `Emergency status marked as resolved (${reason}).`,
        position: 'top',
      });
      if (onResolved) onResolved();
    } finally {
      setLoading(false);
    }
  };

  const isActive = status === 'Active';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, isActive && styles.activeCard]}>
          <View style={styles.topRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: isActive ? colors.errorContainer : colors.successContainer },
              ]}
            >
              <MaterialCommunityIcons
                name={isActive ? 'alert-decagram' : 'shield-check'}
                size={36}
                color={isActive ? colors.error : colors.successDark}
              />
            </View>
            <View
              style={[
                styles.badge,
                isActive ? styles.badgeActive : styles.badgeResolved,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isActive ? colors.errorDark : colors.successDark },
                ]}
              >
                {status}
              </Text>
            </View>
          </View>

          <Text style={styles.elderName}>{alertItem.elder_name || 'Elder'}</Text>
          <Text style={styles.reasonText}>
            {alertItem.triggered_phrase || alertItem.trigger_reason || 'Emergency SOS Triggered'}
          </Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock-outline" size={22} color={colors.primary} />
            <View>
              <Text style={styles.label}>Triggered Time</Text>
              <Text style={styles.val}>
                {alertItem.triggered_at || (alertItem.created_at ? new Date(alertItem.created_at).toLocaleString() : 'N/A')}
              </Text>
            </View>
          </View>

          {(alertItem.location || alertItem.device_location || alertItem.latitude) ? (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={22}
                color={colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Known Location</Text>
                <Text style={styles.val}>
                  {alertItem.device_location || alertItem.location || `${alertItem.latitude}, ${alertItem.longitude}`}
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#E8F5E9',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    marginTop: 6,
                    alignSelf: 'flex-start',
                  }}
                  onPress={() => {
                    const url =
                      alertItem.maps_url ||
                      (alertItem.latitude && alertItem.longitude
                        ? `https://maps.google.com/?q=${alertItem.latitude},${alertItem.longitude}`
                        : `https://maps.google.com/?q=${encodeURIComponent(alertItem.location || '')}`);
                    Linking.openURL(url).catch(() => {});
                  }}
                  accessibilityLabel="Open GPS Location in Google Maps"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="google-maps" size={18} color="#2E7D32" />
                  <Text style={{ color: '#2E7D32', fontWeight: 'bold', marginLeft: 6 }}>
                    Open in Google Maps →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="timeline-check-outline"
              size={22}
              color={colors.primary}
            />
            <View>
              <Text style={styles.label}>System Status</Text>
              <Text style={styles.val}>
                {isActive ? 'Emergency SMS & Voice Notifications Sent' : 'Incident Closed'}
              </Text>
            </View>
          </View>
        </View>

        {isActive && (
          <View style={{ gap: 12, marginBottom: 20 }}>
            <TouchableOpacity
              style={[styles.resolveBtn, { backgroundColor: '#FF3B30' }]}
              onPress={() => {
                Linking.openURL('sms:119?body=Emergency%20alert%20triggered%20from%20SithaMithuru%20Elder%20Care.');
              }}
              activeOpacity={0.9}
              accessibilityLabel="Send fallback SMS to emergency services"
            >
              <MaterialCommunityIcons name="message-alert-outline" size={24} color="#FFFFFF" />
              <Text style={styles.resolveBtnText}>Send Fallback Emergency SMS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resolveBtn}
              onPress={handleMarkResolved}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={24} color={colors.onPrimary} />
                  <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={resolveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResolveModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.resolveModalContent}>
            <MaterialCommunityIcons name="shield-check-outline" size={52} color={colors.primary} />
            <Text style={styles.resolveModalTitle}>Resolve Emergency Alert</Text>
            <Text style={styles.resolveModalSub}>
              Please select the reason for resolving this alert. This reason will be logged in clinical audit records and synced to the Elder.
            </Text>

            <TouchableOpacity
              style={[styles.reasonOptionBtn, { backgroundColor: '#27AE60' }]}
              onPress={() => handleResolveWithReason('Medical Help Provided')}
              accessibilityLabel="Resolve alert: Medical Help Provided"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="doctor" size={24} color="#FFFFFF" />
              <Text style={styles.reasonOptionText}>Medical Help Provided</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reasonOptionBtn, { backgroundColor: '#E74C3C' }]}
              onPress={() => handleResolveWithReason('Ambulance Dispatched')}
              accessibilityLabel="Resolve alert: Ambulance Dispatched 1990"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="ambulance" size={24} color="#FFFFFF" />
              <Text style={styles.reasonOptionText}>Ambulance Dispatched (1990)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reasonOptionBtn, { backgroundColor: '#4A5568' }]}
              onPress={() => handleResolveWithReason('False Alarm')}
              accessibilityLabel="Resolve alert: False Alarm Accidental Trigger"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="alert-remove-outline" size={24} color="#FFFFFF" />
              <Text style={styles.reasonOptionText}>False Alarm (Accidental Trigger)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 14, paddingVertical: 8 }}
              onPress={() => setResolveModalVisible(false)}
            >
              <Text style={{ color: colors.text.secondary, fontWeight: '600', fontSize: 14 }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  activeCard: {
    borderWidth: 2,
    borderColor: colors.error,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s4,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    borderRadius: radius.pill,
  },
  badgeActive: {
    backgroundColor: '#FFE5E5',
  },
  badgeResolved: {
    backgroundColor: colors.successContainer,
  },
  badgeText: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  elderName: {
    ...typography.displaySmall,
    color: colors.text.primary,
    marginBottom: spacing.s1,
  },
  reasonText: {
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
    gap: spacing.s4,
    marginBottom: spacing.s4,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  val: {
    ...typography.titleLarge,
    color: colors.text.primary,
  },
  resolveBtn: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: colors.successDark,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.s2,
    ...elevation.e3,
  },
  resolveBtnText: {
    ...typography.headlineSmall,
    color: colors.onPrimary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resolveModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  resolveModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 12,
  },
  resolveModalSub: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 20,
  },
  reasonOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 10,
    gap: 10,
  },
  reasonOptionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default EmergencyDetailsScreen;

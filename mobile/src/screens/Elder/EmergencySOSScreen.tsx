import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Vibration,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import AppText from '../../components/AppText';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, typography, spacing, radius, elevation } from '../../theme';
import { apiFetch } from '../../services/api';

const { width } = Dimensions.get('window');

interface EmergencySOSProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  elderId?: string | number;
  token?: string;
  guardianPhone?: string;
}

const EmergencySOSScreen: React.FC<EmergencySOSProps> = ({
  onBack,
  onNavigate,
  elderId,
  token,
  guardianPhone,
}) => {
  const [countdownState, setCountdownState] = useState<'idle' | 'counting' | 'sent'>('idle');
  const [timeLeft, setTimeLeft] = useState(10);
  const [logId, setLogId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const countdownInterval = useRef<any>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  const playBeep = async () => {
    try {
      // Play a short alarm beep for auditory warning
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' }
      );
      soundRef.current = sound;
      await sound.playAsync();
      setTimeout(() => {
        sound.unloadAsync().catch(() => {});
      }, 800);
    } catch (e) {
      console.warn('Could not play warning beep:', e);
    }
  };

  const startCountdown = () => {
    setCountdownState('counting');
    setTimeLeft(10);
    Vibration.vibrate(500);
    playBeep();

    countdownInterval.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          triggerSOSAlert();
          return 0;
        }
        Vibration.vibrate(200);
        playBeep();
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    setCountdownState('idle');
    setTimeLeft(10);
    Vibration.vibrate(100);
  };

  const triggerSOSAlert = async () => {
    setLoading(true);
    setCountdownState('sent');
    Vibration.vibrate([0, 1000, 500, 1000]);

    let lat = null;
    let lon = null;
    let locationText = 'Unknown Location';
    let mapsUrl = null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = location.coords.latitude;
        lon = location.coords.longitude;
        locationText = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
        mapsUrl = `https://maps.google.com/?q=${lat},${lon}`;
      }
    } catch (e) {
      console.warn('Failed to retrieve device location:', e);
    }

    if (elderId && token) {
      try {
        const response = await apiFetch('/emergency/trigger', token, {
          method: 'POST',
          body: JSON.stringify({
            elder_id: Number(elderId),
            device_location: locationText,
            triggered_phrase: 'SOS Button Pressed',
            latitude: lat,
            longitude: lon,
            maps_url: mapsUrl,
          }),
        });

        if (response && response.success && response.log) {
          setLogId(response.log.id);
        }
      } catch (e) {
        console.error('Failed to report SOS to server:', e);
      }
    }
    setLoading(false);
  };

  const cancelActiveSOS = async () => {
    if (logId && token) {
      try {
        await apiFetch(`/emergency/${logId}/cancel`, token, {
          method: 'PUT',
        });
      } catch (e) {
        console.error('Error cancelling SOS:', e);
      }
    }
    setLogId(null);
    setCountdownState('idle');
  };

  const emergencyContacts = [
    { id: 1, name: 'Daughter', number: '071XXXXXXX', icon: 'account-child-circle', color: '#6C63FF' },
    { id: 2, name: 'Son', number: '077XXXXXXX', icon: 'face-man-profile', color: '#2D8CFF' },
    { id: 3, name: 'Doctor', number: '011XXXXXXX', icon: 'doctor', color: '#27AE60' },
    { id: 4, name: 'Ambulance', number: '1990', icon: 'ambulance', color: '#E74C3C' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Back / ආපසු"
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={32} color={colors.text.primary} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} isHeader>Emergency SOS</AppText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {countdownState === 'idle' && (
          <>
            <View style={styles.textContainer}>
              <AppText style={styles.title} isHeader>Emergency Help</AppText>
              <AppText style={styles.subtitle}>
                Tap the big button below if you need help immediately.
              </AppText>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={startCountdown}
                style={styles.sosButton}
                accessibilityLabel="Trigger Emergency SOS Alert"
                accessibilityRole="button"
                accessibilityHint="Tapping this starts a 10-second emergency countdown."
              >
                <View style={styles.innerCircle}>
                  <MaterialCommunityIcons name="alert" size={80} color="#FFFFFF" />
                  <AppText style={styles.sosText} isHeader>SOS</AppText>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="map-marker-radius" size={28} color={colors.text.secondary} />
              <AppText style={styles.infoText}>
                We will share your GPS coordinates and maps link with your guardians.
              </AppText>
            </View>

            <AppText style={styles.sectionTitle} isHeader>Quick Call / දුරකථන ඇමතුම්</AppText>
            <View style={styles.gridContainer}>
              {emergencyContacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={[styles.contactCard, { borderColor: contact.color }]}
                  onPress={() => {
                    const url = `tel:${contact.number}`;
                    Vibration.vibrate(50);
                    Linking.openURL(url).catch(() => console.log(`Calling ${contact.name}...`));
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${contact.name}`}
                >
                  <MaterialCommunityIcons name={contact.icon} size={44} color={contact.color} />
                  <AppText style={styles.contactName}>{contact.name}</AppText>
                  <AppText style={styles.contactNumber}>{contact.number}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {countdownState === 'counting' && (
          <View style={styles.countingContainer}>
            <AppText style={styles.warningTitle} isHeader>🚨 SENDING ALERT...</AppText>
            
            <View style={styles.countdownCircle}>
              <AppText style={styles.countdownNumber} isHeader>{timeLeft}</AppText>
              <AppText style={styles.secondsLabel}>seconds left</AppText>
            </View>

            <AppText style={styles.warningSubtitle}>
              An emergency message will be sent to your guardians with your live GPS location.
            </AppText>

            <TouchableOpacity
              style={styles.hugeCancelButton}
              onPress={cancelCountdown}
              accessibilityLabel="Cancel emergency countdown"
              accessibilityRole="button"
            >
              <AppText style={styles.hugeCancelButtonText}>CANCEL (False Alarm)</AppText>
            </TouchableOpacity>
          </View>
        )}

        {countdownState === 'sent' && (
          <View style={styles.sentContainer}>
            <View style={styles.successIcon}>
              <MaterialCommunityIcons name="check" size={72} color="#FFFFFF" />
            </View>
            <AppText style={styles.sentTitle} isHeader>Help is on the way!</AppText>
            <AppText style={styles.sentSubtitle}>
              Your emergency signal was dispatched. We shared your GPS details with your guardians. Stay calm.
            </AppText>
            <TouchableOpacity
              style={styles.safeButton}
              onPress={cancelActiveSOS}
              accessibilityLabel="Mark emergency as resolved, I am safe now"
              accessibilityRole="button"
            >
              <AppText style={styles.safeButtonText}>I am safe now / Cancel SOS</AppText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <BottomNavBar activeTab="sos" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s4,
    borderBottomWidth: 1,
    borderColor: colors.outlineVariant,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.s5,
    paddingBottom: spacing.s12 + 80,
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: spacing.s5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.s2,
  },
  subtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.s4,
  },
  sosButton: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 8,
    borderColor: '#FFE5E5',
  },
  innerCircle: {
    alignItems: 'center',
  },
  sosText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: spacing.s1,
  },
  infoBox: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.s4,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: spacing.s5,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  infoText: {
    marginLeft: spacing.s3,
    color: colors.text.primary,
    fontSize: 16,
    flex: 1,
    fontWeight: '600',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    alignSelf: 'flex-start',
    marginBottom: spacing.s4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  contactCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xxl,
    padding: spacing.s4,
    alignItems: 'center',
    marginBottom: spacing.s4,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.s2,
  },
  contactNumber: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.s1,
  },
  countingContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.s6,
  },
  warningTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#E74C3C',
    marginBottom: spacing.s5,
  },
  countdownCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 8,
    borderColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    marginBottom: spacing.s5,
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#E74C3C',
  },
  secondsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E74C3C',
    marginTop: -4,
  },
  warningSubtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.s8,
  },
  hugeCancelButton: {
    width: '100%',
    height: 72,
    backgroundColor: '#E74C3C',
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  hugeCancelButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  sentContainer: {
    alignItems: 'center',
    marginTop: spacing.s6,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.successDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s5,
  },
  sentTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.s2,
  },
  sentSubtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.s8,
    lineHeight: 26,
  },
  safeButton: {
    width: width - 48,
    height: 64,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.outline,
  },
  safeButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EmergencySOSScreen;

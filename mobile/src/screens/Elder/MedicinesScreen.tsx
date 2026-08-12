import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';
import { colors } from '../../theme';

const { width } = Dimensions.get('window');

interface MedicinesProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onViewMedication?: (medication: { id: string | number; name: string; dosage?: string; time: string; taken: boolean }) => void;
  elderId?: string;
  token?: string;
  isOnline?: boolean;
}

const MedicinesScreen: React.FC<MedicinesProps> = ({ onBack, onNavigate, onViewMedication, elderId, token }) => {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([
    {
      id: 'morning',
      title: 'Morning',
      icon: 'weather-sunny',
      color: colors.warning,
      bgColor: colors.warningContainer,
      timeRange: '8:00 AM - 10:00 AM',
      medicines: [] as Array<{ id: string | number; name: string; dosage: string; time: string; taken: boolean; icon: string }>,
    },
    {
      id: 'afternoon',
      title: 'Afternoon',
      icon: 'weather-partly-cloudy',
      color: colors.primary,
      bgColor: colors.primaryContainer,
      timeRange: '12:00 PM - 2:00 PM',
      medicines: [] as Array<{ id: string | number; name: string; dosage: string; time: string; taken: boolean; icon: string }>,
    },
    {
      id: 'night',
      title: 'Night',
      icon: 'weather-night',
      color: colors.primary,
      bgColor: colors.category.journal.bg,
      timeRange: '8:00 PM - 10:00 PM',
      medicines: [] as Array<{ id: string | number; name: string; dosage: string; time: string; taken: boolean; icon: string }>,
    },
  ]);

  // Load live medications dynamically from SQLite DB & API
  const loadMedications = React.useCallback(async () => {
    setLoading(true);
    try {
      const { getDB } = require('../../database/db');
      const { apiFetch } = require('../../services/api');
      const db = await getDB();

      // 1. Read local SQLite records first (Offline-First)
      const localMeds = await db.getAllAsync(
        'SELECT * FROM medications_local WHERE elder_id = ? OR elder_id = ?',
        [elderId ? String(elderId) : 'elder_default', 'elder_default']
      );

      let fetchedMeds = localMeds || [];

      // 2. Fetch remote medications if online
      if (elderId && token) {
        try {
          const res = await apiFetch(`/medications/elder/${elderId}`, token);
          if (res && Array.isArray(res.rawMedications)) {
            fetchedMeds = res.rawMedications;
          }
        } catch {
          // Fallback to SQLite cache on network error
        }
      }

      if (fetchedMeds.length > 0) {
        const morningMeds: any[] = [];
        const afternoonMeds: any[] = [];
        const nightMeds: any[] = [];

        fetchedMeds.forEach((m: any, idx: number) => {
          const scheduledTime = m.time_schedule || m.scheduled_time || '';
          const item = {
            id: m.id || idx + 1,
            name: m.name || 'Medication',
            dosage: m.dosage || '1 Pill',
            time: scheduledTime,
            taken: m.taken === true || m.status === 'TAKEN' || m.taken_status === true,
            icon: 'pill',
          };
          const time = scheduledTime.toLowerCase();
          if (time.includes('pm') || time.includes('night') || time.includes('20:') || time.includes('21:')) {
            nightMeds.push(item);
          } else if (time.includes('12:') || time.includes('13:') || time.includes('afternoon')) {
            afternoonMeds.push(item);
          } else {
            morningMeds.push(item);
          }
        });

        // No fallback/placeholder medicines here: an empty session means the elder
        // genuinely has no medication scheduled for that time of day, and showing
        // a fabricated pill name in a medical adherence screen is unsafe.
        setSessions([
          {
            id: 'morning',
            title: 'Morning',
            icon: 'weather-sunny',
            color: colors.warning,
            bgColor: colors.warningContainer,
            timeRange: '8:00 AM - 10:00 AM',
            medicines: morningMeds,
          },
          {
            id: 'afternoon',
            title: 'Afternoon',
            icon: 'weather-partly-cloudy',
            color: colors.primary,
            bgColor: colors.primaryContainer,
            timeRange: '12:00 PM - 2:00 PM',
            medicines: afternoonMeds,
          },
          {
            id: 'night',
            title: 'Night',
            icon: 'weather-night',
            color: colors.primary,
            bgColor: colors.category.journal.bg,
            timeRange: '8:00 PM - 10:00 PM',
            medicines: nightMeds,
          },
        ]);
      } else {
        setSessions((prev) => prev.map((s) => ({ ...s, medicines: [] })));
      }
    } catch (err) {
      console.warn('Failed loading medications from SQLite:', err);
    } finally {
      setLoading(false);
    }
  }, [elderId, token]);

  React.useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  const toggleMedicine = async (sessionId: string, medId: string | number) => {
    let newTakenState = false;
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          medicines: session.medicines.map(med => {
            if (med.id === medId) {
              newTakenState = !med.taken;
              return { ...med, taken: newTakenState };
            }
            return med;
          })
        };
      }
      return session;
    }));

    // Offline-First: Write adherence log to SQLite offline queue
    try {
      const { getDB } = require('../../database/db');
      const { syncService } = require('../../services/syncService');
      const db = await getDB();
      const logId = `medlog_${Date.now()}_${medId}`;
      const logDate = new Date().toISOString().split('T')[0];
      const statusStr = newTakenState ? 'TAKEN' : 'PENDING';

      await db.runAsync(
        `INSERT INTO medication_logs_offline (id, medication_id, elder_id, status, logged_date, action_timestamp, synced)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [logId, String(medId), elderId || 'elder_default', statusStr, logDate, new Date().toISOString()]
      );

      // Trigger background sync if token provided
      if (elderId && token) {
        syncService.syncOfflineQueue(elderId, token).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to log medication to SQLite offline queue:', e);
    }
  };

  const allMedicines = sessions.flatMap((s) => s.medicines);
  const totalMedicines = allMedicines.length;
  const takenMedicines = allMedicines.filter((m) => m.taken).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={32} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Medicines</Text>
        <View style={{ width: 32 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.summaryCard}>
            <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>Today's Progress</Text>
                <Text style={styles.summarySubtitle}>
                  {totalMedicines > 0
                    ? `You have taken ${takenMedicines} of ${totalMedicines} medicines.`
                    : 'No medicines scheduled for today.'}
                </Text>
            </View>
            <View style={styles.circularProgress}>
                 <MaterialCommunityIcons name="trophy-variant-outline" size={32} color={colors.onPrimary} />
            </View>
        </View>

        {sessions.map((session) => (
            <View key={session.id} style={styles.sessionContainer}>
                
                <View style={styles.sessionHeader}>
                    <View style={[styles.sessionIconBox, { backgroundColor: session.bgColor }]}>
                        <MaterialCommunityIcons name={session.icon} size={28} color={session.color} />
                    </View>
                    <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle}>{session.title}</Text>
                        <Text style={styles.sessionTime}>{session.timeRange}</Text>
                    </View>
                </View>

                {session.medicines.map((med) => (
                    <TouchableOpacity 
                        key={med.id} 
                        style={[
                            styles.medCard, 
                            med.taken && styles.medCardTaken,
                            med.taken && { borderColor: session.color }
                        ]}
                        activeOpacity={0.8}
                        onPress={() => toggleMedicine(session.id, med.id)}
                    >
                        {/* Big Checkbox */}
                        <View style={[
                            styles.checkbox, 
                            med.taken && { backgroundColor: session.color, borderColor: session.color }
                        ]}>
                             {med.taken && <MaterialCommunityIcons name="check" size={24} color={colors.onPrimary} />}
                        </View>

                        <View style={styles.medIconBox}>
                             <MaterialCommunityIcons name={med.icon} size={32} color={med.taken ? session.color : colors.text.tertiary} />
                        </View>

                        <View style={styles.medDetails}>
                             <Text style={[styles.medName, med.taken && styles.textTaken]}>{med.name}</Text>
                             <Text style={styles.medDosage}>{med.dosage}</Text>
                        </View>

                        {onViewMedication && (
                          <TouchableOpacity
                            style={styles.medDetailsButton}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            onPress={() => onViewMedication(med)}
                          >
                            <MaterialCommunityIcons name="chevron-right" size={26} color={colors.text.secondary} />
                          </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                ))}

            </View>
        ))}

      </ScrollView>
      <BottomNavBar activeTab="medicines" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Added padding for navbar
  },
  summaryCard: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      padding: 24,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 30,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
  },
  summaryText: {
      flex: 1,
  },
  summaryTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.onPrimary,
      marginBottom: 6,
  },
  summarySubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.9)',
  },
  circularProgress: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  sessionContainer: {
      marginBottom: 30,
  },
  sessionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
  },
  sessionIconBox: {
      width: 48,
      height: 48,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
  },
  sessionInfo: {
      flex: 1,
  },
  sessionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
  },
  sessionTime: {
      fontSize: 14,
      color: colors.text.secondary,
  },
  medCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.outline,
  },
  medCardTaken: {
      backgroundColor: colors.surface,
  },
  checkbox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.text.tertiary,
      marginRight: 16,
      justifyContent: 'center',
      alignItems: 'center',
  },
  medIconBox: {
      marginRight: 16,
      width: 40,
      alignItems: 'center',
  },
  medDetails: {
      flex: 1,
  },
  medName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
  },
  textTaken: {
      textDecorationLine: 'line-through',
      color: colors.text.secondary,
  },
  medDosage: {
      fontSize: 14,
      color: colors.text.secondary,
      marginTop: 2,
  },
  medDetailsButton: {
      paddingLeft: 8,
  },
});

export default MedicinesScreen;

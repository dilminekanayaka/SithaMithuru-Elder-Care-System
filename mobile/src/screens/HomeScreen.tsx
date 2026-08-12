import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.warningContainer} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>Elder Name</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <MaterialIcons name="person" size={30} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Everything is safe</Text>
        </View>

        {/* Emergency Button */}
        <TouchableOpacity style={styles.emergencyButton} activeOpacity={0.8}>
          <MaterialIcons name="emergency" size={40} color="#FFF" />
          <Text style={styles.emergencyText}>HELP ME</Text>
        </TouchableOpacity>

        {/* Feature Grid */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#E1F5FE' }]}>
              <MaterialIcons name="medication" size={32} color="#0288D1" />
            </View>
            <Text style={styles.itemTitle}>Medicine</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.iconContainer, { backgroundColor: colors.category.journal.bg }]}>
              <MaterialIcons name="task-alt" size={32} color="#7B1FA2" />
            </View>
            <Text style={styles.itemTitle}>Reminders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryContainer }]}>
              <MaterialIcons name="mood" size={32} color="#388E3C" />
            </View>
            <Text style={styles.itemTitle}>Mood</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.iconContainer, { backgroundColor: colors.warningContainer }]}>
              <MaterialIcons name="contact-phone" size={32} color="#F57C00" />
            </View>
            <Text style={styles.itemTitle}>Guardian</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityTime}>09:00 AM</Text>
            <Text style={styles.activityDetail}>Morning Medicine (Aspirin)</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityTime}>12:30 PM</Text>
            <Text style={styles.activityDetail}>Lunch Reminder</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    backgroundColor: colors.warningContainer,
    padding: 24,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    fontSize: 18,
    color: '#5D4E37',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  profileButton: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: colors.primaryContainer,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    backgroundColor: colors.success,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  emergencyButton: {
    backgroundColor: colors.error,
    height: 120,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 8,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emergencyText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridItem: {
    width: '47%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  activityCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warningContainer,
  },
  activityTime: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  activityDetail: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

export default HomeScreen;

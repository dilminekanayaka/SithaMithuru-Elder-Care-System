import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme';

interface BottomNavBarProps {
  activeTab: string;
  onNavigate: (screen: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onNavigate }) => {
  return (
    <View style={styles.bottomNavWrapper}>
      <View style={styles.bottomNav}>
          
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => onNavigate('elderDashboard')}
            accessibilityRole="tab"
            accessibilityLabel="Home tab"
            accessibilityState={{ selected: activeTab === 'home' }}
            accessibilityHint="Navigates to the Home dashboard"
          >
              <MaterialCommunityIcons 
                  name={activeTab === 'home' ? "home" : "home-outline"} 
                  size={28} 
                  color={activeTab === 'home' ? colors.navActive : colors.navInactive} 
              />
              <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => onNavigate('tasks')}
            accessibilityRole="tab"
            accessibilityLabel="Tasks tab"
            accessibilityState={{ selected: activeTab === 'tasks' }}
            accessibilityHint="Navigates to your daily tasks list"
          >
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={26} color={activeTab === 'tasks' ? colors.navActive : colors.navInactive} />
              <Text style={[styles.navLabel, activeTab === 'tasks' && styles.navLabelActive]}>Tasks</Text>
          </TouchableOpacity>

          {/* SOS Button */}
          <View style={styles.sosContainer} pointerEvents="box-none"> 
              <TouchableOpacity 
                  style={styles.sosButton}
                  onPress={() => onNavigate('sos')}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="Emergency SOS button"
                  accessibilityHint="Navigates to the emergency SOS page to request immediate assistance"
              >
                  <View style={styles.sosRipple}>
                      <MaterialCommunityIcons name="alert" size={32} color={colors.onPrimary} />
                  </View>
              </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => onNavigate('medicines')}
            accessibilityRole="tab"
            accessibilityLabel="Medicines tab"
            accessibilityState={{ selected: activeTab === 'medicines' }}
            accessibilityHint="Navigates to your medicine reminder list"
          >
              <MaterialCommunityIcons name="pill" size={26} color={activeTab === 'medicines' ? colors.navActive : colors.navInactive} />
              <Text style={[styles.navLabel, activeTab === 'medicines' && styles.navLabelActive]}>Meds</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => onNavigate('mood')}
            accessibilityRole="tab"
            accessibilityLabel="Mood tracker tab"
            accessibilityState={{ selected: activeTab === 'mood' }}
            accessibilityHint="Navigates to the mood checker page"
          >
              <MaterialCommunityIcons name="emoticon-happy-outline" size={26} color={activeTab === 'mood' ? colors.navActive : colors.navInactive} />
              <Text style={[styles.navLabel, activeTab === 'mood' && styles.navLabelActive]}>Mood</Text>
          </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.navBg,
    height: 72,
    borderRadius: 36,
    paddingHorizontal: 12,
    // Deep Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  navItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
  },
  navLabel: {
      fontSize: 10,
      marginTop: 4,
      color: colors.navInactive,
      fontWeight: '600',
  },
  navLabelActive: {
      color: colors.navActive,
  },
  sosContainer: {
     top: -28,
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 30,
  },
  sosButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: colors.surface,
      shadowColor: colors.error,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
  },
  sosRipple: {
      // Just visual container
  },
});

export default BottomNavBar;

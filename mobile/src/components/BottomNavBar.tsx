import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface BottomNavBarProps {
  activeTab: string;
  onNavigate: (screen: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onNavigate }) => {
  return (
    <View style={styles.bottomNavWrapper}>
      <View style={styles.bottomNav}>
          
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('elderDashboard')}>
              <MaterialCommunityIcons 
                  name={activeTab === 'home' ? "home" : "home-outline"} 
                  size={28} 
                  color={activeTab === 'home' ? "#6C63FF" : "#95A5A6"} 
              />
              <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('tasks')}>
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={26} color={activeTab === 'tasks' ? "#6C63FF" : "#95A5A6"} />
              <Text style={[styles.navLabel, activeTab === 'tasks' && styles.navLabelActive]}>Tasks</Text>
          </TouchableOpacity>

          {/* SOS Button */}
          <View style={styles.sosContainer} pointerEvents="box-none"> 
              <TouchableOpacity 
                  style={styles.sosButton}
                  onPress={() => onNavigate('sos')}
                  activeOpacity={0.9}
              >
                  <View style={styles.sosRipple}>
                      <MaterialCommunityIcons name="alert" size={32} color="#FFFFFF" />
                  </View>
              </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('medicines')}>
              <MaterialCommunityIcons name="pill" size={26} color={activeTab === 'medicines' ? "#6C63FF" : "#95A5A6"} />
              <Text style={[styles.navLabel, activeTab === 'medicines' && styles.navLabelActive]}>Meds</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('mood')}>
              <MaterialCommunityIcons name="emoticon-happy-outline" size={26} color={activeTab === 'mood' ? "#6C63FF" : "#95A5A6"} />
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
    backgroundColor: '#FFFFFF',
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
      color: '#95A5A6',
      fontWeight: '600',
  },
  navLabelActive: {
      color: '#6C63FF',
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
      backgroundColor: '#E74C3C',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: '#F8F9FA',
      shadowColor: '#E74C3C',
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

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export interface ElderItem {
  id: string;
  name: string;
  age?: number | null;
  blood_type?: string | null;
  relation?: string; // e.g. Mother, Father, Grandmother
  avatar_url?: string | null;
  risk_level?: 'Low' | 'Medium' | 'High';
}

interface ElderSwitchBarProps {
  elders: ElderItem[];
  selectedElderid: string | null;
  onSelectElder: (id: string) => void;
  onAddElderPress?: () => void;
}

const RISK_COLOR = {
  Low: '#27AE60',
  Medium: '#F1C40F',
  High: '#E74C3C',
};

const ElderSwitchBar: React.FC<ElderSwitchBarProps> = ({
  elders,
  selectedElderId,
  onSelectElder,
  onAddElderPress,
}) => {
  if (!elders || elders.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Select Elder to Monitor</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {elders.map((elder) => {
          const isSelected = elder.id === selectedElderId;
          const initials = elder.name
            ? elder.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
            : 'E';
          const riskColor = RISK_COLOR[elder.risk_level || 'Low'];

          return (
            <TouchableOpacity
              key={elder.id}
              style={[
                styles.elderChip,
                isSelected && styles.elderChipSelected,
              ]}
              onPress={() => onSelectElder(elder.id)}
              activeOpacity={0.8}
            >
              {/* Avatar with Risk Dot */}
              <View style={styles.avatarWrapper}>
                {elder.avatar_url ? (
                  <Image source={{ uri: elder.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarCircle, isSelected && styles.avatarCircleSelected]}>
                    <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                      {initials}
                    </Text>
                  </View>
                )}
                <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
              </View>

              {/* Name & Relation */}
              <View style={styles.infoWrapper}>
                <Text style={[styles.nameText, isSelected && styles.nameTextSelected]} numberOfLines={1}>
                  {elder.name}
                </Text>
                {elder.relation && (
                  <Text style={[styles.relationText, isSelected && styles.relationTextSelected]}>
                    {elder.relation}
                  </Text>
                )}
              </View>

              {isSelected && (
                <MaterialCommunityIcons name="check-circle" size={18} color="#6C63FF" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Add Elder Button */}
        {onAddElderPress && (
          <TouchableOpacity style={styles.addChip} onPress={onAddElderPress}>
            <View style={styles.addCircle}>
              <MaterialCommunityIcons name="plus" size={20} color="#6C63FF" />
            </View>
            <Text style={styles.addText}>Add New</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#95A5A6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  scrollContent: {
    gap: 12,
    paddingRight: 20,
  },
  elderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  elderChipSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#F0EEFF',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircleSelected: {
    backgroundColor: '#6C63FF',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A5568',
  },
  avatarTextSelected: {
    color: '#FFFFFF',
  },
  riskDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  infoWrapper: {
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2C3E50',
    maxWidth: 100,
  },
  nameTextSelected: {
    color: '#6C63FF',
  },
  relationText: {
    fontSize: 11,
    color: '#95A5A6',
    fontWeight: '600',
  },
  relationTextSelected: {
    color: '#6C63FF',
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#BDB5FF',
    borderStyle: 'dashed',
    gap: 8,
  },
  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6C63FF',
  },
});

export default ElderSwitchBar;

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppText from './AppText';
import { colors, radius, spacing } from '../theme';

interface OversizedTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

export const OversizedTimePicker: React.FC<OversizedTimePickerProps> = ({ value, onChange }) => {
  const [hours, setHours] = useState(value.getHours());
  const [minutes, setMinutes] = useState(value.getMinutes());

  const updateTime = (newHours: number, newMinutes: number) => {
    const updatedDate = new Date(value);
    updatedDate.setHours(newHours);
    updatedDate.setMinutes(newMinutes);
    updatedDate.setSeconds(0);
    updatedDate.setMilliseconds(0);
    onChange(updatedDate);
  };

  const incrementHours = () => {
    const nextH = (hours + 1) % 24;
    setHours(nextH);
    updateTime(nextH, minutes);
  };

  const decrementHours = () => {
    const prevH = (hours - 1 + 24) % 24;
    setHours(prevH);
    updateTime(prevH, minutes);
  };

  const incrementMinutes = () => {
    const nextM = (minutes + 5) % 60; // Increment by 5 mins for simplicity
    setMinutes(nextM);
    updateTime(hours, nextM);
  };

  const decrementMinutes = () => {
    const prevM = (minutes - 5 + 60) % 60;
    setMinutes(prevM);
    updateTime(hours, prevM);
  };

  const formatNum = (num: number) => String(num).padStart(2, '0');

  return (
    <View style={styles.container}>
      <View style={styles.column}>
        <TouchableOpacity
          onPress={incrementHours}
          style={styles.adjustBtn}
          accessibilityLabel="Increase hours"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="plus" size={36} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.numberBox}>
          <AppText style={styles.numberText} isHeader>{formatNum(hours)}</AppText>
          <AppText style={styles.label}>Hours / පැය</AppText>
        </View>
        <TouchableOpacity
          onPress={decrementHours}
          style={styles.adjustBtn}
          accessibilityLabel="Decrease hours"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="minus" size={36} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.separatorContainer}>
        <AppText style={styles.separator} isHeader>:</AppText>
      </View>

      <View style={styles.column}>
        <TouchableOpacity
          onPress={incrementMinutes}
          style={styles.adjustBtn}
          accessibilityLabel="Increase minutes"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="plus" size={36} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.numberBox}>
          <AppText style={styles.numberText} isHeader>{formatNum(minutes)}</AppText>
          <AppText style={styles.label}>Minutes / විනාඩි</AppText>
        </View>
        <TouchableOpacity
          onPress={decrementMinutes}
          style={styles.adjustBtn}
          accessibilityLabel="Decrease minutes"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="minus" size={36} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.xxl,
    padding: spacing.s4,
    borderWidth: 2,
    borderColor: colors.outline,
    marginTop: spacing.s3,
    marginBottom: spacing.s3,
  },
  column: {
    alignItems: 'center',
  },
  adjustBtn: {
    width: 72,
    height: 64,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  numberBox: {
    alignItems: 'center',
    marginVertical: spacing.s3,
    width: 100,
    height: 80,
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.text.primary,
  },
  label: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  separatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 120,
  },
  separator: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default OversizedTimePicker;

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { RepeatDays } from '@/types/alarm.types';
import { VoltageText } from '@/components/VoltageText';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';

const DAY_KEYS: (keyof RepeatDays)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface DaySelectorProps {
  value: RepeatDays;
  onChange: (days: RepeatDays) => void;
}

export function DaySelector({ value, onChange }: DaySelectorProps) {
  function toggle(key: keyof RepeatDays) {
    onChange({ ...value, [key]: !value[key] });
  }

  return (
    <View style={styles.row}>
      {DAY_KEYS.map((key, i) => {
        const active = value[key];
        return (
          <TouchableOpacity
            key={key}
            style={[styles.day, active && styles.dayActive]}
            onPress={() => toggle(key)}
          >
            <VoltageText
              variant="label"
              color={active ? Colors.textInverse : Colors.textMuted}
            >
              {DAY_LABELS[i]}
            </VoltageText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  day: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 0,
  },
  dayActive: {
    backgroundColor: Colors.heat,
  },
});

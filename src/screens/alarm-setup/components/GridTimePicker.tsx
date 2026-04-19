import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { VoltageText } from '@/components/VoltageText';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';

interface GridTimePickerProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_QUICK = Array.from({ length: 12 }, (_, i) => i * 5);

export function GridTimePicker({ hour, minute, onChange }: GridTimePickerProps) {
  const onSelectHour = (h: number) => {
    onChange(h, minute);
    Haptics.selectionAsync();
  };

  const onSelectMinute = (m: number) => {
    onChange(hour, m);
    Haptics.selectionAsync();
  };

  return (
    <View style={styles.container}>
      <VoltageText variant="label" color={Colors.textMuted} style={styles.label}>HOUR (24H)</VoltageText>
      <View style={styles.grid}>
        {HOURS.map((h) => (
          <TouchableOpacity
            key={h}
            onPress={() => onSelectHour(h)}
            style={[styles.cell, hour === h && styles.cellActive]}
          >
            <VoltageText
              variant="caption"
              color={hour === h ? Colors.textInverse : Colors.textPrimary}
            >
              {String(h).padStart(2, '0')}
            </VoltageText>
          </TouchableOpacity>
        ))}
      </View>

      <VoltageText variant="label" color={Colors.textMuted} style={[styles.label, { marginTop: Spacing.md }]}>
        MINUTE
      </VoltageText>
      <View style={styles.grid}>
        {MINUTES_QUICK.map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => onSelectMinute(m)}
            style={[styles.cell, styles.cellWide, minute === m && styles.cellActive]}
          >
            <VoltageText
              variant="caption"
              color={minute === m ? Colors.textInverse : Colors.textPrimary}
            >
              :{String(m).padStart(2, '0')}
            </VoltageText>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Nudge for precise minutes */}
      <View style={styles.nudgeRow}>
         <TouchableOpacity 
            onPress={() => { onChange(hour, (minute - 1 + 60) % 60); Haptics.selectionAsync(); }}
            style={styles.nudgeBtn}
          >
            <VoltageText variant="h4" color={Colors.heat}>-</VoltageText>
         </TouchableOpacity>
         <VoltageText variant="h3" color={Colors.textPrimary}>{String(minute).padStart(2, '0')}</VoltageText>
         <TouchableOpacity 
            onPress={() => { onChange(hour, (minute + 1) % 60); Haptics.selectionAsync(); }}
            style={styles.nudgeBtn}
          >
            <VoltageText variant="h4" color={Colors.heat}>+</VoltageText>
         </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  label: {
    marginBottom: Spacing.xs,
    fontSize: 10,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  cell: {
    width: 38,
    height: 38,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cellWide: {
    width: 50,
  },
  cellActive: {
    backgroundColor: Colors.heat,
    borderColor: Colors.heat,
  },
  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xl,
    backgroundColor: Colors.surfaceMuted,
    paddingVertical: Spacing.xs,
  },
  nudgeBtn: {
    padding: Spacing.md,
  }
});

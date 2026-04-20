import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { VoltageText } from '@/components/VoltageText';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';

interface GridTimePickerProps {
  hour: number;   // 0-23
  minute: number; // 0-59
  onChange: (hour: number, minute: number) => void;
}

// 12-hour display values
const HOURS_12 = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i)); // [12,1,...,11]
const MINUTES_QUICK = Array.from({ length: 12 }, (_, i) => i * 5);

function to12h(h24: number): { h12: number; isPM: boolean } {
  const isPM = h24 >= 12;
  const h12 = h24 % 12 || 12;
  return { h12, isPM };
}

function to24h(h12: number, isPM: boolean): number {
  if (isPM) return h12 === 12 ? 12 : h12 + 12;
  return h12 === 12 ? 0 : h12;
}

export function GridTimePicker({ hour, minute, onChange }: GridTimePickerProps) {
  const { h12: initH12, isPM: initPM } = to12h(hour);
  const [isPM, setIsPM] = useState(initPM);

  const onSelectHour = (h12: number) => {
    onChange(to24h(h12, isPM), minute);
    Haptics.selectionAsync();
  };

  const onSelectMinute = (m: number) => {
    onChange(hour, m);
    Haptics.selectionAsync();
  };

  const onToggleAMPM = (pm: boolean) => {
    setIsPM(pm);
    onChange(to24h(initH12, pm), minute);
    Haptics.selectionAsync();
  };

  return (
    <View style={styles.container}>
      {/* AM/PM toggle */}
      <View style={styles.ampmRow}>
        {(['AM', 'PM'] as const).map((label) => {
          const active = label === 'PM' ? isPM : !isPM;
          return (
            <TouchableOpacity
              key={label}
              onPress={() => onToggleAMPM(label === 'PM')}
              style={[styles.ampmBtn, active && styles.ampmActive]}
            >
              <VoltageText
                variant="label"
                color={active ? Colors.heat : Colors.textMuted}
              >
                {label}
              </VoltageText>
            </TouchableOpacity>
          );
        })}
      </View>

      <VoltageText variant="label" color={Colors.textMuted} style={styles.label}>HOUR</VoltageText>
      <View style={styles.grid}>
        {HOURS_12.map((h) => {
          const active = h === initH12;
          return (
            <TouchableOpacity
              key={h}
              onPress={() => onSelectHour(h)}
              style={[styles.cell, active && styles.cellActive]}
            >
              <VoltageText
                variant="caption"
                color={active ? Colors.textInverse : Colors.textPrimary}
              >
                {String(h).padStart(2, '0')}
              </VoltageText>
            </TouchableOpacity>
          );
        })}
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
  ampmRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ampmBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  ampmActive: {
    borderColor: Colors.heat,
    backgroundColor: Colors.surface,
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
    width: 44,
    height: 38,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cellWide: {
    width: 54,
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
  },
});

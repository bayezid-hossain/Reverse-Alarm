import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VoltageText } from '@/components/VoltageText';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';

interface StepCounterProps {
  current: number;
  target: number;
}

export function StepCounter({ current, target }: StepCounterProps) {
  return (
    <View style={styles.container}>
      <VoltageText variant="display" color={Colors.warning} style={styles.count}>
        {String(current).padStart(2, '0')}
      </VoltageText>
      <View style={styles.divider} />
      <VoltageText variant="h2" color={Colors.textMuted}>
        {String(target).padStart(2, '0')}
      </VoltageText>
      <VoltageText variant="label" color={Colors.textSecondary} style={styles.unit}>
        STEPS
      </VoltageText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  count: {
    fontSize: 120,
    lineHeight: 120,
    letterSpacing: -4,
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: Colors.textMuted,
  },
  unit: {
    letterSpacing: 4,
    marginTop: Spacing.sm,
  },
});

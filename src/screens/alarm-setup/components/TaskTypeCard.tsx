import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { TaskType } from '@/types/task.types';
import { VoltageText } from '@/components/VoltageText';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';
import { TASK_DISPLAY } from '@/constants/missions';

interface TaskTypeCardProps {
  type: TaskType;
  selected: boolean;
  onPress: () => void;
}

export function TaskTypeCard({ type, selected, onPress }: TaskTypeCardProps) {
  const display = TASK_DISPLAY[type];
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <VoltageText variant="h4" color={selected ? Colors.heat : Colors.textPrimary}>
        {display.label}
      </VoltageText>
      <VoltageText variant="caption" color={Colors.textSecondary} style={styles.sub}>
        {display.sublabel}
      </VoltageText>
      {selected && <View style={styles.activeBar} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    minWidth: '45%',
    borderRadius: 0,
  },
  cardSelected: {
    backgroundColor: Colors.surfaceElevated,
  },
  sub: {
    marginTop: Spacing.xs,
  },
  activeBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.heat,
  },
});

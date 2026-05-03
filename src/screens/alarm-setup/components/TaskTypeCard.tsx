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
  disabled?: boolean;
  onPress: () => void;
}

export function TaskTypeCard({ type, selected, disabled, onPress }: TaskTypeCardProps) {
  const display = TASK_DISPLAY[type];
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected, disabled && styles.cardDisabled]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.titleRow}>
        <VoltageText variant="h4" color={disabled ? Colors.textMuted : selected ? Colors.heat : Colors.textPrimary}>
          {display.label}
        </VoltageText>
        {disabled && (
          <VoltageText variant="caption" color={Colors.error} style={styles.lockBadge}>
            NO PERM
          </VoltageText>
        )}
      </View>
      <VoltageText variant="caption" color={disabled ? Colors.textMuted : Colors.textSecondary} style={styles.sub}>
        {display.sublabel}
      </VoltageText>
      {selected && !disabled && <View style={styles.activeBar} />}
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
  cardDisabled: {
    opacity: 0.45,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  lockBadge: {
    letterSpacing: 1,
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

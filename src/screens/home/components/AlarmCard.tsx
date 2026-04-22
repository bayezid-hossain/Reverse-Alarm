import React from 'react';
import { View, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Alarm } from '@/types/alarm.types';
import { VoltageText } from '@/components/VoltageText';
import { VoltageCard } from '@/components/VoltageCard';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';
import { TASK_DISPLAY } from '@/constants/missions';
import { formatAlarmTime, formatRepeatDays } from '@/utils/timeUtils';

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: () => void;
  onPress: () => void;
  onDelete: () => void;
}

export function AlarmCard({ alarm, onToggle, onPress, onDelete }: AlarmCardProps) {
  const isArmed = alarm.status === 'active';
  const task = TASK_DISPLAY[alarm.taskType];

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onDelete} activeOpacity={0.85}>
      <VoltageCard accent={isArmed} style={styles.card}>
        <View style={styles.row}>
          <View style={styles.timeBlock}>
            <View style={styles.timeRow}>
              <VoltageText variant="h2">{formatAlarmTime(alarm.hour, alarm.minute).split(' ')[0]}</VoltageText>
              <VoltageText variant="caption" color={Colors.textSecondary} style={styles.period}>
                {formatAlarmTime(alarm.hour, alarm.minute).split(' ')[1]}
              </VoltageText>
            </View>
            <VoltageText variant="caption" color={Colors.textSecondary}>
              {formatRepeatDays(alarm.repeatDays)}
            </VoltageText>
          </View>
          <View style={styles.right}>
            <View style={[styles.statusPill, { backgroundColor: isArmed ? Colors.heat : Colors.inactive }]}>
              <VoltageText variant="label" color={isArmed ? Colors.textInverse : Colors.textMuted}>
                {isArmed ? 'ARMED' : 'STANDBY'}
              </VoltageText>
            </View>
            <Switch
              value={isArmed}
              onValueChange={onToggle}
              trackColor={{ false: Colors.surfaceMuted, true: Colors.heat }}
              thumbColor={Colors.textPrimary}
            />
          </View>
        </View>
        <View style={styles.taskRow}>
          <VoltageText variant="caption" color={Colors.textMuted}>
            MISSION: {task.label}
          </VoltageText>
          {alarm.label ? (
            <VoltageText variant="caption" color={Colors.textMuted}>
              {alarm.label}
            </VoltageText>
          ) : null}
        </View>
      </VoltageCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  timeBlock: {
    gap: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  period: {
    marginBottom: 4, // Slight nudge to align better with large text baseline
  },
  right: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 0,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
});

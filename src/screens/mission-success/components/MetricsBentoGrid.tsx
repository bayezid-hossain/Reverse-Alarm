import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MissionStats } from '@/types/mission.types';
import { VoltageText } from '@/components/VoltageText';
import { VoltageCard } from '@/components/VoltageCard';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';

interface MetricsBentoGridProps {
  stats: MissionStats;
}

function formatMs(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function MetricsBentoGrid({ stats }: MetricsBentoGridProps) {
  return (
    <View style={styles.grid}>
      <VoltageCard elevated style={styles.cell}>
        <VoltageText variant="caption" color={Colors.textMuted}>TIME TO WAKE</VoltageText>
        <VoltageText variant="h3" color={Colors.clearance}>{formatMs(stats.timeToWakeMs)}</VoltageText>
      </VoltageCard>

      {stats.stepsRecorded !== null && (
        <VoltageCard elevated style={styles.cell}>
          <VoltageText variant="caption" color={Colors.textMuted}>STEPS</VoltageText>
          <VoltageText variant="h3" color={Colors.warning}>{stats.stepsRecorded}</VoltageText>
        </VoltageCard>
      )}

      {stats.voiceAccuracy !== null && (
        <VoltageCard elevated style={styles.cell}>
          <VoltageText variant="caption" color={Colors.textMuted}>VOICE ACCURACY</VoltageText>
          <VoltageText variant="h3" color={Colors.heat}>
            {Math.round(stats.voiceAccuracy * 100)}%
          </VoltageText>
        </VoltageCard>
      )}

      <VoltageCard elevated style={styles.cell}>
        <VoltageText variant="caption" color={Colors.textMuted}>ATTEMPTS</VoltageText>
        <VoltageText variant="h3" color={Colors.textPrimary}>{stats.taskAttempts}</VoltageText>
      </VoltageCard>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  cell: {
    flex: 1,
    minWidth: '45%',
    gap: Spacing.xs,
  },
});

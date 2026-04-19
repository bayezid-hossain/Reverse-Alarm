import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { VoltageText } from '@/components/VoltageText';
import { PulseIndicator } from '@/components/PulseIndicator';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';

function formatUptime(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600).toString().padStart(2, '0');
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

export function SystemStatusHeader() {
  const [startTime] = useState(Date.now());
  const [uptime, setUptime] = useState('00:00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(formatUptime(Date.now() - startTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <PulseIndicator color={Colors.clearance} size={8} />
        <VoltageText variant="label" color={Colors.clearance} style={styles.status}>
          SYSTEM ARMED
        </VoltageText>
      </View>
      <VoltageText variant="caption" color={Colors.textMuted}>
        UPTIME {uptime}
      </VoltageText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  status: {
    letterSpacing: 2,
  },
});

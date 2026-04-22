import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MissionStackParamList } from '@/types/navigation.types';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';
import { VoltageText } from '@/components/VoltageText';
import { VoltageButton } from '@/components/VoltageButton';
import { MetricsBentoGrid } from './components/MetricsBentoGrid';
import { useStore } from '@/store';
import { ForegroundServiceModule } from '@/native/ForegroundServiceModule';
import { WakeLockModule } from '@/native/WakeLockModule';
import { VolumeModule } from '@/native/VolumeModule';
import { navigateToHome } from '@/navigation/navigationRef';
import { AlarmScheduler } from '@/services/alarm/AlarmScheduler';
import { AlarmModule } from '@/native/AlarmModule';

type Nav = StackNavigationProp<MissionStackParamList>;
type Route = RouteProp<MissionStackParamList, 'MissionSuccess'>;

export default function MissionSuccessScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { result } = route.params;

  const resetMission = useStore((s) => s.resetMission);
  const updateAlarm = useStore((s) => s.updateAlarm);
  const alarms = useStore((s) => s.alarms);

  useEffect(() => {
    ForegroundServiceModule.stopService().catch(() => {});
    WakeLockModule.release().catch(() => {});
    VolumeModule.restoreVolume().catch(() => {});
    AlarmModule.clearTriggeredAlarm().catch(() => {});

    const alarm = alarms.find((a) => a.id === result.alarmId);
    if (alarm?.isOneShot) {
      updateAlarm(result.alarmId, { status: 'inactive', snoozeCount: 0 });
    } else if (alarm) {
      // Recurring — reschedule next occurrence, stay active regardless of schedule success
      AlarmScheduler.schedule(alarm)
        .then((nextTriggerAt) => {
          updateAlarm(result.alarmId, { status: 'active', snoozeCount: 0, nextTriggerAt });
        })
        .catch(() => {
          updateAlarm(result.alarmId, { status: 'active', snoozeCount: 0 });
        });
    }
  }, []);

  function handleDismiss() {
    resetMission();
    navigateToHome();
  }

  const completedAt = new Date(result.completedAt);
  const timeStr = completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.successBadge}>
          <VoltageText variant="label" color={Colors.clearance}>● MISSION DEPLOYED</VoltageText>
        </View>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <VoltageText variant="display" color={Colors.clearance} style={styles.check}>✓</VoltageText>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <VoltageText variant="h3" color={Colors.textPrimary}>SYSTEM DEACTIVATED</VoltageText>
        <VoltageText variant="body" color={Colors.textSecondary}>
          Alarm neutralised successfully. Mission data logged.
        </VoltageText>
      </View>

      {/* Metrics */}
      <MetricsBentoGrid stats={result.stats} />

      {/* Timestamp */}
      <View style={styles.timestamp}>
        <VoltageText variant="caption" color={Colors.textMuted}>
          LOGGED AT {timeStr}
        </VoltageText>
      </View>

      {/* Dismiss */}
      <VoltageButton
        label="DISMISS SYSTEM"
        fullWidth
        onPress={handleDismiss}
        style={styles.cta}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.vantablack,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  successBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  check: {
    color: Colors.clearance,
  },
  summary: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  timestamp: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  cta: {
    marginTop: 'auto',
  },
});

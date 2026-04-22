import React, { useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MissionStackParamList } from '@/types/navigation.types';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';
import { VoltageText } from '@/components/VoltageText';
import { VoltageButton } from '@/components/VoltageButton';
import { PulseIndicator } from '@/components/PulseIndicator';
import { useStore } from '@/store';
import { TASK_DISPLAY } from '@/constants/missions';
import { formatAlarmTime } from '@/utils/timeUtils';
import { ForegroundServiceModule } from '@/native/ForegroundServiceModule';
import { WakeLockModule } from '@/native/WakeLockModule';
import { VolumeModule } from '@/native/VolumeModule';
import { navigateToHome } from '@/navigation/navigationRef';
import { AlarmScheduler } from '@/services/alarm/AlarmScheduler';
import { AlarmModule } from '@/native/AlarmModule';

type Nav = StackNavigationProp<MissionStackParamList>;
type Route = RouteProp<MissionStackParamList, 'ActiveAlarm'>;

export default function ActiveAlarmScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { alarmId } = route.params;

  const alarm = useStore((s) => s.alarms.find((a) => a.id === alarmId));
  const startRinging = useStore((s) => s.startRinging);
  const updateAlarm = useStore((s) => s.updateAlarm);

  useEffect(() => {
    startRinging(alarmId);
  }, [alarmId]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  function handleStartMission() {
    if (!alarm) return;
    const config = alarm.taskConfig;
    switch (alarm.taskType) {
      case 'steps':
        navigation.navigate('StepMission', { taskConfig: config as any, alarmId });
        break;
      case 'voice':
        navigation.navigate('VoiceMission', { taskConfig: config as any, alarmId });
        break;
      case 'photo':
        navigation.navigate('VisualSyncMission', { taskConfig: config as any, alarmId });
        break;
      case 'qr':
        navigation.navigate('QRScanMission', { taskConfig: config as any, alarmId });
        break;
    }
  }

  async function stopAlarm() {
    ForegroundServiceModule.stopService().catch(() => {});
    WakeLockModule.release().catch(() => {});
    VolumeModule.restoreVolume().catch(() => {});
  }

  async function handleDismiss() {
    if (!alarm) return;
    await stopAlarm();
    if (alarm.isOneShot) {
      updateAlarm(alarmId, { status: 'inactive', snoozeCount: 0 });
    } else {
      AlarmScheduler.schedule(alarm)
        .then((nextTriggerAt) => {
          updateAlarm(alarmId, { status: 'active', snoozeCount: 0, nextTriggerAt });
        })
        .catch(() => {
          updateAlarm(alarmId, { status: 'active', snoozeCount: 0 });
        });
    }
    navigateToHome();
  }

  async function handleSnooze() {
    if (!alarm) return;
    const snoozeMs = (alarm.snoozeIntervalMinutes ?? 5) * 60 * 1000;
    const triggerAtMs = Date.now() + snoozeMs;
    await stopAlarm();
    await AlarmModule.scheduleAlarm({
      alarmId: alarm.id,
      triggerAtMs,
      label: alarm.label || 'ALARM',
      volume: alarm.volume,
      isNormal: true,
      snoozeIntervalMinutes: alarm.snoozeIntervalMinutes ?? 5,
      maxSnoozeCount: alarm.maxSnoozeCount ?? 3,
    });
    updateAlarm(alarmId, {
      snoozeCount: (alarm.snoozeCount ?? 0) + 1,
      nextTriggerAt: triggerAtMs,
      status: 'active',
    });
    navigateToHome();
  }

  const isNormal = alarm?.taskType === 'normal';
  const taskDisplay = alarm && !isNormal ? TASK_DISPLAY[alarm.taskType] : null;
  const timeStr = alarm ? formatAlarmTime(alarm.hour, alarm.minute) : '--:--';
  const canSnooze = alarm ? (alarm.snoozeCount ?? 0) < (alarm.maxSnoozeCount ?? 3) : false;
  const snoozeMin = alarm?.snoozeIntervalMinutes ?? 5;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <PulseIndicator color={Colors.error} size={10} />
        <VoltageText variant="label" color={Colors.error}>
          {isNormal ? 'ALARM' : 'CRITICAL ALERT'}
        </VoltageText>
      </View>

      <View style={styles.timeBlock}>
        <View style={styles.timeRow}>
          <VoltageText variant="display" color={Colors.textPrimary} style={styles.time}>
            {timeStr.split(' ')[0]}
          </VoltageText>
          {timeStr.includes(' ') && (
            <VoltageText variant="h2" color={Colors.heat} style={styles.period}>
              {timeStr.split(' ')[1]}
            </VoltageText>
          )}
        </View>
      </View>

      {isNormal ? (
        /* ── Normal alarm UI ─────────────────────────────── */
        <>
          <View style={styles.missionBlock}>
            <VoltageText variant="h3" color={Colors.textPrimary}>
              {alarm?.label || 'ALARM'}
            </VoltageText>
            {canSnooze ? (
              <VoltageText variant="body" color={Colors.textSecondary}>
                {(alarm?.maxSnoozeCount ?? 3) - (alarm?.snoozeCount ?? 0)} snooze{((alarm?.maxSnoozeCount ?? 3) - (alarm?.snoozeCount ?? 0)) !== 1 ? 's' : ''} remaining
              </VoltageText>
            ) : (
              <VoltageText variant="body" color={Colors.error}>NO SNOOZES LEFT</VoltageText>
            )}
          </View>

          <View style={styles.cta}>
            {canSnooze && (
              <VoltageButton
                label={`SNOOZE ${snoozeMin}m`}
                fullWidth
                onPress={handleSnooze}
                style={styles.snoozeBtn}
              />
            )}
            <VoltageButton
              label="DISMISS"
              fullWidth
              onPress={handleDismiss}
            />
          </View>
        </>
      ) : (
        /* ── Mission alarm UI ────────────────────────────── */
        <>
          <View style={styles.missionBlock}>
            <VoltageText variant="h3" color={Colors.warning} style={styles.missionText}>
              {taskDisplay
                ? `${taskDisplay.sublabel.toUpperCase()} TO DEACTIVATE`
                : 'COMPLETE MISSION TO DEACTIVATE'}
            </VoltageText>
            {taskDisplay && (
              <VoltageText variant="body" color={Colors.textSecondary}>
                {taskDisplay.label}
              </VoltageText>
            )}
          </View>

          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <VoltageText variant="caption" color={Colors.textMuted}>LOCK STATE</VoltageText>
              <VoltageText variant="label" color={Colors.error}>ENGAGED</VoltageText>
            </View>
            <View style={styles.statusItem}>
              <VoltageText variant="caption" color={Colors.textMuted}>AUDIO</VoltageText>
              <VoltageText variant="label" color={Colors.warning}>MAX VOLUME</VoltageText>
            </View>
            <View style={styles.statusItem}>
              <VoltageText variant="caption" color={Colors.textMuted}>BYPASS</VoltageText>
              <VoltageText variant="label" color={Colors.textMuted}>DISABLED</VoltageText>
            </View>
          </View>

          <View style={styles.cta}>
            <VoltageButton
              label="START MISSION"
              fullWidth
              onPress={handleStartMission}
            />
          </View>
        </>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  timeBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  time: {
    fontSize: 96,
    lineHeight: 96,
  },
  period: {
    marginBottom: 12,
  },
  missionBlock: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  missionText: {
    lineHeight: 32,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
  },
  statusItem: {
    alignItems: 'center',
    gap: 4,
  },
  cta: {
    marginTop: 'auto',
    gap: Spacing.sm,
  },
  snoozeBtn: {
    backgroundColor: Colors.surfaceMuted,
  },
});

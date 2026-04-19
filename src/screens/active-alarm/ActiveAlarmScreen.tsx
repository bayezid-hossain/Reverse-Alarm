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

type Nav = StackNavigationProp<MissionStackParamList>;
type Route = RouteProp<MissionStackParamList, 'ActiveAlarm'>;

export default function ActiveAlarmScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { alarmId } = route.params;

  const alarm = useStore((s) => s.alarms.find((a) => a.id === alarmId));
  const startRinging = useStore((s) => s.startRinging);

  useEffect(() => {
    startRinging(alarmId);
  }, [alarmId]);

  // Block back button during alarm
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

  const taskDisplay = alarm ? TASK_DISPLAY[alarm.taskType] : null;
  const timeStr = alarm ? formatAlarmTime(alarm.hour, alarm.minute) : '--:--';

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <PulseIndicator color={Colors.error} size={10} />
        <VoltageText variant="label" color={Colors.error}>CRITICAL ALERT</VoltageText>
      </View>

      {/* Time */}
      <View style={styles.timeBlock}>
        <VoltageText variant="display" color={Colors.textPrimary} style={styles.time}>
          {timeStr}
        </VoltageText>
      </View>

      {/* Mission description */}
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

      {/* Security status */}
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

      {/* CTA */}
      <View style={styles.cta}>
        <VoltageButton
          label="START MISSION"
          fullWidth
          onPress={handleStartMission}
        />
      </View>
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
  time: {
    fontSize: 96,
    lineHeight: 96,
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
  },
});

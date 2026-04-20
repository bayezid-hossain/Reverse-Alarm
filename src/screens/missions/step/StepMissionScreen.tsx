import React, { useEffect, useState } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MissionStackParamList } from '@/types/navigation.types';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';
import { VoltageText } from '@/components/VoltageText';
import { VoltageButton } from '@/components/VoltageButton';
import { SegmentedProgressBar } from '@/components/SegmentedProgressBar';
import { StepCounter } from './components/StepCounter';
import { useStepCounter } from '@/hooks/useStepCounter';
import { useStore } from '@/store';
import { buildMissionResult } from '@/utils/missionUtils';
import { TASK_DISPLAY, DEFAULT_TASK_CONFIGS } from '@/constants/missions';

type Nav = StackNavigationProp<MissionStackParamList>;
type Route = RouteProp<MissionStackParamList, 'StepMission'>;

export default function StepMissionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { taskConfig, alarmId } = route.params;
  const { stepCount, startCounting, stopCounting } = useStepCounter();
  const missionStartedAt = useStore((s) => s.missionStartedAt);
  const taskAttempts = useStore((s) => s.taskAttempts);
  const incrementAttempts = useStore((s) => s.incrementAttempts);
  const [showSwitch, setShowSwitch] = useState(false);

  const progress = Math.min(stepCount / taskConfig.targetSteps, 1);

  useEffect(() => {
    startCounting();
    incrementAttempts();
    return () => stopCounting();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (stepCount >= taskConfig.targetSteps) {
      stopCounting();
      const result = buildMissionResult(alarmId, 'steps', {
        timeToWakeMs: Date.now() - (missionStartedAt ?? Date.now()),
        taskAttempts,
        stepsRecorded: stepCount,
        voiceAccuracy: null,
      });
      navigation.replace('MissionSuccess', { result });
    }
  }, [stepCount, taskConfig.targetSteps]);

  function switchMission(type: keyof typeof DEFAULT_TASK_CONFIGS) {
    if (type === 'steps') return;
    stopCounting();
    const config = DEFAULT_TASK_CONFIGS[type] as any;
    switch (type) {
      case 'voice': navigation.replace('VoiceMission', { taskConfig: config, alarmId }); break;
      case 'photo': navigation.replace('VisualSyncMission', { taskConfig: config, alarmId }); break;
      case 'qr': navigation.replace('QRScanMission', { taskConfig: config, alarmId }); break;
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <VoltageText variant="label" color={Colors.textMuted}>SYSTEM ARMED</VoltageText>
        <View style={styles.badge}>
          <VoltageText variant="label" color={Colors.warning}>VERIFICATION MODE</VoltageText>
        </View>
      </View>

      <VoltageText variant="h3" color={Colors.error} style={styles.urgency}>
        DEACTIVATE OR ALERT
      </VoltageText>

      <VoltageText variant="h1" color={Colors.surface} style={styles.decoration}>
        MOVE
      </VoltageText>

      <View style={styles.counterBlock}>
        <StepCounter current={stepCount} target={taskConfig.targetSteps} />
      </View>

      <View style={styles.progressBlock}>
        <SegmentedProgressBar progress={progress} segments={14} color={Colors.warning} />
        <VoltageText variant="caption" color={Colors.textMuted} style={styles.progressLabel}>
          {Math.round(progress * 100)}% — {stepCount}/{taskConfig.targetSteps} STEPS
        </VoltageText>
      </View>

      <View style={styles.instruction}>
        <VoltageText variant="bodySmall" color={Colors.textSecondary}>
          Walk naturally. Steps detected via hardware motion sensor.{'\n'}
          Keep phone in hand or pocket while walking.
        </VoltageText>
      </View>

      {showSwitch ? (
        <View style={styles.switchPanel}>
          <VoltageText variant="label" color={Colors.textMuted} style={styles.switchLabel}>
            SWITCH MISSION
          </VoltageText>
          <View style={styles.switchRow}>
            {(['voice', 'photo', 'qr'] as const).map((t) => (
              <VoltageButton
                key={t}
                label={TASK_DISPLAY[t].label}
                onPress={() => switchMission(t)}
                style={styles.switchBtn}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.bioPanel}>
        <View style={styles.bioItem}>
          <VoltageText variant="caption" color={Colors.textMuted}>MOTION</VoltageText>
          <VoltageText variant="label" color={Colors.clearance}>CALIBRATED</VoltageText>
        </View>
        <View style={styles.bioItem}>
          <VoltageText variant="caption" color={Colors.textMuted}>LOCK STATE</VoltageText>
          <VoltageText variant="label" color={Colors.error}>ENGAGED</VoltageText>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <VoltageButton
            label="SWITCH MISSION"
            onPress={() => setShowSwitch((v) => !v)}
            style={styles.switchToggle}
          />
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  badge: {
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  urgency: {
    marginBottom: Spacing.md,
    letterSpacing: 2,
  },
  decoration: {
    position: 'absolute',
    right: Spacing.md,
    top: 160,
    opacity: 0.06,
    fontSize: 100,
  },
  counterBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBlock: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  progressLabel: {
    textAlign: 'center',
  },
  instruction: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  switchPanel: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  switchLabel: {
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  switchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  switchBtn: {
    flex: 1,
  },
  bioPanel: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  bioItem: {
    gap: 4,
  },
  switchToggle: {
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Spacing.sm,
  },
});

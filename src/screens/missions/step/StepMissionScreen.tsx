import React, { useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MissionStackParamList } from '@/types/navigation.types';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';
import { VoltageText } from '@/components/VoltageText';
import { SegmentedProgressBar } from '@/components/SegmentedProgressBar';
import { StepCounter } from './components/StepCounter';
import { useStepCounter } from '@/hooks/useStepCounter';
import { useStore } from '@/store';
import { buildMissionResult } from '@/utils/missionUtils';

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

  const progress = Math.min(stepCount / taskConfig.targetSteps, 1);

  useEffect(() => {
    startCounting();
    incrementAttempts();
    return () => stopCounting();
  }, []);

  // Block back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Check completion
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

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <VoltageText variant="label" color={Colors.textMuted}>SYSTEM ARMED</VoltageText>
        <View style={styles.badge}>
          <VoltageText variant="label" color={Colors.warning}>VERIFICATION MODE</VoltageText>
        </View>
      </View>

      {/* Urgency */}
      <VoltageText variant="h3" color={Colors.error} style={styles.urgency}>
        DEACTIVATE OR ALERT
      </VoltageText>

      {/* Decoration text */}
      <VoltageText variant="h1" color={Colors.surface} style={styles.decoration}>
        MOVE
      </VoltageText>

      {/* Step counter */}
      <View style={styles.counterBlock}>
        <StepCounter current={stepCount} target={taskConfig.targetSteps} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBlock}>
        <SegmentedProgressBar progress={progress} segments={14} color={Colors.warning} />
        <VoltageText variant="caption" color={Colors.textMuted} style={styles.progressLabel}>
          {Math.round(progress * 100)}% — {stepCount}/{taskConfig.targetSteps} STEPS
        </VoltageText>
      </View>

      {/* Instruction */}
      <View style={styles.instruction}>
        <VoltageText variant="bodySmall" color={Colors.textSecondary}>
          Walk naturally. Steps are detected via motion sensor.{'\n'}
          Keep phone in hand or pocket while walking.
        </VoltageText>
      </View>

      {/* Side data */}
      <View style={styles.bioPanel}>
        <View style={styles.bioItem}>
          <VoltageText variant="caption" color={Colors.textMuted}>MOTION</VoltageText>
          <VoltageText variant="label" color={Colors.clearance}>CALIBRATED</VoltageText>
        </View>
        <View style={styles.bioItem}>
          <VoltageText variant="caption" color={Colors.textMuted}>LOCK STATE</VoltageText>
          <VoltageText variant="label" color={Colors.error}>ENGAGED</VoltageText>
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
  bioPanel: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  bioItem: {
    gap: 4,
  },
});

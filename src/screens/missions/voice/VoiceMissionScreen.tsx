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
import { PulseIndicator } from '@/components/PulseIndicator';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { usePermissions } from '@/hooks/usePermissions';
import { useStore } from '@/store';
import { MissionValidator } from '@/services/mission/MissionValidator';
import { buildMissionResult } from '@/utils/missionUtils';

type Nav = StackNavigationProp<MissionStackParamList>;
type Route = RouteProp<MissionStackParamList, 'VoiceMission'>;

export default function VoiceMissionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { taskConfig, alarmId } = route.params;

  const { isListening, transcript, accuracy, error, startListening, stopListening } = useVoiceRecognition();
  const { micPermission, requestMic } = usePermissions();
  const missionStartedAt = useStore((s) => s.missionStartedAt);
  const taskAttempts = useStore((s) => s.taskAttempts);
  const incrementAttempts = useStore((s) => s.incrementAttempts);

  useEffect(() => {
    incrementAttempts();
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => { sub.remove(); stopListening(); };
  }, []);

  async function handleStartRecording() {
    if (!micPermission) {
      await requestMic();
      return;
    }
    await startListening();
  }

  async function handleSubmit() {
    await stopListening();
    const valid = MissionValidator.validateVoice(transcript, taskConfig.phrase, taskConfig.matchThreshold);
    if (valid) {
      const result = buildMissionResult(alarmId, 'voice', {
        timeToWakeMs: Date.now() - (missionStartedAt ?? Date.now()),
        taskAttempts,
        voiceAccuracy: accuracy,
        stepsRecorded: null,
      });
      navigation.replace('MissionSuccess', { result });
    } else {
      await startListening();
    }
  }

  const clarityIndex = Math.round((accuracy ?? 0) * 100);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <VoltageText variant="label" color={Colors.textMuted}>SYSTEM ARMED</VoltageText>
        <VoltageText variant="label" color={Colors.heat}>VOICE AUTH</VoltageText>
      </View>

      <VoltageText variant="h3" color={Colors.error} style={styles.urgency}>
        RECITE THE DAILY MANIFESTO
      </VoltageText>

      <View style={styles.recordingStatus}>
        <PulseIndicator color={Colors.error} size={10} active={isListening} />
        <VoltageText variant="label" color={isListening ? Colors.error : Colors.textMuted}>
          {isListening ? 'RECORDING ACTIVE' : 'PRESS RECORD TO START'}
        </VoltageText>
      </View>

      {/* Phrase to recite */}
      <View style={styles.phraseBox}>
        <VoltageText variant="body" color={Colors.textPrimary} style={styles.phrase}>
          "{taskConfig.phrase}"
        </VoltageText>
      </View>

      {/* Live transcript */}
      {transcript ? (
        <View style={styles.transcriptBox}>
          <VoltageText variant="caption" color={Colors.textSecondary}>{transcript}</VoltageText>
        </View>
      ) : null}

      {/* Error */}
      {error && !isListening ? (
        <View style={styles.errorBox}>
          <VoltageText variant="caption" color={Colors.error}>
            {!micPermission ? 'MIC PERMISSION REQUIRED — TAP TO GRANT' : `ERROR: ${error}`}
          </VoltageText>
        </View>
      ) : null}

      {/* Metrics */}
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <VoltageText variant="caption" color={Colors.textMuted}>CLARITY INDEX</VoltageText>
          <VoltageText variant="h4" color={Colors.clearance}>{clarityIndex}%</VoltageText>
        </View>
        <View style={styles.metric}>
          <VoltageText variant="caption" color={Colors.textMuted}>THRESHOLD</VoltageText>
          <VoltageText variant="h4" color={Colors.textSecondary}>
            {Math.round(taskConfig.matchThreshold * 100)}%
          </VoltageText>
        </View>
      </View>

      {/* Waveform */}
      <WaveformVisualizer active={isListening} />

      {/* Controls */}
      <View style={styles.controls}>
        {!isListening ? (
          <VoltageButton
            label={micPermission ? 'START RECORDING' : 'GRANT MIC ACCESS'}
            fullWidth
            onPress={handleStartRecording}
          />
        ) : (
          <VoltageButton label="SUBMIT AUTH" fullWidth onPress={handleSubmit} />
        )}
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
    marginBottom: Spacing.md,
  },
  urgency: {
    marginBottom: Spacing.md,
    letterSpacing: 1,
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
  },
  phraseBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flex: 1,
  },
  phrase: {
    lineHeight: 26,
    fontStyle: 'italic',
  },
  transcriptBox: {
    backgroundColor: Colors.surfaceMuted,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.error,
  },
  metrics: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  metric: {
    gap: 4,
  },
  controls: {
    marginTop: Spacing.md,
  },
});

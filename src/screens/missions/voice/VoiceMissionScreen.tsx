import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  BackHandler,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
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
import { TASK_DISPLAY, DEFAULT_TASK_CONFIGS, getRandomVoicePhrase } from '@/constants/missions';

type Nav = StackNavigationProp<MissionStackParamList>;
type Route = RouteProp<MissionStackParamList, 'VoiceMission'>;

type Stage = 'idle' | 'recording' | 'stopped' | 'validating' | 'failed';

export default function VoiceMissionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { taskConfig, alarmId } = route.params;
  const [activePhrase] = useState(getRandomVoicePhrase());

  const { isListening, transcript, error, startListening, stopListening } =
    useVoiceRecognition();
  const { micPermission, requestMic } = usePermissions();
  const missionStartedAt = useStore((s) => s.missionStartedAt);
  const taskAttempts = useStore((s) => s.taskAttempts);
  const incrementAttempts = useStore((s) => s.incrementAttempts);

  const [stage, setStage] = useState<Stage>('idle');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [textMode, setTextMode] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showSwitch, setShowSwitch] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    incrementAttempts();
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => {
      sub.remove();
      stopListening();
    };
  }, []);

  // When Android ends recognition automatically, move to stopped state (don't auto-validate)
  useEffect(() => {
    if (!isListening && stage === 'recording') {
      setStage('stopped');
    }
  }, [isListening]);

  async function handleStartRecording() {
    if (!micPermission) { await requestMic(); return; }
    submittedRef.current = false;
    setMatchScore(null);
    setStage('recording');
    await startListening();
  }

  async function handleStopRecording() {
    await stopListening();
    setStage('stopped');
  }

  async function handleSubmit() {
    const text = textMode ? typedText : transcript;
    if (!text.trim()) return;
    setStage('validating');
    // Brief pause so loading state is visible
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 600));
    const score = MissionValidator.voiceScore(text, activePhrase);
    setMatchScore(score);
    const valid = score >= taskConfig.matchThreshold;
    if (valid && !submittedRef.current) {
      submittedRef.current = true;
      const result = buildMissionResult(alarmId, 'voice', {
        timeToWakeMs: Date.now() - (missionStartedAt ?? Date.now()),
        taskAttempts,
        voiceAccuracy: score,
        stepsRecorded: null,
      });
      navigation.replace('MissionSuccess', { result });
    } else {
      setStage('failed');
    }
  }

  function handleReset() {
    submittedRef.current = false;
    setMatchScore(null);
    setTypedText('');
    setStage('idle');
  }

  const threshold = taskConfig.matchThreshold;
  const scoreColor = matchScore !== null
    ? (matchScore >= threshold ? Colors.clearance : Colors.error)
    : Colors.textMuted;

  const inputText = textMode ? typedText : transcript;
  const hasInput = inputText.trim().length > 0;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <VoltageText variant="label" color={Colors.textMuted}>SYSTEM ARMED</VoltageText>
        <VoltageText variant="label" color={Colors.heat}>VOICE AUTH</VoltageText>
      </View>

      <VoltageText variant="h3" color={Colors.error} style={styles.urgency}>
        RECITE THE MANIFESTO
      </VoltageText>

      {/* Status row */}
      <View style={styles.statusRow}>
        <PulseIndicator color={Colors.error} size={10} active={stage === 'recording'} />
        <VoltageText variant="label" color={stage === 'recording' ? Colors.error : Colors.textMuted}>
          {stage === 'idle' ? 'READY' :
           stage === 'recording' ? 'RECORDING — SPEAK NOW' :
           stage === 'stopped' ? 'SPEECH CAPTURED' :
           stage === 'validating' ? 'ANALYSING...' :
           'VALIDATION FAILED'}
        </VoltageText>
        {/* Mode toggle */}
        <TouchableOpacity onPress={() => { setTextMode((v) => !v); handleReset(); }} style={styles.modeToggle}>
          <VoltageText variant="caption" color={Colors.heat}>
            {textMode ? '🎤 SPEAK' : '⌨ TYPE'}
          </VoltageText>
        </TouchableOpacity>
      </View>

      {/* Phrase box */}
      <View style={styles.phraseBox}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <VoltageText variant="body" color={Colors.textPrimary} style={styles.phrase}>
            "{activePhrase}"
          </VoltageText>
        </ScrollView>
      </View>

      {/* Input area */}
      {textMode ? (
        <TextInput
          style={styles.textInput}
          placeholder="Type the phrase above..."
          placeholderTextColor={Colors.textMuted}
          value={typedText}
          onChangeText={setTypedText}
          multiline
          editable={stage !== 'validating'}
        />
      ) : (
        <>
          {transcript.length > 0 ? (
            <View style={styles.transcriptBox}>
              <VoltageText variant="caption" color={Colors.textMuted} style={styles.transcriptLabel}>
                HEARD:
              </VoltageText>
              <ScrollView style={styles.transcriptScroll} showsVerticalScrollIndicator={false}>
                <VoltageText variant="caption" color={Colors.textSecondary}>{transcript}</VoltageText>
              </ScrollView>
            </View>
          ) : null}
          {error && stage === 'idle' ? (
            <View style={styles.errorBox}>
              <VoltageText variant="caption" color={Colors.error}>
                {!micPermission ? 'MIC PERMISSION REQUIRED' : `ERROR: ${error}`}
              </VoltageText>
            </View>
          ) : null}
          <WaveformVisualizer active={stage === 'recording'} />
        </>
      )}

      {/* Match result */}
      {stage === 'failed' && matchScore !== null ? (
        <View style={[styles.matchBox, { borderLeftColor: scoreColor }]}>
          <View style={styles.matchScores}>
            <View style={styles.matchItem}>
              <VoltageText variant="caption" color={Colors.textMuted}>MATCH</VoltageText>
              <VoltageText variant="h3" color={scoreColor}>{Math.round(matchScore * 100)}%</VoltageText>
            </View>
            <View style={styles.matchItem}>
              <VoltageText variant="caption" color={Colors.textMuted}>NEED</VoltageText>
              <VoltageText variant="h3" color={Colors.textSecondary}>{Math.round(threshold * 100)}%</VoltageText>
            </View>
          </View>
          <VoltageText variant="caption" color={Colors.error} style={styles.matchHint}>
            SAY MORE WORDS FROM THE PHRASE — SPEAK CLEARLY AND COMPLETELY
          </VoltageText>
        </View>
      ) : null}

      {/* Validating loading */}
      {stage === 'validating' ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={Colors.heat} />
          <VoltageText variant="label" color={Colors.heat}> ANALYSING VOICE PRINT...</VoltageText>
        </View>
      ) : null}

      {/* Switch mission panel */}
      {showSwitch ? (
        <View style={styles.switchPanel}>
          <VoltageText variant="label" color={Colors.textMuted} style={styles.switchLabel}>SWITCH MISSION</VoltageText>
          <View style={styles.switchRow}>
            {(['steps', 'photo', 'qr'] as const).map((t) => (
              <VoltageButton
                key={t}
                label={TASK_DISPLAY[t].label}
                onPress={() => {
                  stopListening();
                  const config = DEFAULT_TASK_CONFIGS[t] as any;
                  switch (t) {
                    case 'steps': navigation.replace('StepMission', { taskConfig: config, alarmId }); break;
                    case 'photo': navigation.replace('VisualSyncMission', { taskConfig: config, alarmId }); break;
                    case 'qr': navigation.replace('QRScanMission', { taskConfig: config, alarmId }); break;
                  }
                }}
                style={styles.switchBtn}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* Controls */}
      <View style={styles.controls}>
        {stage === 'idle' && !textMode ? (
          <VoltageButton
            label={micPermission ? 'START RECORDING' : 'GRANT MIC ACCESS'}
            fullWidth
            onPress={handleStartRecording}
            style={styles.controlBtn}
          />
        ) : stage === 'recording' ? (
          <VoltageButton
            label="STOP RECORDING"
            fullWidth
            onPress={handleStopRecording}
            style={styles.controlBtn}
          />
        ) : stage === 'stopped' || (textMode && stage !== 'validating') ? (
          <>
            <VoltageButton
              label="SUBMIT"
              fullWidth
              onPress={handleSubmit}
              style={[styles.controlBtn, { opacity: hasInput ? 1 : 0.4 }]}
            />
            <VoltageButton
              label="TRY AGAIN"
              fullWidth
              onPress={handleReset}
              style={[styles.controlBtn, styles.secondaryBtn]}
            />
          </>
        ) : stage === 'failed' ? (
          <VoltageButton
            label="TRY AGAIN"
            fullWidth
            onPress={handleReset}
            style={styles.controlBtn}
          />
        ) : null}
        <VoltageButton
          label="SWITCH MISSION"
          fullWidth
          onPress={() => setShowSwitch((v) => !v)}
          style={styles.switchToggle}
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
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  urgency: {
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
  },
  modeToggle: {
    marginLeft: 'auto',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: Colors.surfaceMuted,
  },
  phraseBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    height: 110,
  },
  phrase: {
    lineHeight: 24,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
    fontFamily: 'SpaceMono',
    fontSize: 13,
    lineHeight: 20,
  },
  transcriptBox: {
    backgroundColor: Colors.surfaceMuted,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    maxHeight: 80,
  },
  transcriptLabel: {
    letterSpacing: 1,
    marginBottom: 2,
  },
  transcriptScroll: {
    flexGrow: 0,
  },
  errorBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.error,
  },
  matchBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
  },
  matchScores: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  matchItem: {
    gap: 2,
  },
  matchHint: {
    marginTop: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  controls: {
    marginTop: 'auto',
  },
  controlBtn: {
    marginBottom: Spacing.sm,
  },
  secondaryBtn: {
    backgroundColor: Colors.surfaceMuted,
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
  switchToggle: {
    backgroundColor: Colors.surfaceMuted,
  },
});

import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { VoltageButton } from '@/components/VoltageButton';
import { VoltageText } from '@/components/VoltageText';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';
import { TASK_DISPLAY, DEFAULT_TASK_CONFIGS } from '@/constants/missions';
import { usePermissions } from '@/hooks/usePermissions';
import { useStore } from '@/store';
import { MissionStackParamList } from '@/types/navigation.types';
import { buildMissionResult } from '@/utils/missionUtils';
import { ImageAnalysisModule } from '@/native/ImageAnalysisModule';

type Nav = StackNavigationProp<MissionStackParamList>;
type Route = RouteProp<MissionStackParamList, 'VisualSyncMission'>;

export default function VisualSyncMissionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { alarmId } = route.params;

  const device = useCameraDevice('back');
  const { cameraPermission, requestCamera } = usePermissions();
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<Camera>(null);
  const [showSwitch, setShowSwitch] = useState(false);

  const missionStartedAt = useStore((s) => s.missionStartedAt);
  const taskAttempts = useStore((s) => s.taskAttempts);
  const incrementAttempts = useStore((s) => s.incrementAttempts);

  useEffect(() => {
    incrementAttempts();
    requestCamera();
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    setError(null);
    try {
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      const brightness = await ImageAnalysisModule.getAverageBrightness(photo.path);
      if (brightness < 0.40) {
        setError(`TOO DARK (${Math.round(brightness * 100)}%) — TURN ON MAIN LIGHTS AND RETRY`);
        setCapturing(false);
        return;
      }
      const result = buildMissionResult(alarmId, 'photo', {
        timeToWakeMs: Date.now() - (missionStartedAt ?? Date.now()),
        taskAttempts,
        voiceAccuracy: null,
        stepsRecorded: null,
      });
      navigation.replace('MissionSuccess', { result });
    } catch (e: any) {
      setError('CAPTURE FAILED — TRY AGAIN');
      setCapturing(false);
    }
  }

  function switchMission(type: keyof typeof DEFAULT_TASK_CONFIGS) {
    if (type === 'photo') return;
    const config = DEFAULT_TASK_CONFIGS[type] as any;
    switch (type) {
      case 'steps': navigation.replace('StepMission', { taskConfig: config, alarmId }); break;
      case 'voice': navigation.replace('VoiceMission', { taskConfig: config, alarmId }); break;
      case 'qr': navigation.replace('QRScanMission', { taskConfig: config, alarmId }); break;
    }
  }

  if (!cameraPermission) {
    return (
      <SafeAreaView style={styles.screen}>
        <VoltageText variant="h3" color={Colors.error}>CAMERA ACCESS REQUIRED</VoltageText>
        <VoltageButton label="GRANT CAMERA" onPress={requestCamera} style={styles.gap} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <VoltageText variant="label" color={Colors.textMuted}>SYSTEM ARMED</VoltageText>
        <VoltageText variant="label" color={Colors.heat}>VISUAL SYNC</VoltageText>
      </View>

      <VoltageText variant="h3" color={Colors.warning} style={styles.mission}>
        PHOTOGRAPH YOUR SURROUNDINGS
      </VoltageText>

      <View style={styles.viewport}>
        {device ? (
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={true}
          />
        ) : null}
        <View style={styles.hudCornerTL} />
        <View style={styles.hudCornerBR} />
      </View>

      <View style={styles.instruction}>
        <VoltageText variant="bodySmall" color={Colors.textSecondary}>
          Get out of bed and take a photo of your room. Any clear photo confirms you are awake.
        </VoltageText>
      </View>

      {error ? (
        <VoltageText variant="caption" color={Colors.error} style={styles.gap}>{error}</VoltageText>
      ) : null}

      {showSwitch ? (
        <View style={styles.switchPanel}>
          <VoltageText variant="label" color={Colors.textMuted} style={styles.switchLabel}>
            SWITCH MISSION
          </VoltageText>
          <View style={styles.switchRow}>
            {(['steps', 'voice', 'qr'] as const).map((t) => (
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

      <View style={styles.controls}>
        <VoltageButton
          label={capturing ? 'CAPTURING...' : 'CAPTURE'}
          fullWidth
          onPress={handleCapture}
          style={{ opacity: capturing ? 0.6 : 1, marginBottom: Spacing.sm }}
        />
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
    marginBottom: Spacing.md,
  },
  mission: {
    marginBottom: Spacing.md,
  },
  viewport: {
    width: '100%',
    height: 260,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  hudCornerTL: {
    position: 'absolute', top: 12, left: 12,
    width: 24, height: 24,
    borderTopWidth: 2, borderLeftWidth: 2,
    borderColor: Colors.heat,
  },
  hudCornerBR: {
    position: 'absolute', bottom: 12, right: 12,
    width: 24, height: 24,
    borderBottomWidth: 2, borderRightWidth: 2,
    borderColor: Colors.heat,
  },
  instruction: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flex: 1,
  },
  gap: {
    marginTop: Spacing.md,
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
  controls: {
    marginTop: 'auto',
  },
  switchToggle: {
    backgroundColor: Colors.surfaceMuted,
  },
});

import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { SegmentedProgressBar } from '@/components/SegmentedProgressBar';
import { VoltageButton } from '@/components/VoltageButton';
import { VoltageText } from '@/components/VoltageText';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';
import { usePermissions } from '@/hooks/usePermissions';
import { MissionValidator } from '@/services/mission/MissionValidator';
import { useStore } from '@/store';
import { MissionStackParamList } from '@/types/navigation.types';
import { buildMissionResult } from '@/utils/missionUtils';

type Nav = StackNavigationProp<MissionStackParamList>;
type Route = RouteProp<MissionStackParamList, 'VisualSyncMission'>;

export default function VisualSyncMissionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { taskConfig, alarmId } = route.params;

  const device = useCameraDevice('back');
  const { cameraPermission, requestCamera } = usePermissions();
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedColor, setCapturedColor] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef<Camera>(null);

  const missionStartedAt = useStore((s) => s.missionStartedAt);
  const taskAttempts = useStore((s) => s.taskAttempts);
  const incrementAttempts = useStore((s) => s.incrementAttempts);

  useEffect(() => {
    incrementAttempts();
    requestCamera();
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Simulate scanning progress while camera is active
  useEffect(() => {
    if (!scanning) { setScanProgress(0); return; }
    const interval = setInterval(() => {
      setScanProgress((p) => Math.min(p + 0.05, 1));
    }, 100);
    return () => clearInterval(interval);
  }, [scanning]);

  async function handleCapture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      // Extract dominant color
      const { extractDominantColor } = await import('@/utils/colorUtils');
      const dominantHex = await extractDominantColor(photo.path);
      setCapturedColor(dominantHex);

      const valid = MissionValidator.validateColor(dominantHex, taskConfig.targetColor, taskConfig.colorToleranceDeltaE);
      if (valid) {
        const result = buildMissionResult(alarmId, 'photo', {
          timeToWakeMs: Date.now() - (missionStartedAt ?? Date.now()),
          taskAttempts,
          voiceAccuracy: null,
          stepsRecorded: null,
        });
        navigation.replace('MissionSuccess', { result });
      } else {
        setScanning(false);
        setScanProgress(0);
      }
    } catch (e) {
      setScanning(false);
    }
  }

  if (!cameraPermission) {
    return (
      <SafeAreaView style={styles.screen}>
        <VoltageText variant="h3" color={Colors.error}>CAMERA ACCESS REQUIRED</VoltageText>
        <VoltageButton label="GRANT CAMERA" onPress={requestCamera} style={styles.permBtn} />
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
        SCAN TARGET OBJECT
      </VoltageText>

      {/* Camera viewport */}
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
        {/* HUD overlay */}
        <View style={styles.hudCornerTL} />
        <View style={styles.hudCornerBR} />
        {scanning && (
          <View style={styles.scanLine} />
        )}
        <View style={styles.targetTag}>
          <VoltageText variant="caption" color={Colors.warning}>
            TARGET: {taskConfig.targetObjectLabel ?? 'COLOR MATCH'}
          </VoltageText>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressBlock}>
        <SegmentedProgressBar progress={scanProgress} segments={14} />
        <VoltageText variant="caption" color={Colors.textMuted}>
          ANALYSIS {Math.round(scanProgress * 100)}%
        </VoltageText>
      </View>

      {/* Instructions */}
      <View style={styles.instruction}>
        <VoltageText variant="bodySmall" color={Colors.textSecondary}>
          Point camera at the target object and press CAPTURE when aligned.
        </VoltageText>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <VoltageButton
          label={scanning ? 'SCANNING...' : 'CAPTURE'}
          fullWidth
          onPress={() => { setScanning(true); handleCapture(); }}
          style={{ opacity: scanning ? 0.6 : 1 }}
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
    height: 280,
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
  scanLine: {
    position: 'absolute',
    left: 0, right: 0,
    top: '50%',
    height: 2,
    backgroundColor: Colors.heat,
    opacity: 0.7,
  },
  targetTag: {
    position: 'absolute',
    bottom: 12, left: 12,
    backgroundColor: Colors.vantablack,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  progressBlock: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  instruction: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flex: 1,
  },
  controls: {
    marginTop: 'auto',
  },
  permBtn: {
    marginTop: Spacing.xl,
  },
});

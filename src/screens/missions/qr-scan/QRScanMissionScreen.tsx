import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { PulseIndicator } from '@/components/PulseIndicator';
import { VoltageButton } from '@/components/VoltageButton';
import { VoltageText } from '@/components/VoltageText';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';
import { TASK_DISPLAY, DEFAULT_TASK_CONFIGS } from '@/constants/missions';
import { usePermissions } from '@/hooks/usePermissions';
import { MissionValidator } from '@/services/mission/MissionValidator';
import { useStore } from '@/store';
import { MissionStackParamList } from '@/types/navigation.types';
import { buildMissionResult } from '@/utils/missionUtils';

type Nav = StackNavigationProp<MissionStackParamList>;
type Route = RouteProp<MissionStackParamList, 'QRScanMission'>;

export default function QRScanMissionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { taskConfig, alarmId } = route.params;

  const device = useCameraDevice('back');
  const { cameraPermission, requestCamera } = usePermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
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

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      if (scanned || codes.length === 0) return;
      const content = codes[0].value ?? '';
      setScanResult(content);
      setScanned(true);

      const valid = MissionValidator.validateQR(content, taskConfig.expectedContent, taskConfig.matchMode);
      if (valid) {
        const result = buildMissionResult(alarmId, 'qr', {
          timeToWakeMs: Date.now() - (missionStartedAt ?? Date.now()),
          taskAttempts,
          voiceAccuracy: null,
          stepsRecorded: null,
        });
        navigation.replace('MissionSuccess', { result });
      } else {
        setTimeout(() => { setScanned(false); setScanResult(null); }, 2000);
      }
    },
  });

  function switchMission(type: keyof typeof DEFAULT_TASK_CONFIGS) {
    if (type === 'qr') return;
    const config = DEFAULT_TASK_CONFIGS[type] as any;
    switch (type) {
      case 'steps': navigation.replace('StepMission', { taskConfig: config, alarmId }); break;
      case 'voice': navigation.replace('VoiceMission', { taskConfig: config, alarmId }); break;
      case 'photo': navigation.replace('VisualSyncMission', { taskConfig: config, alarmId }); break;
    }
  }

  if (!cameraPermission) {
    return (
      <SafeAreaView style={styles.screen}>
        <VoltageText variant="h3" color={Colors.error}>CAMERA ACCESS REQUIRED</VoltageText>
        <VoltageButton label="GRANT CAMERA" onPress={requestCamera} style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <VoltageText variant="label" color={Colors.textMuted}>SYSTEM ARMED</VoltageText>
        <VoltageText variant="label" color={Colors.heat}>SECURE SCAN</VoltageText>
      </View>

      <VoltageText variant="h3" color={Colors.warning} style={styles.mission}>
        SCAN QR TERMINAL
      </VoltageText>

      <View style={styles.viewport}>
        {device ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={!scanned}
            codeScanner={codeScanner}
          />
        ) : null}
        <View style={styles.qrFrame}>
          <View style={[styles.qrCorner, styles.qrTL]} />
          <View style={[styles.qrCorner, styles.qrTR]} />
          <View style={[styles.qrCorner, styles.qrBL]} />
          <View style={[styles.qrCorner, styles.qrBR]} />
        </View>
      </View>

      <View style={styles.status}>
        <PulseIndicator
          color={scanned ? Colors.clearance : Colors.warning}
          size={10}
          active={!scanned}
        />
        <VoltageText variant="label" color={scanned ? Colors.clearance : Colors.textSecondary}>
          {scanned
            ? scanResult
              ? `SCANNED: ${scanResult.substring(0, 20)}...`
              : 'VALIDATING...'
            : 'SCANNING FOR QR CODE...'}
        </VoltageText>
      </View>

      <View style={styles.instruction}>
        <VoltageText variant="bodySmall" color={Colors.textSecondary}>
          Scan a QR code containing: <VoltageText variant="bodySmall" color={Colors.heat}>
            {taskConfig.expectedContent}
          </VoltageText>
          {'\n'}Print this QR code and place it away from your bed (fridge, bathroom, etc.).
        </VoltageText>
      </View>

      {showSwitch ? (
        <View style={styles.switchPanel}>
          <VoltageText variant="label" color={Colors.textMuted} style={styles.switchLabel}>
            SWITCH MISSION
          </VoltageText>
          <View style={styles.switchRow}>
            {(['steps', 'voice', 'photo'] as const).map((t) => (
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
    height: 280,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFrame: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  qrCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.heat,
  },
  qrTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  qrTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  qrBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  qrBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  instruction: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    flex: 1,
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
  controls: {
    marginTop: 'auto',
  },
  switchToggle: {
    backgroundColor: Colors.surfaceMuted,
  },
});

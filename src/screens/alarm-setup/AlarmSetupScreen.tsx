import { VoltageButton } from '@/components/VoltageButton';
import { VoltageText } from '@/components/VoltageText';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';
import {
  DEFAULT_COLOR_TOLERANCE,
  DEFAULT_VOICE_THRESHOLD,
  TASK_TYPES,
  getRandomVoicePhrase,
} from '@/constants/missions';
import { Fonts } from '@/constants/typography';
import { useAlarms } from '@/hooks/useAlarms';
import { useKeyboard } from '@/hooks/useKeyboard';
import { RingtoneInfo, RingtoneModule } from '@/native/RingtoneModule';
import { useStore } from '@/store';
import { RepeatDays } from '@/types/alarm.types';
import { RootStackParamList } from '@/types/navigation.types';
import { TaskType } from '@/types/task.types';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PERMISSIONS, RESULTS, check, openSettings, request } from 'react-native-permissions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DaySelector } from './components/DaySelector';
import { TaskTypeCard } from './components/TaskTypeCard';
import { TimePicker } from './components/TimePicker';

const DEFAULT_REPEAT: RepeatDays = {
  monday: true, tuesday: true, wednesday: true,
  thursday: true, friday: true, saturday: true, sunday: true,
};

// Maps task types that require a runtime permission
const TASK_PERMISSION: Partial<Record<TaskType, { permission: any; label: string }>> = {
  steps: { permission: PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION, label: 'Physical Activity' },
  voice: { permission: PERMISSIONS.ANDROID.RECORD_AUDIO, label: 'Microphone' },
  photo: { permission: PERMISSIONS.ANDROID.CAMERA, label: 'Camera' },
  qr: { permission: PERMISSIONS.ANDROID.CAMERA, label: 'Camera' },
};

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AlarmSetup'>;

export default function AlarmSetupScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { alarmId } = route.params ?? {};
  const existing = useStore((s) => s.alarms.find((a) => a.id === alarmId));
  const { createAlarm, editAlarm } = useAlarms();

  const [hour, setHour] = useState(() => existing?.hour ?? new Date().getHours());
  const [minute, setMinute] = useState(() => existing?.minute ?? new Date().getMinutes());
  const [repeatDays, setRepeatDays] = useState<RepeatDays>(existing?.repeatDays ?? DEFAULT_REPEAT);
  const [taskType, setTaskType] = useState<TaskType>(existing?.taskType ?? 'steps');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const { isKeyboardShown, keyboardHeight } = useKeyboard();

  // Which task types currently have their required permission granted
  const [grantedTypes, setGrantedTypes] = useState<Set<TaskType>>(new Set());

  // Ringtone state
  const [ringtones, setRingtones] = useState<RingtoneInfo[]>([]);
  const [selectedRingtone, setSelectedRingtone] = useState<RingtoneInfo | null>(null);
  const [showRingtonePicker, setShowRingtonePicker] = useState(false);
  const [loadingRingtones, setLoadingRingtones] = useState(false);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [tempSelectedRingtone, setTempSelectedRingtone] = useState<RingtoneInfo | null>(null);
  const [isRingtoneModified, setIsRingtoneModified] = useState(false);

  // Check all permissions on mount
  useEffect(() => {
    async function checkAll() {
      const granted = new Set<TaskType>();
      for (const [type, cfg] of Object.entries(TASK_PERMISSION) as [TaskType, { permission: any }][]) {
        const result = await check(cfg.permission);
        if (result === RESULTS.GRANTED) granted.add(type);
      }
      // Types with no required permission are always granted
      granted.add('normal');
      setGrantedTypes(granted);
    }
    checkAll();
  }, []);

  useEffect(() => {
    setLoadingRingtones(true);
    RingtoneModule.getAlarmRingtones()
      .then((list) => {
        setRingtones(list);
        if (existing?.ringtoneUri) {
          const match = list.find((r) => r.uri === existing.ringtoneUri);
          if (match) setSelectedRingtone(match);
        }
      })
      .catch(() => { })
      .finally(() => setLoadingRingtones(false));
  }, []);

  const [permissionDialog, setPermissionDialog] = useState<{ label: string; permission: any; type: TaskType } | null>(null);

  // Called when user taps a task type card
  async function handleTaskTypePress(type: TaskType) {
    const cfg = TASK_PERMISSION[type];

    // No permission required (normal alarm) or already granted → select immediately
    if (!cfg || grantedTypes.has(type)) {
      setTaskType(type);
      return;
    }

    // Request permission
    const result = await request(cfg.permission);
    if (result === RESULTS.GRANTED) {
      setGrantedTypes((prev) => new Set([...prev, type]));
      setTaskType(type);
      return;
    }

    // Blocked or denied — show custom dialog
    setPermissionDialog({ label: cfg.label, permission: cfg.permission, type });
  }

  function buildTaskConfig() {
    switch (taskType) {
      case 'steps':
        return { type: 'steps' as const, targetSteps: useStore.getState().config.defaultStepTarget };
      case 'voice':
        return { type: 'voice' as const, phrase: getRandomVoicePhrase(), matchThreshold: DEFAULT_VOICE_THRESHOLD };
      case 'photo':
        return { type: 'photo' as const, targetColor: '#fe5e1e', colorToleranceDeltaE: DEFAULT_COLOR_TOLERANCE };
      case 'qr':
        return { type: 'qr' as const, expectedContent: useStore.getState().config.defaultQRContent, matchMode: 'contains' as const };
      case 'normal':
        return { type: 'normal' as const };
    }
  }

  async function handleSave() {
    const taskConfig = buildTaskConfig();
    const hasAnyDay = Object.values(repeatDays).some(Boolean);
    setIsSaving(true);
    try {
      const ringtoneUri = selectedRingtone?.uri ?? null;
      if (alarmId && existing) {
        await editAlarm(alarmId, { hour, minute, repeatDays, taskType, taskConfig, label, isOneShot: !hasAnyDay, ringtoneUri, status: 'active' });
      } else {
        await createAlarm({ hour, minute, repeatDays, taskType, taskConfig, label, isOneShot: !hasAnyDay, ringtoneUri });
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to set alarm:', error);
      Alert.alert('SETUP FAILED', 'Check system permissions or timing constraints.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleRingtoneSelect(ringtone: RingtoneInfo | null) {
    setTempSelectedRingtone(ringtone);
    setIsRingtoneModified(true);
    // Auto-play when clicked
    if (ringtone) {
      handleRingtonePreview(ringtone);
    } else {
      // For "System Default", stop preview
      RingtoneModule.stopPreview().catch(() => { });
      setPlayingUri(null);
    }
  }

  function handleConfirmRingtone() {
    RingtoneModule.stopPreview().catch(() => { });
    setSelectedRingtone(tempSelectedRingtone);
    setShowRingtonePicker(false);
    setIsRingtoneModified(false);
  }

  function handleCancelRingtone() {
    RingtoneModule.stopPreview().catch(() => { });
    setShowRingtonePicker(false);
    setIsRingtoneModified(false);
  }

  function handleRingtonePreview(ringtone: RingtoneInfo) {
    if (playingUri === ringtone.uri) {
      RingtoneModule.stopPreview().catch(() => { });
      setPlayingUri(null);
    } else {
      RingtoneModule.stopPreview().catch(() => { });
      RingtoneModule.playPreview(ringtone.uri);
      setPlayingUri(ringtone.uri);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          onPress={() => {
            RingtoneModule.stopPreview().catch(() => { });
            navigation.goBack();
          }}
        >
          <VoltageText variant="label" color={Colors.textMuted}>← BACK</VoltageText>
        </TouchableOpacity>
        <VoltageText variant="h4">
          {alarmId ? 'EDIT PROTOCOL' : 'NEW PROTOCOL'}
        </VoltageText>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          isKeyboardShown && { paddingBottom: keyboardHeight + Spacing.md }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <VoltageText variant="label" color={Colors.textSecondary} style={styles.sectionLabel}>
            TRIGGER TIME
          </VoltageText>
          <TimePicker
            hour={hour}
            minute={minute}
            onChange={(h, m) => { setHour(h); setMinute(m); }}
          />
        </View>

        <View style={styles.section}>
          <VoltageText variant="label" color={Colors.textSecondary} style={styles.sectionLabel}>
            REPEAT SCHEDULE
          </VoltageText>
          <DaySelector value={repeatDays} onChange={setRepeatDays} />
        </View>

        <View style={styles.section}>
          <VoltageText variant="label" color={Colors.textSecondary} style={styles.sectionLabel}>
            DEACTIVATION MISSION
          </VoltageText>
          <View style={styles.taskGrid}>
            {TASK_TYPES.map((t) => {
              const needsPerm = !!TASK_PERMISSION[t];
              const disabled = needsPerm && !grantedTypes.has(t);
              return (
                <TaskTypeCard
                  key={t}
                  type={t}
                  selected={taskType === t}
                  disabled={disabled}
                  onPress={() => handleTaskTypePress(t)}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <VoltageText variant="label" color={Colors.textSecondary} style={styles.sectionLabel}>
            RINGTONE
          </VoltageText>
          <TouchableOpacity
            style={styles.ringtoneRow}
            onPress={() => {
              setTempSelectedRingtone(selectedRingtone);
              setIsRingtoneModified(false);
              setShowRingtonePicker(true);
            }}
            activeOpacity={0.7}
          >
            <VoltageText variant="body" color={Colors.textPrimary} style={styles.ringtoneName}>
              {selectedRingtone?.title ?? 'System Default'}
            </VoltageText>
            {loadingRingtones
              ? <ActivityIndicator size="small" color={Colors.heat} />
              : <VoltageText variant="caption" color={Colors.heat}>CHANGE</VoltageText>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <VoltageText variant="label" color={Colors.textSecondary} style={styles.sectionLabel}>
            LABEL (OPTIONAL)
          </VoltageText>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. WORK SHIFT"
            placeholderTextColor={Colors.textMuted}
            maxLength={30}
          />
        </View>

        <View style={styles.warning}>
          <VoltageText variant="caption" color={Colors.textMuted}>
            FAILURE TO COMPLETE THE DEACTIVATION MISSION WILL ESCALATE ALARM VOLUME EVERY 30 SECONDS.
          </VoltageText>
        </View>

        <VoltageButton
          label="COMMIT PROTOCOL"
          fullWidth
          onPress={handleSave}
          loading={isSaving}
          style={styles.cta}
        />
      </ScrollView>

      <Modal
        visible={showRingtonePicker}
        animationType="slide"
        transparent
        onRequestClose={handleCancelRingtone}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <VoltageText variant="h4">SELECT RINGTONE</VoltageText>
            </View>

            <TouchableOpacity
              style={[styles.ringtoneItem, !tempSelectedRingtone && styles.ringtoneItemActive]}
              onPress={() => handleRingtoneSelect(null)}
            >
              <VoltageText variant="body" color={!tempSelectedRingtone ? Colors.heat : Colors.textPrimary} style={{ flex: 1 }}>
                System Default
              </VoltageText>
            </TouchableOpacity>

            <FlatList
              data={ringtones}
              keyExtractor={(item) => item.uri}
              renderItem={({ item }) => {
                const active = tempSelectedRingtone?.uri === item.uri;
                const playing = playingUri === item.uri;
                return (
                  <TouchableOpacity
                    style={[styles.ringtoneItem, active && styles.ringtoneItemActive]}
                    onPress={() => handleRingtoneSelect(item)}
                    activeOpacity={0.7}
                  >
                    <VoltageText variant="body" color={active ? Colors.heat : Colors.textPrimary} style={{ flex: 1 }}>
                      {item.title}
                    </VoltageText>
                    <View style={styles.playBtn}>
                      <VoltageText variant="label" color={playing ? Colors.heat : Colors.textMuted}>
                        {playing ? '■' : '▶'}
                      </VoltageText>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalBtn} onPress={handleCancelRingtone}>
                <VoltageText variant="label" color={Colors.textMuted}>CANCEL</VoltageText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, !isRingtoneModified && styles.btnDisabled]} 
                onPress={handleConfirmRingtone}
                disabled={!isRingtoneModified}
              >
                <VoltageText variant="label" color={isRingtoneModified ? Colors.heat : Colors.textMuted}>SELECT</VoltageText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={!!permissionDialog}
        animationType="fade"
        transparent
        onRequestClose={() => setPermissionDialog(null)}
      >
        <View style={styles.modalBackdropCenter}>
          <View style={styles.dialogSheet}>
            <View style={styles.dialogHeader}>
              <VoltageText variant="h4">PERMISSION REQUIRED</VoltageText>
            </View>
            <View style={styles.dialogBody}>
              <VoltageText variant="body" color={Colors.textSecondary}>
                {permissionDialog?.label} permission is needed for this mission. Enable it in device settings.
              </VoltageText>
            </View>
            <View style={styles.dialogFooter}>
              <TouchableOpacity
                style={styles.dialogBtn}
                onPress={() => setPermissionDialog(null)}
              >
                <VoltageText variant="label" color={Colors.textMuted}>CANCEL</VoltageText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogBtn}
                onPress={() => {
                  setPermissionDialog(null);
                  openSettings();
                }}
              >
                <VoltageText variant="label" color={Colors.heat}>OPEN SETTINGS</VoltageText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.vantablack,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0,
    backgroundColor: Colors.surface,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.md,
  },
  sectionLabel: {
    letterSpacing: 2,
  },
  taskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  ringtoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
  },
  ringtoneName: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    fontFamily: Fonts.interRegular,
    fontSize: 16,
    padding: Spacing.md,
    borderRadius: 0,
  },
  warning: {
    backgroundColor: Colors.surfaceMuted,
    padding: Spacing.md,
  },
  cta: {
    marginTop: Spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMuted,
  },
  ringtoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMuted,
  },
  ringtoneItemActive: {
    backgroundColor: Colors.surfaceMuted,
  },
  playBtn: {
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdropCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  dialogSheet: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
  },
  dialogHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMuted,
  },
  dialogBody: {
    padding: Spacing.lg,
  },
  dialogFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  dialogBtn: {
    padding: Spacing.sm,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceMuted,
    backgroundColor: Colors.surface,
  },
  modalBtn: {
    padding: Spacing.sm,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation.types';
import { RepeatDays } from '@/types/alarm.types';
import { TaskType } from '@/types/task.types';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/layout';
import { Fonts } from '@/constants/typography';
import {
  DEFAULT_STEP_TARGET,
  DEFAULT_VOICE_PHRASE,
  DEFAULT_VOICE_THRESHOLD,
  DEFAULT_COLOR_TOLERANCE,
  TASK_TYPES,
  getRandomVoicePhrase,
} from '@/constants/missions';
import { VoltageText } from '@/components/VoltageText';
import { VoltageButton } from '@/components/VoltageButton';
import { TimePicker } from './components/TimePicker';
import { DaySelector } from './components/DaySelector';
import { TaskTypeCard } from './components/TaskTypeCard';
import { useAlarms } from '@/hooks/useAlarms';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useStore } from '@/store';

const DEFAULT_REPEAT: RepeatDays = {
  monday: true, tuesday: true, wednesday: true,
  thursday: true, friday: true, saturday: false, sunday: false,
};

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AlarmSetup'>;

export default function AlarmSetupScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { alarmId } = route.params ?? {};
  const existing = useStore((s) => s.alarms.find((a) => a.id === alarmId));
  const { createAlarm, editAlarm } = useAlarms();

  const [hour, setHour] = useState(existing?.hour ?? 6);
  const [minute, setMinute] = useState(existing?.minute ?? 30);
  const [repeatDays, setRepeatDays] = useState<RepeatDays>(existing?.repeatDays ?? DEFAULT_REPEAT);
  const [taskType, setTaskType] = useState<TaskType>(existing?.taskType ?? 'steps');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const { isKeyboardShown, keyboardHeight } = useKeyboard();

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
      if (alarmId && existing) {
        await editAlarm(alarmId, { hour, minute, repeatDays, taskType, taskConfig, label, isOneShot: !hasAnyDay });
      } else {
        await createAlarm({ hour, minute, repeatDays, taskType, taskConfig, label, isOneShot: !hasAnyDay });
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to set alarm:', error);
      Alert.alert('SETUP FAILED', 'Check system permissions or timing constraints.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
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
        {/* Time Picker */}
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

        {/* Day Selector */}
        <View style={styles.section}>
          <VoltageText variant="label" color={Colors.textSecondary} style={styles.sectionLabel}>
            REPEAT SCHEDULE
          </VoltageText>
          <DaySelector value={repeatDays} onChange={setRepeatDays} />
        </View>

        {/* Task Type */}
        <View style={styles.section}>
          <VoltageText variant="label" color={Colors.textSecondary} style={styles.sectionLabel}>
            DEACTIVATION MISSION
          </VoltageText>
          <View style={styles.taskGrid}>
            {TASK_TYPES.map((t) => (
              <TaskTypeCard
                key={t}
                type={t}
                selected={taskType === t}
                onPress={() => setTaskType(t)}
              />
            ))}
          </View>
        </View>

        {/* Label */}
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

        {/* Warning */}
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
});

import { useCallback } from 'react';
import { useStore } from '@/store';
import { Alarm, RepeatDays } from '@/types/alarm.types';
import { TaskType, TaskConfig } from '@/types/task.types';
import { AlarmScheduler } from '@/services/alarm/AlarmScheduler';
import { generateId } from '@/utils/id';

interface CreateAlarmParams {
  hour: number;
  minute: number;
  repeatDays: RepeatDays;
  taskType: TaskType;
  taskConfig: TaskConfig;
  label: string;
  isOneShot: boolean;
  ringtoneUri?: string | null;
}

export function useAlarms() {
  const addAlarm = useStore((s) => s.addAlarm);
  const updateAlarmInStore = useStore((s) => s.updateAlarm);
  const deleteAlarmFromStore = useStore((s) => s.deleteAlarm);
  const toggleAlarmInStore = useStore((s) => s.toggleAlarm);
  const config = useStore((s) => s.config);

  const createAlarm = useCallback(async (params: CreateAlarmParams) => {
    const alarm: Alarm = {
      id: generateId(),
      label: params.label,
      hour: params.hour,
      minute: params.minute,
      repeatDays: params.repeatDays,
      isOneShot: params.isOneShot,
      taskType: params.taskType,
      taskConfig: params.taskConfig,
      status: 'active',
      createdAt: Date.now(),
      nextTriggerAt: null,
      volume: config.defaultVolume,
      vibrate: config.hapticsEnabled,
      snoozeCount: 0,
      maxSnoozeCount: config.maxSnoozes,
      snoozeIntervalMinutes: config.defaultSnoozeMinutes,
      ringtoneUri: params.ringtoneUri ?? null,
    };

    // Schedule native alarm
    const nextTriggerAt = await AlarmScheduler.schedule(alarm);
    alarm.nextTriggerAt = nextTriggerAt;

    addAlarm(alarm);
    return alarm;
  }, [addAlarm, config]);

  const editAlarm = useCallback(async (id: string, patch: Partial<Omit<Alarm, 'id'>>) => {
    updateAlarmInStore(id, patch);
    // Reschedule if active
    const alarms = useStore.getState().alarms;
    const alarm = alarms.find((a) => a.id === id);
    if (alarm && alarm.status === 'active') {
      const nextTriggerAt = await AlarmScheduler.schedule({ ...alarm, ...patch } as Alarm);
      updateAlarmInStore(id, { nextTriggerAt });
    }
  }, [updateAlarmInStore]);

  const deleteAlarm = useCallback(async (id: string) => {
    await AlarmScheduler.cancel(id);
    deleteAlarmFromStore(id);
  }, [deleteAlarmFromStore]);

  const toggleAlarm = useCallback(async (id: string) => {
    const alarms = useStore.getState().alarms;
    const alarm = alarms.find((a) => a.id === id);
    if (!alarm) return;

    toggleAlarmInStore(id);

    if (alarm.status === 'inactive') {
      // Activating — schedule
      const nextTriggerAt = await AlarmScheduler.schedule(alarm);
      updateAlarmInStore(id, { nextTriggerAt });
    } else {
      // Deactivating — cancel
      await AlarmScheduler.cancel(id);
      updateAlarmInStore(id, { nextTriggerAt: null });
    }
  }, [toggleAlarmInStore, updateAlarmInStore]);

  return { createAlarm, editAlarm, deleteAlarm, toggleAlarm };
}

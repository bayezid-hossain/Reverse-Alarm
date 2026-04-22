import { NativeModules, NativeEventEmitter } from 'react-native';

const { AlarmModule: _Native } = NativeModules;

export interface ScheduleAlarmParams {
  alarmId: string;
  triggerAtMs: number;
  label: string;
  volume: number;
  isNormal?: boolean;
  snoozeIntervalMinutes?: number;
  maxSnoozeCount?: number;
}

export interface TriggeredAlarm {
  alarmId: string;
}

export const AlarmModule = {
  scheduleAlarm(params: ScheduleAlarmParams): Promise<void> {
    return _Native.scheduleAlarm(params);
  },

  cancelAlarm(alarmId: string): Promise<void> {
    return _Native.cancelAlarm(alarmId);
  },

  cancelAllAlarms(): Promise<void> {
    return _Native.cancelAllAlarms();
  },

  getPendingAlarms(): Promise<Array<{ id: string; triggerAtMs: number }>> {
    return _Native.getPendingAlarms();
  },

  getTriggeredAlarm(): Promise<TriggeredAlarm | null> {
    return _Native.getTriggeredAlarm();
  },

  clearTriggeredAlarm(): Promise<void> {
    return _Native.clearTriggeredAlarm();
  },
};

// Emits: { alarmId: string } when alarm fires while app is running
export const AlarmEventEmitter = new NativeEventEmitter(_Native);

import { TaskConfig, TaskType } from './task.types';

export type AlarmStatus = 'active' | 'inactive' | 'ringing';

export interface RepeatDays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface Alarm {
  id: string;
  label: string;
  hour: number;       // 0–23
  minute: number;     // 0–59
  repeatDays: RepeatDays;
  isOneShot: boolean; // no days selected → fires once
  taskType: TaskType;
  taskConfig: TaskConfig;
  status: AlarmStatus;
  createdAt: number;          // unix ms
  nextTriggerAt: number | null;
  volume: number;             // 0–100
  vibrate: boolean;
  snoozeCount: number;
  maxSnoozeCount: number;
  snoozeIntervalMinutes: number;
}

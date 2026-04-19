import { TaskType } from './task.types';

export interface AppConfig {
  defaultSnoozeMinutes: number;
  maxSnoozes: number;
  defaultVolume: number;       // 0–100
  hapticsEnabled: boolean;
  defaultTaskType: TaskType;
  timePickerStyle: 'wheel' | 'grid';
  onboardingComplete: boolean;
}

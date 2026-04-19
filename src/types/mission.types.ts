import { TaskResult, TaskType } from './task.types';

export interface BioData {
  stepsTaken: number;
  heartRateBpm: number | null;
  movementIntensity: number; // 0–1
}

export interface MissionStats {
  timeToWakeMs: number;
  taskAttempts: number;
  voiceAccuracy: number | null; // 0–1
  stepsRecorded: number | null;
  bioData: BioData;
}

export interface MissionResult {
  id: string;
  alarmId: string;
  taskType: TaskType;
  taskResult: TaskResult;
  stats: MissionStats;
  completedAt: number;
}

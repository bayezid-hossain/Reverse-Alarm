import { generateId } from './id';
import { MissionResult, MissionStats } from '@/types/mission.types';
import { TaskType } from '@/types/task.types';

interface BuildMissionResultParams {
  timeToWakeMs: number;
  taskAttempts: number;
  voiceAccuracy: number | null;
  stepsRecorded: number | null;
}

export function buildMissionResult(
  alarmId: string,
  taskType: TaskType,
  params: BuildMissionResultParams,
): MissionResult {
  const stats: MissionStats = {
    timeToWakeMs: params.timeToWakeMs,
    taskAttempts: params.taskAttempts,
    voiceAccuracy: params.voiceAccuracy,
    stepsRecorded: params.stepsRecorded,
    bioData: {
      stepsTaken: params.stepsRecorded ?? 0,
      heartRateBpm: null,
      movementIntensity: params.stepsRecorded ? Math.min(params.stepsRecorded / 50, 1) : 0,
    },
  };

  return {
    id: generateId(),
    alarmId,
    taskType,
    taskResult: {
      taskId: generateId(),
      type: taskType,
      success: true,
      completedAt: Date.now(),
      attempts: params.taskAttempts,
      metadata: {},
    },
    stats,
    completedAt: Date.now(),
  };
}

import { StateCreator } from 'zustand';
import { Task } from '@/types/task.types';
import { MissionStats } from '@/types/mission.types';
import { Alarm } from '@/types/alarm.types';

export interface MissionSlice {
  isAlarmRinging: boolean;
  currentAlarmId: string | null;
  currentTask: Task | null;
  missionStartedAt: number | null;
  taskAttempts: number;
  missionStats: MissionStats | null;

  startRinging: (alarmId: string) => void;
  stopRinging: () => void;
  setCurrentTask: (task: Task | null) => void;
  incrementAttempts: () => void;
  recordMissionStats: (stats: MissionStats) => void;
  resetMission: () => void;
}

export const createMissionSlice: StateCreator<MissionSlice> = (set) => ({
  isAlarmRinging: false,
  currentAlarmId: null,
  currentTask: null,
  missionStartedAt: null,
  taskAttempts: 0,
  missionStats: null,

  startRinging: (alarmId) =>
    set({
      isAlarmRinging: true,
      currentAlarmId: alarmId,
      missionStartedAt: Date.now(),
      taskAttempts: 0,
      missionStats: null,
    }),

  stopRinging: () =>
    set({
      isAlarmRinging: false,
      currentAlarmId: null,
      currentTask: null,
      missionStartedAt: null,
    }),

  setCurrentTask: (task) => set({ currentTask: task }),

  incrementAttempts: () =>
    set((s) => ({ taskAttempts: s.taskAttempts + 1 })),

  recordMissionStats: (stats) => set({ missionStats: stats }),

  resetMission: () =>
    set({
      isAlarmRinging: false,
      currentAlarmId: null,
      currentTask: null,
      missionStartedAt: null,
      taskAttempts: 0,
      missionStats: null,
    }),
});

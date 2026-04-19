import { create } from 'zustand';
import { createAlarmSlice, AlarmSlice } from './alarmSlice';
import { createMissionSlice, MissionSlice } from './missionSlice';
import { createConfigSlice, ConfigSlice } from './configSlice';

export type AppStore = AlarmSlice & MissionSlice & ConfigSlice;

export const useStore = create<AppStore>()((...args) => ({
  ...createAlarmSlice(...args),
  ...createMissionSlice(...args),
  ...createConfigSlice(...args),
}));

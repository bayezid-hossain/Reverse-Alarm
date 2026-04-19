import { StateCreator } from 'zustand';
import { Alarm } from '@/types/alarm.types';
import { AlarmPersistence } from '@/services/alarm/AlarmPersistence';

export interface AlarmSlice {
  alarms: Alarm[];
  currentAlarm: Alarm | null;

  addAlarm: (alarm: Alarm) => void;
  updateAlarm: (id: string, patch: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  setCurrentAlarm: (alarm: Alarm | null) => void;
  loadAlarms: () => void;
}

export const createAlarmSlice: StateCreator<AlarmSlice> = (set, get) => ({
  alarms: [],
  currentAlarm: null,

  addAlarm: (alarm) => {
    set((s) => ({ alarms: [...s.alarms, alarm] }));
    AlarmPersistence.save(get().alarms);
  },

  updateAlarm: (id, patch) => {
    set((s) => ({
      alarms: s.alarms.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
    AlarmPersistence.save(get().alarms);
  },

  deleteAlarm: (id) => {
    set((s) => ({ alarms: s.alarms.filter((a) => a.id !== id) }));
    AlarmPersistence.save(get().alarms);
  },

  toggleAlarm: (id) => {
    const alarm = get().alarms.find((a) => a.id === id);
    if (!alarm) return;
    get().updateAlarm(id, {
      status: alarm.status === 'active' ? 'inactive' : 'active',
    });
  },

  setCurrentAlarm: (alarm) => set({ currentAlarm: alarm }),

  loadAlarms: () => {
    const alarms = AlarmPersistence.load();
    set({ alarms });
  },
});

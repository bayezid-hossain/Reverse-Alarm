import { StateCreator } from 'zustand';
import { AppConfig } from '@/types/store.types';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'app-config' });
const CONFIG_KEY = 'config';

const DEFAULT_CONFIG: AppConfig = {
  defaultSnoozeMinutes: 5,
  maxSnoozes: 3,
  defaultVolume: 100,
  hapticsEnabled: true,
  defaultTaskType: 'steps',
  timePickerStyle: 'wheel',
  onboardingComplete: false,
};

export interface ConfigSlice {
  config: AppConfig;
  updateConfig: (patch: Partial<AppConfig>) => void;
  loadConfig: () => void;
}

export const createConfigSlice: StateCreator<ConfigSlice> = (set, get) => ({
  config: DEFAULT_CONFIG,

  updateConfig: (patch) => {
    const updated = { ...get().config, ...patch };
    set({ config: updated });
    storage.set(CONFIG_KEY, JSON.stringify(updated));
  },

  loadConfig: () => {
    const raw = storage.getString(CONFIG_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw) as Partial<AppConfig>;
        set({ config: { ...DEFAULT_CONFIG, ...saved } });
      } catch {
        // use defaults
      }
    }
  },
});

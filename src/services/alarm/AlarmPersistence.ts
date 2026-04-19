import { MMKV } from 'react-native-mmkv';
import { Alarm } from '@/types/alarm.types';

const storage = new MMKV({ id: 'alarms' });
const ALARMS_KEY = 'alarms';
const PENDING_KEY = 'pending_alarms';

export interface PendingAlarm {
  id: string;
  triggerAtMs: number;
}

export const AlarmPersistence = {
  save(alarms: Alarm[]): void {
    storage.set(ALARMS_KEY, JSON.stringify(alarms));
    // Mirror active alarms to SharedPreferences key for BootReceiver
    const pending: PendingAlarm[] = alarms
      .filter((a) => a.status === 'active' && a.nextTriggerAt !== null)
      .map((a) => ({ id: a.id, triggerAtMs: a.nextTriggerAt! }));
    storage.set(PENDING_KEY, JSON.stringify(pending));
  },

  load(): Alarm[] {
    const raw = storage.getString(ALARMS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Alarm[];
    } catch {
      return [];
    }
  },

  loadPending(): PendingAlarm[] {
    const raw = storage.getString(PENDING_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as PendingAlarm[];
    } catch {
      return [];
    }
  },
};

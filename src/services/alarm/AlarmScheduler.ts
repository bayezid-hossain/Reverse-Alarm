import { AlarmModule } from '@/native/AlarmModule';
import { Alarm, RepeatDays } from '@/types/alarm.types';

const DAY_ORDER: (keyof RepeatDays)[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

/**
 * Compute next trigger timestamp (unix ms) for the given alarm from now.
 */
export function computeNextTriggerAt(alarm: Alarm): number | null {
  const now = new Date();
  // Clear milliseconds for stable comparison
  now.setMilliseconds(0);
  const todayIndex = now.getDay(); // 0 = Sunday

  if (alarm.isOneShot) {
    // Fire today if time is in the future, else tomorrow
    const candidate = new Date(now);
    candidate.setHours(alarm.hour, alarm.minute, 0, 0);
    if (candidate.getTime() > now.getTime()) return candidate.getTime();
    candidate.setDate(candidate.getDate() + 1);
    return candidate.getTime();
  }

  // Find next active repeat day
  const hasAnyDay = Object.values(alarm.repeatDays).some(Boolean);
  if (!hasAnyDay) return null;

  for (let offset = 0; offset < 8; offset++) {
    const dayIndex = (todayIndex + offset) % 7;
    const dayKey = DAY_ORDER[dayIndex];
    if (!alarm.repeatDays[dayKey]) continue;

    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    candidate.setHours(alarm.hour, alarm.minute, 0, 0);

    if (offset === 0 && candidate.getTime() <= now.getTime()) {
      console.log(`[AlarmScheduler] ${dayKey} at ${alarm.hour}:${alarm.minute} has passed today (${candidate.getTime()} <= ${now.getTime()}), moving to next.`);
      continue;
    }
    return candidate.getTime();
  }
  return null;
}

export const AlarmScheduler = {
  async schedule(alarm: Alarm): Promise<number | null> {
    const triggerAtMs = computeNextTriggerAt(alarm);
    console.log(`[AlarmScheduler] Scheduling ${alarm.id} for ${new Date(triggerAtMs || 0).toLocaleString()} (${triggerAtMs})`);
    if (triggerAtMs === null) return null;

    await AlarmModule.scheduleAlarm({
      alarmId: alarm.id,
      triggerAtMs,
      label: alarm.label || 'ALARM',
      volume: alarm.volume,
      isNormal: alarm.taskType === 'normal',
      snoozeIntervalMinutes: alarm.snoozeIntervalMinutes ?? 5,
      maxSnoozeCount: alarm.maxSnoozeCount ?? 3,
    });

    return triggerAtMs;
  },

  async cancel(alarmId: string): Promise<void> {
    await AlarmModule.cancelAlarm(alarmId);
  },

  async cancelAll(): Promise<void> {
    await AlarmModule.cancelAllAlarms();
  },
};

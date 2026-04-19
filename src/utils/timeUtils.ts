import { RepeatDays } from '@/types/alarm.types';

export function formatAlarmTime(hour: number, minute: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = String(minute).padStart(2, '0');
  const period = hour < 12 ? 'AM' : 'PM';
  return `${String(h).padStart(2, '0')}:${m}`;
}

export function formatRepeatDays(days: RepeatDays): string {
  const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const keys: (keyof RepeatDays)[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  ];
  const active = keys
    .map((k, i) => (days[k] ? labels[i] : null))
    .filter(Boolean);
  if (active.length === 7) return 'EVERY DAY';
  if (active.length === 0) return 'ONCE';
  if (active.length === 5 && !days.saturday && !days.sunday) return 'WEEKDAYS';
  if (active.length === 2 && days.saturday && days.sunday) return 'WEEKENDS';
  return active.join(' · ');
}

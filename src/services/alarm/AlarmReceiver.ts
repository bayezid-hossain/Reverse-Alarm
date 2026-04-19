import { AlarmEventEmitter, AlarmModule } from '@/native/AlarmModule';
import { useStore } from '@/store';
import { navigateToMission } from '@/navigation/navigationRef';
import { ForegroundServiceModule } from '@/native/ForegroundServiceModule';
import { WakeLockModule } from '@/native/WakeLockModule';
import { VolumeModule } from '@/native/VolumeModule';

async function handleAlarmTrigger(alarmId: string): Promise<void> {
  const store = useStore.getState();
  const alarm = store.alarms.find((a) => a.id === alarmId);

  if (!alarm || alarm.status !== 'active') return;

  try {
    await WakeLockModule.acquire('reverse-alarm-wake');
    await VolumeModule.setMaxVolume();
    await ForegroundServiceModule.startService(alarmId, alarm.label || 'ALARM');

    store.updateAlarm(alarmId, { status: 'ringing' });
    store.setCurrentAlarm(alarm);

    navigateToMission(alarmId);
  } catch (e) {
    console.error('[AlarmReceiver] Failed to handle alarm trigger:', e);
  }
}

/**
 * Subscribe to native alarm trigger events (app was running when alarm fired).
 * Call once in App.tsx on mount.
 */
export function subscribeToAlarmEvents(): () => void {
  const subscription = AlarmEventEmitter.addListener(
    'AlarmTriggered',
    ({ alarmId }: { alarmId: string }) => {
      handleAlarmTrigger(alarmId);
    }
  );
  return () => subscription.remove();
}

/**
 * Check if app was launched because an alarm fired (app was killed).
 * Call once in App.tsx after alarms are loaded from storage.
 */
export async function checkPendingAlarmTrigger(): Promise<void> {
  try {
    const result = await AlarmModule.getTriggeredAlarm();
    if (!result?.alarmId) return;
    await AlarmModule.clearTriggeredAlarm();
    await handleAlarmTrigger(result.alarmId);
  } catch (e) {
    console.error('[AlarmReceiver] checkPendingAlarmTrigger failed:', e);
  }
}

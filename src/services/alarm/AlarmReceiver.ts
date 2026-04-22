import { AlarmEventEmitter, AlarmModule } from '@/native/AlarmModule';
import { useStore } from '@/store';
import { navigateToMission } from '@/navigation/navigationRef';
import { ForegroundServiceModule } from '@/native/ForegroundServiceModule';
import { WakeLockModule } from '@/native/WakeLockModule';
import { VolumeModule } from '@/native/VolumeModule';
import { AlarmScheduler } from '@/services/alarm/AlarmScheduler';

async function handleAlarmTrigger(alarmId: string): Promise<void> {
  const store = useStore.getState();
  const alarm = store.alarms.find((a) => a.id === alarmId);

  if (!alarm) return;
  // Accept 'active' (fresh trigger) or 'ringing' (app resumed while alarm already running)
  if (alarm.status !== 'active' && alarm.status !== 'ringing') return;

  try {
    if (alarm.status === 'active') {
      await WakeLockModule.acquire('reverse-alarm-wake');
      await VolumeModule.setMaxVolume();
      await ForegroundServiceModule.startService(alarmId, alarm.label || 'ALARM');
      store.updateAlarm(alarmId, { status: 'ringing' });
    }
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
  const triggerSub = AlarmEventEmitter.addListener(
    'AlarmTriggered',
    ({ alarmId }: { alarmId: string }) => {
      handleAlarmTrigger(alarmId);
    }
  );

  // Notification tapped while app is alive — navigate directly to mission.
  // Also fires when app was in background and brought to foreground via onNewIntent.
  const tapSub = AlarmEventEmitter.addListener(
    'AlarmNotificationTapped',
    ({ alarmId }: { alarmId: string }) => {
      navigateToMission(alarmId);
    }
  );

  const snoozeSub = AlarmEventEmitter.addListener(
    'AlarmSnoozedFromNotification',
    ({ alarmId, snoozeCount, nextTriggerAt }: { alarmId: string; snoozeCount: number; nextTriggerAt: number }) => {
      useStore.getState().updateAlarm(alarmId, { snoozeCount, nextTriggerAt, status: 'active' });
    }
  );

  const dismissSub = AlarmEventEmitter.addListener(
    'AlarmDismissedFromNotification',
    ({ alarmId }: { alarmId: string }) => {
      const store = useStore.getState();
      const alarm = store.alarms.find((a) => a.id === alarmId);
      if (!alarm) return;
      if (alarm.isOneShot) {
        store.updateAlarm(alarmId, { status: 'inactive', snoozeCount: 0 });
      } else {
        AlarmScheduler.schedule(alarm)
          .then((nextTriggerAt) => {
            store.updateAlarm(alarmId, { status: 'active', snoozeCount: 0, ...(nextTriggerAt ? { nextTriggerAt } : {}) });
          })
          .catch(() => {
            store.updateAlarm(alarmId, { status: 'active', snoozeCount: 0 });
          });
      }
    }
  );

  return () => {
    triggerSub.remove();
    tapSub.remove();
    snoozeSub.remove();
    dismissSub.remove();
  };
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

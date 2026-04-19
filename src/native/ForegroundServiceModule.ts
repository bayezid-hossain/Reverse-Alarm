import { NativeModules } from 'react-native';

const { ForegroundServiceModule: _Native } = NativeModules;

export const ForegroundServiceModule = {
  startService(alarmId: string, label: string): Promise<void> {
    return _Native.startService({ alarmId, label });
  },

  stopService(): Promise<void> {
    return _Native.stopService();
  },

  isRunning(): Promise<boolean> {
    return _Native.isRunning();
  },
};

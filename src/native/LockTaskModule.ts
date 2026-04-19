import { NativeModules } from 'react-native';

const { LockTaskModule: _Native } = NativeModules;

export const LockTaskModule = {
  lockScreen(): Promise<void> {
    return _Native.lockScreen();
  },

  unlockScreen(): Promise<void> {
    return _Native.unlockScreen();
  },
};

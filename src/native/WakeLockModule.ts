import { NativeModules } from 'react-native';

const { WakeLockModule: _Native } = NativeModules;

export const WakeLockModule = {
  acquire(tag: string): Promise<void> {
    return _Native.acquire(tag);
  },

  release(): Promise<void> {
    return _Native.release();
  },
};

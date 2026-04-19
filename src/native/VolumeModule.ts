import { NativeModules } from 'react-native';

const { VolumeModule: _Native } = NativeModules;

export const VolumeModule = {
  setMaxVolume(): Promise<void> {
    return _Native.setMaxVolume();
  },

  restoreVolume(): Promise<void> {
    return _Native.restoreVolume();
  },

  setVolume(level: number): Promise<void> {
    return _Native.setVolume(level);
  },
};

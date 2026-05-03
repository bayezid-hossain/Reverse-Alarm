import { NativeModules } from 'react-native';

const { RingtoneModule: _Native } = NativeModules;

export interface RingtoneInfo {
  uri: string;
  title: string;
}

export const RingtoneModule = {
  getAlarmRingtones(): Promise<RingtoneInfo[]> {
    return _Native.getAlarmRingtones();
  },
  playPreview(uri: string): void {
    _Native.playPreview(uri);
  },
  stopPreview(): Promise<void> {
    return _Native.stopPreview();
  },
};

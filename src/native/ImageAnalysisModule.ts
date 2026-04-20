import { NativeModules } from 'react-native';

const _Native = NativeModules.ImageAnalysisModule;

export const ImageAnalysisModule = {
  getAverageBrightness: (filePath: string): Promise<number> =>
    _Native.getAverageBrightness(filePath),
};

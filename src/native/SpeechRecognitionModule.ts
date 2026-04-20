import { NativeModules, NativeEventEmitter } from 'react-native';

const { SpeechRecognitionModule: _Native } = NativeModules;

export const SpeechRecognitionModule = {
  startListening(locale: string): Promise<void> {
    return _Native.startListening(locale);
  },
  stopListening(): Promise<void> {
    return _Native.stopListening();
  },
  cancel(): Promise<void> {
    return _Native.cancel();
  },
  destroy(): Promise<void> {
    return _Native.destroy();
  },
};

export const SpeechEventEmitter = new NativeEventEmitter(_Native);

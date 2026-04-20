import { NativeModules, NativeEventEmitter } from 'react-native';

const _Native = NativeModules.StepCounterModule;

export const StepCounterModule = {
  startCounting: (): Promise<void> => _Native.startCounting(),
  stopCounting: (): Promise<void> => _Native.stopCounting(),
  resetCount: (): Promise<void> => _Native.resetCount(),
};

export const StepEventEmitter = _Native ? new NativeEventEmitter(_Native) : null;

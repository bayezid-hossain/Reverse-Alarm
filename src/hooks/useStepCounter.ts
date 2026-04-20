import { useState, useCallback, useRef } from 'react';
import { StepCounterModule, StepEventEmitter } from '@/native/StepCounterModule';
import { AccelerometerService } from '@/services/sensors/AccelerometerService';

export function useStepCounter() {
  const [stepCount, setStepCount] = useState(0);
  const subRef = useRef<{ remove: () => void } | null>(null);
  const usingNative = useRef(false);

  const startCounting = useCallback(async () => {
    setStepCount(0);

    if (StepEventEmitter) {
      try {
        await StepCounterModule.startCounting();
        usingNative.current = true;
        subRef.current = StepEventEmitter.addListener('StepDetected', (e: { count: number }) => {
          setStepCount(e.count);
        });
        return;
      } catch (_) {
        // fall through to accelerometer fallback
      }
    }

    // Fallback: accelerometer-based detection
    usingNative.current = false;
    AccelerometerService.reset();
    AccelerometerService.start();
    const unsub = AccelerometerService.onStep(setStepCount);
    subRef.current = { remove: unsub };
  }, []);

  const stopCounting = useCallback(() => {
    subRef.current?.remove();
    subRef.current = null;
    if (usingNative.current) {
      StepCounterModule.stopCounting().catch(() => {});
    } else {
      AccelerometerService.stop();
    }
  }, []);

  return { stepCount, startCounting, stopCounting };
}

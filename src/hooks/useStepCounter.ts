import { useState, useCallback } from 'react';
import { AccelerometerService } from '@/services/sensors/AccelerometerService';

export function useStepCounter() {
  const [stepCount, setStepCount] = useState(0);

  const startCounting = useCallback(() => {
    AccelerometerService.reset();
    AccelerometerService.start();
    const unsubscribe = AccelerometerService.onStep(setStepCount);
    return unsubscribe;
  }, []);

  const stopCounting = useCallback(() => {
    AccelerometerService.stop();
  }, []);

  return { stepCount, startCounting, stopCounting };
}

import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { Subscription } from 'rxjs';

const STEP_THRESHOLD = 1.2; // G-force threshold
const STEP_COOLDOWN_MS = 300;

type StepCallback = (count: number) => void;

class AccelerometerServiceClass {
  private subscription: Subscription | null = null;
  private stepCount = 0;
  private lastStepTime = 0;
  private callbacks: Set<StepCallback> = new Set();

  start(): void {
    if (this.subscription) return;
    setUpdateIntervalForType(SensorTypes.accelerometer, 50); // 20Hz

    this.subscription = accelerometer.subscribe(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const g = magnitude / 9.81;
      const now = Date.now();

      if (g > STEP_THRESHOLD && now - this.lastStepTime > STEP_COOLDOWN_MS) {
        this.lastStepTime = now;
        this.stepCount++;
        this.callbacks.forEach((cb) => cb(this.stepCount));
      }
    });
  }

  stop(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  reset(): void {
    this.stepCount = 0;
  }

  getCount(): number {
    return this.stepCount;
  }

  onStep(cb: StepCallback): () => void {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }
}

export const AccelerometerService = new AccelerometerServiceClass();

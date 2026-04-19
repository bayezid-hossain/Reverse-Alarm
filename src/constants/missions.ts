import { TaskType } from '@/types/task.types';

export const TASK_TYPES: TaskType[] = ['steps', 'voice', 'photo', 'qr'];

export const TASK_DISPLAY = {
  steps: {
    label: 'KINETIC LOCK',
    sublabel: 'Walk steps to deactivate',
    icon: 'directions_walk',
  },
  voice: {
    label: 'VOICE AUTH',
    sublabel: 'Recite the daily manifesto',
    icon: 'mic',
  },
  photo: {
    label: 'VISUAL SYNC',
    sublabel: 'Scan a physical object',
    icon: 'camera_alt',
  },
  qr: {
    label: 'SECURE SCAN',
    sublabel: 'Scan your QR terminal',
    icon: 'qr_code_scanner',
  },
} as const;

export const DEFAULT_STEP_TARGET = 50;
export const DEFAULT_VOICE_PHRASE =
  'I am awake. I am present. I will conquer this day with clarity and purpose.';
export const DEFAULT_VOICE_THRESHOLD = 0.75;
export const DEFAULT_COLOR_TOLERANCE = 25;
export const DEFAULT_MAX_SNOOZE = 3;
export const DEFAULT_SNOOZE_INTERVAL = 5;

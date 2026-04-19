export type TaskType = 'steps' | 'voice' | 'photo' | 'qr';

// --- Config discriminated union ---
export interface StepTaskConfig {
  type: 'steps';
  targetSteps: number;
}

export interface VoiceTaskConfig {
  type: 'voice';
  phrase: string;
  matchThreshold: number; // 0–1
}

export interface PhotoTaskConfig {
  type: 'photo';
  targetColor: string;            // hex e.g. '#ff9069'
  colorToleranceDeltaE: number;   // CIEDE2000 delta-E tolerance
  targetObjectLabel?: string;     // optional hint
}

export interface QRTaskConfig {
  type: 'qr';
  expectedContent: string;
  matchMode: 'exact' | 'prefix' | 'contains';
}

export type TaskConfig =
  | StepTaskConfig
  | VoiceTaskConfig
  | PhotoTaskConfig
  | QRTaskConfig;

// --- Runtime task interface ---
export type TaskStatus = 'idle' | 'running' | 'success' | 'failed';

export interface Task {
  id: string;
  type: TaskType;
  config: TaskConfig;
  status: TaskStatus;
  start(): void;
  validate(): Promise<boolean>;
  fail(): void;
  cleanup(): void;
}

export interface TaskResult {
  taskId: string;
  type: TaskType;
  success: boolean;
  completedAt: number;
  attempts: number;
  metadata: Record<string, unknown>;
}

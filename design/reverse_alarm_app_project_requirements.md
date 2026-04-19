📌 Project Overview
Reverse Alarm is a task-based alarm app that forces users to complete real-world challenges to stop alarms. Designed for Android using React Native.
🧱 Tech Stack

React Native CLI (NOT Expo for background reliability)
TypeScript
Zustand (state management)
Native Modules (Android)
Firebase (optional)
📂 Project Structure
/src
  /components
  /screens
  /services
  /tasks
  /utils
  /hooks
  /store

🔑 Core Modules
1. Alarm Engine

Use Android AlarmManager
Trigger Foreground Service
Wake Lock required
AlarmManager.setExactAndAllowWhileIdle()

2. Foreground Service

Keeps alarm running even if app is killed
Required for Android 10+
3. Task Engine
/tasks
  photoTask.ts
  voiceTask.ts
  stepTask.ts
  qrTask.ts

Each task must implement:
interface Task {
  id: string;
  start(): void;
  validate(): Promise<boolean>;
  fail(): void;
}

4. Permissions
AndroidManifest:
CAMERA
RECORD_AUDIO
ACTIVITY_RECOGNITION
FOREGROUND_SERVICE
WAKE_LOCK

5. Navigation

HomeScreen
AlarmSetupScreen
ActiveAlarmScreen (FULLSCREEN LOCK)
6. State (Zustand)
{
  alarms: Alarm[],
  currentTask: Task | null,
  isAlarmRinging: boolean
}

📸 Task Implementations
Photo Task

Capture image
Extract dominant color
Compare with target
Step Task

Use accelerometer
Count steps manually
Voice Task

Use speech-to-text
Match phrase
QR Task

Scan QR code
Validate content
🔊 Alarm Sound

Loop audio using native player
Volume max enforced
🛡 Anti-Cheat

Disable back button
Prevent app minimize
Restart alarm if killed
🧪 Testing Plan

Test on:

App killed
Screen locked
Low battery mode
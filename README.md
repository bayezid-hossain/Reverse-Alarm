# Reverse Alarm

Task-based alarm app for Android. To dismiss an alarm, the user must complete a real-world mission — steps, voice recitation, photo color match, or QR scan.

Built with Expo (bare workflow via prebuild), React Native 0.81, TypeScript, Zustand, React Navigation v6, and Kotlin native modules (AlarmManager + ForegroundService + WakeLock).

## Prerequisites

- Node 20+
- JDK 17
- Android SDK (compile/target 35, min 26)
- A real device or emulator (alarm reliability is poor on emulators)

## First-time setup

```bash
npm install

# Drop required assets (see assets/README.md):
#   assets/icon.png, splash.png, adaptive-icon.png
#   assets/fonts/*.ttf

npx expo prebuild --platform android --clean
```

`prebuild` runs `plugins/withReverseAlarmModule.js`, which:
1. Copies `android-src-staging/**` → `android/app/src/main/java/com/reversealarm/app/`
2. Copies `android-res/**` → `android/app/src/main/res/`
3. Patches `AndroidManifest.xml` (services, receivers, MainActivity flags)
4. Patches `app/build.gradle` (kotlin-kapt, WorkManager, Coroutines)
5. Ensures all 5 native packages are registered in `MainApplication.kt`
6. Appends ProGuard `-keep` rules

## Run

```bash
# Debug on connected device
npx expo run:android

# Or manual build
cd android && ./gradlew assembleDebug
```

## Architecture

See `C:\Users\amiba\.claude\plans\sprightly-discovering-bird.md` for the approved architecture plan.

High-level layout:

```
android-src-staging/     Kotlin native modules (AlarmModule, ForegroundService, BootReceiver, ...)
plugins/                 Expo config plugin (withReverseAlarmModule.js)
src/
  App.tsx                NavigationContainer + alarm event subscription
  constants/             Voltage Shift design tokens (colors, typography, layout)
  types/                 Alarm, Task (discriminated union), Mission, Navigation
  store/                 Zustand — alarmSlice + missionSlice + configSlice
  navigation/            RootNavigator + AppNavigator (tabs) + MissionNavigator (fullscreen)
  screens/               home, alarm-setup, active-alarm, missions/*, mission-success, config
  components/            VoltageText, VoltageButton, VoltageCard, SegmentedProgressBar, PulseIndicator
  services/              alarm/, mission/, sensors/ — orchestration + persistence
  hooks/                 useAlarms, useStepCounter, useVoiceRecognition, usePermissions
  native/                TypeScript bridges for Kotlin modules
  utils/                 time, color (chroma-js deltaE), mission result aggregation
```

## Alarm lifecycle

```
User commits alarm
  → AlarmScheduler.schedule() → AlarmModule.scheduleAlarm() [Kotlin]
  → AlarmManager.setExactAndAllowWhileIdle()
  → MMKV persist + SharedPreferences mirror (for BootReceiver)

Time arrives (or boot completes)
  → AlarmBroadcastReceiver / BootReceiver [Kotlin]
  → AlarmForegroundService.startForeground() (MediaPlayer + WakeLock)
  → MainActivity launched with alarmId + showWhenLocked
  → DeviceEventManager emits 'AlarmTriggered'
  → AlarmReceiver.ts → navigationRef.navigate('MissionNavigator', ...)
  → ActiveAlarmScreen → mission screen → MissionSuccessScreen

Mission success
  → ForegroundServiceModule.stopService()
  → WakeLockModule.release()
  → VolumeModule.restoreVolume()
  → MainActivity.isAlarmLocked = false
```

## Verification checklist

1. `expo prebuild` — plugin runs without errors, manifest has all receivers/services
2. `./gradlew assembleDebug` — APK builds
3. Set alarm 1 minute out, kill app → alarm still fires, mission launches
4. Complete each of the 4 task types end-to-end
5. During alarm: back button disabled, cannot minimize, killing app restarts service
6. Set alarm, reboot device → alarm still fires at the right time
7. Compare each screen against HTML prototypes in `design/`

## Notes

- Package name is `com.reversealarm.app`. Renaming requires updating `app.json`, `plugins/withReverseAlarmModule.js` (`PACKAGE_NAME`), and all Kotlin `package` declarations.
- MMKV is the source of truth for alarms; `SharedPreferences` (`ReverseAlarmPrefs` / `pending_alarms`) is a read-only mirror consumed by `BootReceiver` without loading JS.
- `showWhenLocked` + `turnScreenOn` are set both in `AndroidManifest.xml` (by the plugin) and at runtime in `MainActivity.onCreate` when launched with an `alarmId` extra.

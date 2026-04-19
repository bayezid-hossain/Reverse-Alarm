export const Routes = {
  // Root stack
  APP_NAVIGATOR: 'AppNavigator' as const,
  ALARM_SETUP: 'AlarmSetup' as const,
  MISSION_NAVIGATOR: 'MissionNavigator' as const,

  // Tabs
  HOME: 'Home' as const,
  CONFIG: 'Config' as const,

  // Mission stack
  ACTIVE_ALARM: 'ActiveAlarm' as const,
  STEP_MISSION: 'StepMission' as const,
  VOICE_MISSION: 'VoiceMission' as const,
  VISUAL_SYNC_MISSION: 'VisualSyncMission' as const,
  QR_SCAN_MISSION: 'QRScanMission' as const,
  MISSION_SUCCESS: 'MissionSuccess' as const,
};

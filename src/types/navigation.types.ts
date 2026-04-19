import { NavigatorScreenParams } from '@react-navigation/native';
import {
  PhotoTaskConfig,
  QRTaskConfig,
  StepTaskConfig,
  VoiceTaskConfig,
} from './task.types';
import { MissionResult } from './mission.types';

export type TabParamList = {
  Home: undefined;
  Config: undefined;
};

export type MissionStackParamList = {
  ActiveAlarm: { alarmId: string };
  StepMission: { taskConfig: StepTaskConfig; alarmId: string };
  VoiceMission: { taskConfig: VoiceTaskConfig; alarmId: string };
  VisualSyncMission: { taskConfig: PhotoTaskConfig; alarmId: string };
  QRScanMission: { taskConfig: QRTaskConfig; alarmId: string };
  MissionSuccess: { result: MissionResult };
};

export type RootStackParamList = {
  AppNavigator: NavigatorScreenParams<TabParamList>;
  AlarmSetup: { alarmId?: string };
  MissionNavigator: NavigatorScreenParams<MissionStackParamList>;
};

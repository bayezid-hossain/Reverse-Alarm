import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MissionStackParamList } from '@/types/navigation.types';
import { Colors } from '@/constants/colors';

import ActiveAlarmScreen from '@/screens/active-alarm/ActiveAlarmScreen';
import StepMissionScreen from '@/screens/missions/step/StepMissionScreen';
import VoiceMissionScreen from '@/screens/missions/voice/VoiceMissionScreen';
import VisualSyncMissionScreen from '@/screens/missions/visual-sync/VisualSyncMissionScreen';
import QRScanMissionScreen from '@/screens/missions/qr-scan/QRScanMissionScreen';
import MissionSuccessScreen from '@/screens/mission-success/MissionSuccessScreen';

const Stack = createStackNavigator<MissionStackParamList>();

export default function MissionNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        cardStyle: { backgroundColor: Colors.vantablack },
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="ActiveAlarm" component={ActiveAlarmScreen} />
      <Stack.Screen name="StepMission" component={StepMissionScreen} />
      <Stack.Screen name="VoiceMission" component={VoiceMissionScreen} />
      <Stack.Screen name="VisualSyncMission" component={VisualSyncMissionScreen} />
      <Stack.Screen name="QRScanMission" component={QRScanMissionScreen} />
      <Stack.Screen name="MissionSuccess" component={MissionSuccessScreen} />
    </Stack.Navigator>
  );
}

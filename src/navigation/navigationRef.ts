import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation.types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToMission(alarmId: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('MissionNavigator', {
      screen: 'ActiveAlarm',
      params: { alarmId },
    });
  }
}

export function navigateToHome() {
  if (navigationRef.isReady()) {
    navigationRef.navigate('AppNavigator', { screen: 'Home' });
  }
}

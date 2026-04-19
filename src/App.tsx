import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { subscribeToAlarmEvents, checkPendingAlarmTrigger } from '@/services/alarm/AlarmReceiver';
import { usePermissions } from '@/hooks/usePermissions';
import RootNavigator from '@/navigation/RootNavigator';

export default function App() {
  const loadAlarms = useStore((s) => s.loadAlarms);
  const loadConfig = useStore((s) => s.loadConfig);
  const { requestAll } = usePermissions();

  const [fontsLoaded] = useFonts({
    'SpaceGrotesk-Bold': require('../assets/fonts/SpaceGrotesk-Bold.ttf'),
    'SpaceGrotesk-Medium': require('../assets/fonts/SpaceGrotesk-Medium.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
  });

  useEffect(() => {
    loadConfig();
    loadAlarms();
    requestAll();
    const unsubscribe = subscribeToAlarmEvents();

    // Delay slightly so navigation is ready and alarms are loaded into store
    const timer = setTimeout(() => {
      checkPendingAlarmTrigger();
    }, 500);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0e0e0e" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

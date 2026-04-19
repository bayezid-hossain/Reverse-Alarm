import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation.types';
import { Colors } from '@/constants/colors';
import { navigationRef } from './navigationRef';

import AppNavigator from './AppNavigator';
import MissionNavigator from './MissionNavigator';
import AlarmSetupScreen from '@/screens/alarm-setup/AlarmSetupScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: Colors.vantablack },
        }}
      >
        <Stack.Screen name="AppNavigator" component={AppNavigator} />
        <Stack.Screen
          name="AlarmSetup"
          component={AlarmSetupScreen}
          options={{ presentation: 'card', gestureEnabled: true }}
        />
        <Stack.Screen
          name="MissionNavigator"
          component={MissionNavigator}
          options={{
            presentation: 'modal',
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

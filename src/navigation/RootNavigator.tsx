import { Colors } from '@/constants/colors';
import { RootStackParamList } from '@/types/navigation.types';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { navigationRef } from './navigationRef';

import AlarmSetupScreen from '@/screens/alarm-setup/AlarmSetupScreen';
import AppNavigator from './AppNavigator';
import MissionNavigator from './MissionNavigator';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: Colors.vantablack },
          gestureEnabled: true,
          gestureDirection: 'horizontal',
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

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import { TabParamList } from '@/types/navigation.types';
import { Colors } from '@/constants/colors';
import { Fonts, FontSizes } from '@/constants/typography';
import { Layout } from '@/constants/layout';

import HomeScreen from '@/screens/home/HomeScreen';
import AppConfigScreen from '@/screens/config/AppConfigScreen';

const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={[
        styles.tabLabel,
        focused ? styles.tabLabelActive : styles.tabLabelInactive,
      ]}
    >
      {label}
    </Text>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="ALARMS" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Config"
        component={AppConfigScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="CONFIG" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    height: Layout.bottomTabHeight,
    paddingBottom: 0,
  },
  tabLabel: {
    fontFamily: Fonts.spaceGroteskBold,
    fontSize: FontSizes.label,
    letterSpacing: 2,
  },
  tabLabelActive: {
    color: Colors.heat,
  },
  tabLabelInactive: {
    color: Colors.textMuted,
  },
});

import React from 'react';
import { NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingScreen from '../screens/LandingScreen';
import MainTabs from './MainTabs';
import DetailScreen from '../screens/DetailScreen';
import SecretRevealScreen from '../screens/SecretRevealScreen';
import DemoModeScreen from '../screens/DemoModeScreen';
import { MainTabParamList } from './MainTabs';

export type RootStackParamList = {
  Landing: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Detail: { passId: string };
  SecretReveal: { passId: string };
  DemoMode: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Detail" component={DetailScreen} />
      <Stack.Screen name="SecretReveal" component={SecretRevealScreen} />
      <Stack.Screen name="DemoMode" component={DemoModeScreen} />
    </Stack.Navigator>
  );
}

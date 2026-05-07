import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FeedScreen from '../screens/FeedScreen';
import CreateScreen from '../screens/CreateScreen';
import PassportScreen from '../screens/PassportScreen';
import WalletScreen from '../screens/WalletScreen';
import { COLORS } from '../constants/colors';

export type MainTabParamList = {
  Feed: undefined;
  Create: undefined;
  Passport: undefined;
  Wallet: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, string> = {
  Feed: '👻',
  Create: '✨',
  Passport: '🏅',
  Wallet: '💰',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.tabBar,
          borderTopColor: COLORS.tabBarBorder,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarIcon: () => (
          <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name]}</Text>
        ),
        tabBarLabelStyle: { fontSize: 11 },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Explore' }} />
      <Tab.Screen name="Create" component={CreateScreen} options={{ title: 'Create' }} />
      <Tab.Screen name="Passport" component={PassportScreen} options={{ title: 'Passport' }} />
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ title: 'Wallet' }} />
    </Tab.Navigator>
  );
}

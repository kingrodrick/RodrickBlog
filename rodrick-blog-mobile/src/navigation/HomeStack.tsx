import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../features/home';
import { TripsListScreen } from '../features/trips';
import { HomeStackParamList } from './type';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="TripsList" component={TripsListScreen} />
      {/* TODO: TripDetail, EventDetail khi các màn này được dựng. */}
    </Stack.Navigator>
  );
}

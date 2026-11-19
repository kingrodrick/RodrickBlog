import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../features/home';
import {
  EventDetailScreen,
  PickEventScreen,
  RouteEditScreen,
  TripDetailScreen,
  TripsListScreen,
} from '../features/trips';
import { HomeStackParamList } from './type';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="TripsList" component={TripsListScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen
        name="RouteEdit"
        component={RouteEditScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="PickEvent"
        component={PickEventScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

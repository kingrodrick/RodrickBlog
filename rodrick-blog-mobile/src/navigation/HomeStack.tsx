import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../features/home';
import {
  EventDetailScreen,
  PickEventScreen,
  RouteEditScreen,
  TripDetailScreen,
} from '../features/trips';
import { HomeStackParamList } from './type';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen
        name="RouteEdit"
        component={RouteEditScreen}
        // Hộp thoại: màn chi tiết mốc vẫn hiện phía sau lớp phủ mờ.
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
      <Stack.Screen
        name="PickEvent"
        component={PickEventScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

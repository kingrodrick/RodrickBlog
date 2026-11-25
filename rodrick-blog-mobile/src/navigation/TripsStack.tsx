import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  EventDetailScreen,
  RouteEditScreen,
  TripDetailScreen,
  TripsListScreen,
} from '../features/trips';
import { TripsStackParamList } from './type';

const Stack = createNativeStackNavigator<TripsStackParamList>();

/** Stack trong tab Chuyến đi (gốc: danh sách chuyến đi), nên footer vẫn hiện ở các màn con. */
export function TripsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TripsList" component={TripsListScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen
        name="RouteEdit"
        component={RouteEditScreen}
        // Hộp thoại: màn chi tiết mốc vẫn hiện phía sau lớp phủ mờ.
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../features/auth';
import { RootStackParamList } from './type';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        {/* <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="TripDetail" component={TripDetailScreen} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

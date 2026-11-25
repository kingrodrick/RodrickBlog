import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CurrencyScreen, ToolsScreen } from '../features/tools';
import { ToolsStackParamList } from './type';

const Stack = createNativeStackNavigator<ToolsStackParamList>();

/** Stack trong tab Công cụ, nên footer vẫn hiện ở các màn con. */
export function ToolsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ToolsMain" component={ToolsScreen} />
      <Stack.Screen name="Currency" component={CurrencyScreen} />
    </Stack.Navigator>
  );
}

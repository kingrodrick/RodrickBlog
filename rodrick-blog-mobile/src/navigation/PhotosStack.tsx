import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CollectionPhotosScreen, PhotosScreen } from '../features/galleries';
import { PhotosStackParamList } from './type';

const Stack = createNativeStackNavigator<PhotosStackParamList>();

/** Stack trong tab Ảnh, nên footer vẫn hiện ở các màn con. */
export function PhotosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PhotosMain" component={PhotosScreen} />
      <Stack.Screen name="CollectionPhotos" component={CollectionPhotosScreen} />
    </Stack.Navigator>
  );
}

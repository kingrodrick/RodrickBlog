import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { AuthProvider, useAuth } from './src/features/auth/AuthProvider';
import { LoginScreen } from './src/features/auth';
import { NavigationContainer } from '@react-navigation/native';
import { MainTabs } from './src/navigation/MainTabs';

function Root() {
  const { status } = useAuth();

  if (status === 'loading') {
    return null; // sau này thay bằng bootsplash
  }
  if (status === 'signedOut') {
    return <LoginScreen />;
  }
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
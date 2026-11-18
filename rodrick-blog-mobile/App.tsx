import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { AuthProvider, useAuth } from './src/features/auth/AuthProvider';
import { Button, Screen, Text } from './src/shared/ui';
import { LoginScreen } from './src/features/auth';

function Root() {
  const { status, username, signOut } = useAuth();

  if (status === 'loading') {
    return null; // sau này thay bằng bootsplash
  }
  if (status === 'signedOut') {
    return <LoginScreen />;
  }
  return (
    <Screen title="Trang chủ">
      <Text>Đã đăng nhập: {username}</Text>
      <Button title="Đăng xuất" variant="secondary" onPress={signOut} />
    </Screen>
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
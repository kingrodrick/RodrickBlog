import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  loadThemeMode,
  saveThemeMode,
  ThemeMode,
  ThemeProvider,
  useTheme,
} from './src/theme';
import { AuthProvider, useAuth } from './src/features/auth/AuthProvider';
import { LoginScreen } from './src/features/auth';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { MainTabs } from './src/navigation/MainTabs';

function Root() {
  const { status } = useAuth();
  const { colors, isDark } = useTheme();
  // Nền của navigator lấy màu nền app, để vùng sau thanh tab (nền đen trong) không lộ màu xám mặc định.
  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: colors.background },
    };
  }, [colors.background, isDark]);

  if (status === 'loading') {
    return null; // sau này thay bằng bootsplash
  }
  if (status === 'signedOut') {
    return <LoginScreen />;
  }
  return (
    <NavigationContainer theme={navTheme}>
      <MainTabs />
    </NavigationContainer>
  );
}

export default function App() {
  // Đọc giao diện đã lưu trước khi dựng ThemeProvider (initialMode chỉ dùng lúc khởi tạo).
  const [themeMode, setThemeMode] = useState<ThemeMode | null>(null);

  useEffect(() => {
    loadThemeMode().then(saved => setThemeMode(saved ?? 'system'));
  }, []);

  if (!themeMode) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode={themeMode} onModeChange={saveThemeMode}>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

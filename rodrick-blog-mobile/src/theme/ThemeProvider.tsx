import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, darkColors, lightColors } from './colors';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  colors: Colors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type Props = {
  children: React.ReactNode;
  initialMode?: ThemeMode;
  /** Gọi khi đổi chế độ, dùng để lưu cục bộ (chưa gắn kho lưu trữ). */
  onModeChange?: (mode: ThemeMode) => void;
};

export function ThemeProvider({ children, initialMode = 'light', onModeChange }: Props) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      onModeChange?.(next);
    },
    [onModeChange],
  );

  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({ colors: isDark ? darkColors : lightColors, isDark, mode, setMode }),
    [isDark, mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme phải nằm trong ThemeProvider');
  }
  return ctx;
}

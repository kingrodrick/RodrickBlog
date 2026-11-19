import * as Keychain from 'react-native-keychain';
import { ThemeMode } from './ThemeProvider';

// Khoá riêng, tách khỏi khoá phiên đăng nhập (rodrick.session).
const SERVICE = 'rodrick.theme';
const MODES: ThemeMode[] = ['system', 'light', 'dark'];

export async function loadThemeMode(): Promise<ThemeMode | null> {
  try {
    const saved = await Keychain.getGenericPassword({ service: SERVICE });
    const mode = saved ? saved.password : null;
    return MODES.includes(mode as ThemeMode) ? (mode as ThemeMode) : null;
  } catch {
    return null;
  }
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await Keychain.setGenericPassword('theme', mode, { service: SERVICE });
  } catch {
    // Không lưu được thì lần sau dùng mặc định, không chặn người dùng.
  }
}

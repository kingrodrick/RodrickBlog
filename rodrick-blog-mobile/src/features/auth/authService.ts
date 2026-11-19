import * as Keychain from 'react-native-keychain';

const SERVICE = 'rodrick.session';

// Tạm thời: sau này thay bằng gọi server (Supabase Auth).
export function checkCredentials(username: string, password: string): boolean {
  return username.trim() === 'rodrick_blog' && password.trim() === '12345678';
}

// Ghi nhớ đăng nhập: lưu vào Keychain (iOS) / Keystore (Android), không lưu thường.
export async function saveSession(username: string): Promise<void> {
  await Keychain.setGenericPassword(username, String(Date.now()), {
    service: SERVICE,
  });
}

export async function loadSession(): Promise<string | null> {
  const saved = await Keychain.getGenericPassword({ service: SERVICE });
  return saved ? saved.username : null;
}

export async function clearSession(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}

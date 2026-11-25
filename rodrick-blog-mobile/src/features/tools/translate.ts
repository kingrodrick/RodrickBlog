import { Linking } from 'react-native';

/**
 * Dịch không làm trong app: mở thẳng app Google Dịch để gõ / chụp ở đó.
 * Link translate.google.com được app Google Dịch nhận (máy có app thì mở app, không có thì mở web).
 * Mặc định Việt → Nhật.
 */
const GOOGLE_TRANSLATE_URL = 'https://translate.google.com/?sl=vi&tl=ja&op=translate';
const STORE_URL = 'market://details?id=com.google.android.apps.translate';
const STORE_WEB_URL =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.translate';

/** Mở Google Dịch; không mở được thì mở trang cài app. Trả false nếu không mở được gì. */
export async function openGoogleTranslate(): Promise<boolean> {
  for (const url of [GOOGLE_TRANSLATE_URL, STORE_URL, STORE_WEB_URL]) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // Thử link tiếp theo.
    }
  }
  return false;
}

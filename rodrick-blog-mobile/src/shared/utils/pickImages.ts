import { launchImageLibrary } from 'react-native-image-picker';
import { LocalImage } from '../api/cloudinary';

/**
 * Mở thư viện ảnh của máy (Android dùng Photo Picker hệ thống, không cần xin quyền).
 * Trả về mảng rỗng khi người dùng huỷ.
 */
export async function pickImages(limit = 10): Promise<LocalImage[]> {
  const res = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: limit,
    quality: 1, // giữ nguyên chất lượng; Cloudinary tự tối ưu khi phát (f_auto,q_auto)
  });
  if (res.didCancel) {
    return [];
  }
  if (res.errorCode) {
    throw new Error(
      res.errorMessage ?? `Không mở được thư viện ảnh (${res.errorCode}).`,
    );
  }
  return (res.assets ?? [])
    .filter(a => !!a.uri)
    .map(a => ({ uri: a.uri as string, mimeType: a.type }));
}

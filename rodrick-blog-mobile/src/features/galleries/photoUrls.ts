import { PixelRatio } from 'react-native';
import { cloudinaryUrl } from '../../shared/utils/cloudinary';

/**
 * Ảnh nhỏ của lưới: giữ nguyên tỉ lệ (c_limit), ô vuông tự cắt khi hiển thị (resizeMode cover).
 * Không cắt vuông trên Cloudinary (c_fill) để màn xem ảnh dùng lại đúng ảnh này (đã có trong
 * cache) làm ảnh tạm: mở ảnh hay vuốt sang là thấy ngay, không phải chờ tải lần hai.
 * Khung 540: ảnh 3:2 về 540x360, cạnh ngắn bằng ảnh vuông 360 cũ, đủ nét cho ô ~130pt ở 3x.
 */
const THUMB_BOX = 540;

export function gridThumbUrl(url: string): string {
  return cloudinaryUrl(url, { w: THUMB_BOX, h: THUMB_BOX, fit: true });
}

/** Cạnh dài tối đa của ảnh xem: đủ nét khi phóng ~2x, nhẹ hơn nhiều so với ảnh gốc 24MP. */
const MAX_SIDE = 2560;

/**
 * Ảnh nét của màn xem: vừa màn hình (cạnh dài × mật độ điểm ảnh), không lấy ảnh gốc
 * (~6000x4000, tải và giải mã lâu). Dùng cạnh dài cho cả hai chiều nên xoay máy không tải lại.
 */
export function viewerUrl(url: string, width: number, height: number): string {
  const side = Math.min(MAX_SIDE, Math.ceil(Math.max(width, height) * PixelRatio.get()));
  return cloudinaryUrl(url, { w: side, h: side, fit: true });
}

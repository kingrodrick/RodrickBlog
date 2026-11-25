/**
 * Chèn f_auto,q_auto (và tuỳ chọn cỡ) ngay sau /upload/, giống lib/cloudinary.ts bản web.
 * `size`: mặc định cắt kín khung (c_fill); `fit: true` thì thu nhỏ vừa trong khung, giữ nguyên
 * tỉ lệ và không phóng to ảnh nhỏ (c_limit), dùng cho màn xem ảnh.
 */
export function cloudinaryUrl(
  url: string,
  size?: { w: number; h: number; fit?: boolean },
): string {
  if (!url || !url.includes('/image/upload/')) {
    return url;
  }
  const base = url.replace('/image/upload/f_auto,q_auto/', '/image/upload/');
  const t = size
    ? `f_auto,q_auto,${size.fit ? 'c_limit' : 'c_fill'},w_${size.w},h_${size.h}`
    : 'f_auto,q_auto';
  return base.replace('/image/upload/', `/image/upload/${t}/`);
}

/**
 * Helper function tối ưu hóa URL ảnh Cloudinary
 * Tự động chèn f_auto,q_auto để tối ưu dung lượng ảnh
 */
export function optimizeCloudinaryUrl(url: string): string {
  if (!url || !url.includes('/image/upload/')) {
    return url;
  }
  if (url.includes('/image/upload/f_auto,q_auto/')) {
    return url;
  }
  return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
}

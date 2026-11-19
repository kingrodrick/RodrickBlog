/** Chèn f_auto,q_auto (và tuỳ chọn cắt khung) ngay sau /upload/, giống lib/cloudinary.ts bản web. */
export function cloudinaryUrl(
  url: string,
  size?: { w: number; h: number },
): string {
  if (!url || !url.includes('/image/upload/')) {
    return url;
  }
  const base = url.replace('/image/upload/f_auto,q_auto/', '/image/upload/');
  const t = size
    ? `f_auto,q_auto,c_fill,w_${size.w},h_${size.h}`
    : 'f_auto,q_auto';
  return base.replace('/image/upload/', `/image/upload/${t}/`);
}

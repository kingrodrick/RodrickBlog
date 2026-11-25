import { deleteRows, insertRow, updateRows } from '../../../shared/api/supabase';
import { deleteCloudinaryImage } from '../../../shared/api/webApi';
import { DetailEvent, EventImage } from '../types';

export type NewImage = {
  url: string;
  caption: string | null;
  isReal: boolean;
  /** Trang/ảnh nguồn khi lấy từ bên ngoài (Pinterest, Google...). */
  sourceUrl?: string | null;
  /** Bộ sưu tập gán cho ảnh; null hoặc bỏ trống là không gán. */
  collectionId?: number | null;
};

/** Gắn một ảnh đã có trên Cloudinary vào mốc. Ảnh minh họa không mang thông tin máy ảnh. */
export async function addEventImage(event: DetailEvent, img: NewImage): Promise<void> {
  await insertRow('images', {
    cloudinary_url: img.url,
    caption: img.caption?.trim() || null,
    city: event.city,
    timeline_event_id: event.id,
    is_real_photo: img.isReal,
    taken_at: event.trip_date,
    source_url: img.sourceUrl ?? null,
    collection_id: img.collectionId ?? null,
    ...(img.isReal ? {} : { camera_gear: null }),
  });
}

/** Sửa mô tả và/hoặc đổi sang ảnh khác (url mới đã tải lên Cloudinary). */
export async function updateEventImage(
  id: number,
  patch: { caption: string | null; cloudinary_url?: string; source_url?: string | null },
): Promise<void> {
  await updateRows('images', `id=eq.${id}`, { ...patch, caption: patch.caption?.trim() || null });
}

/**
 * Xoá ảnh: thử xoá file trên Cloudinary qua route của web trước, rồi xoá dòng DB.
 * Trả false nếu file CDN chưa xoá được (dòng DB vẫn xoá) để báo cho người dùng.
 */
export async function removeEventImage(image: EventImage): Promise<{ cdnDeleted: boolean }> {
  const cdnDeleted = await deleteCloudinaryImage(image.cloudinary_url);
  await deleteRows('images', `id=eq.${image.id}`);
  return { cdnDeleted };
}

/** Xoá file cũ sau khi đã đổi ảnh thành công; lỗi chỉ bỏ qua vì dòng DB đã trỏ sang ảnh mới. */
export async function discardCloudinaryFile(url: string): Promise<boolean> {
  return deleteCloudinaryImage(url);
}

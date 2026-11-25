import { deleteRows, selectRows, updateRows } from '../../../shared/api/supabase';
import { deleteCloudinaryImage } from '../../../shared/api/webApi';
import { Photo, PhotoFilter } from '../types';

type DbImage = {
  id: number;
  cloudinary_url: string;
  caption: string | null;
  city: string | null;
  camera_gear: string | null;
  taken_at: string | null;
  is_real_photo: boolean | null;
};

/** Số ảnh mỗi lần tải; cuộn gần cuối lưới thì tải trang tiếp. */
export const PAGE_SIZE = 60;

const COLUMNS = 'id,cloudinary_url,caption,city,camera_gear,taken_at,is_real_photo';

export type PhotoQuery = {
  /** Chỉ ảnh của bộ sưu tập này. */
  collectionId?: number;
  filter?: PhotoFilter;
};

// Ảnh cũ có thể để trống is_real_photo: coi là ảnh thực tế, nên dùng "khác false" thay vì "= true".
const TYPE_FILTER: Record<PhotoFilter, string> = {
  all: '',
  real: '&is_real_photo=not.is.false',
  reference: '&is_real_photo=is.false',
};

/** Chuỗi truy vấn một trang ảnh, mới chụp nhất trước. */
export function photosQuery(offset: number, { collectionId, filter = 'all' }: PhotoQuery = {}): string {
  const collection = collectionId !== undefined ? `&collection_id=eq.${collectionId}` : '';
  return (
    `select=${COLUMNS}${collection}${TYPE_FILTER[filter]}` +
    '&order=taken_at.desc.nullslast,created_at.desc,id.desc' +
    `&limit=${PAGE_SIZE}&offset=${offset}`
  );
}

export async function fetchPhotos(offset: number, query: PhotoQuery = {}): Promise<Photo[]> {
  const rows = await selectRows<DbImage>('images', photosQuery(offset, query));
  return rows.map(r => ({
    id: r.id,
    url: r.cloudinary_url,
    caption: r.caption,
    city: r.city,
    cameraGear: r.camera_gear,
    takenAt: r.taken_at,
    isReal: r.is_real_photo !== false,
  }));
}

/** Xoá file trên Cloudinary tối đa từng này ảnh một lúc (route web gọi Cloudinary từng ảnh). */
const CDN_PARALLEL = 4;

/**
 * Xoá nhiều ảnh: xoá file trên Cloudinary qua route của web trước (file đã mất thì Cloudinary
 * báo "not found", vẫn tính là xong), rồi xoá các dòng trong bảng `images` bằng một lệnh.
 * Trả số ảnh chưa xoá được file trên Cloudinary (dòng DB vẫn xoá) để báo cho người dùng.
 */
export async function deletePhotos(photos: Photo[]): Promise<{ cdnFailed: number }> {
  if (!photos.length) {
    return { cdnFailed: 0 };
  }
  let cdnFailed = 0;
  for (let i = 0; i < photos.length; i += CDN_PARALLEL) {
    const results = await Promise.all(
      photos.slice(i, i + CDN_PARALLEL).map(p => deleteCloudinaryImage(p.url)),
    );
    cdnFailed += results.filter(ok => !ok).length;
  }
  await deleteRows('images', `id=in.(${photos.map(p => p.id).join(',')})`);
  return { cdnFailed };
}

/** Chuyển nhiều ảnh sang bộ sưu tập khác bằng một lệnh (đổi cột `collection_id`). */
export async function movePhotos(photoIds: number[], collectionId: number): Promise<void> {
  if (!photoIds.length) {
    return;
  }
  await updateRows('images', `id=in.(${photoIds.join(',')})`, { collection_id: collectionId });
}

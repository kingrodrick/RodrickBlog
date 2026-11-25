import { selectRows, updateRows } from '../../../shared/api/supabase';
import { Collection } from '../types';

type DbCollection = {
  id: number;
  title: string;
  description: string | null;
  cover_image: string | null;
  trip: { title: string } | null;
  photos: { count: number }[];
  cover: { cloudinary_url: string }[];
};

/**
 * Một lệnh lấy đủ: số ảnh (`photos:images(count)`), ảnh mới nhất làm bìa dự phòng
 * (`cover:images(...)` giới hạn 1) và tên chuyến đi đã gán.
 */
export const COLLECTIONS_QUERY =
  'select=id,title,description,cover_image,trip:trips(title),photos:images(count),cover:images(cloudinary_url)' +
  '&cover.order=taken_at.desc.nullslast&cover.limit=1&order=display_order.asc';

export async function fetchCollections(): Promise<Collection[]> {
  const rows = await selectRows<DbCollection>('collections', COLLECTIONS_QUERY);
  return rows.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    coverUrl: c.cover_image || c.cover[0]?.cloudinary_url || null,
    photoCount: c.photos[0]?.count ?? 0,
    tripTitle: c.trip?.title ?? null,
  }));
}

/** Thư mục Cloudinary cho ảnh bìa bộ sưu tập tải từ app. */
export const COVER_FOLDER = 'rodrick-blog/collections';


/** Thông tin sửa được của một bộ sưu tập. */
export type CollectionInfo = {
  title: string;
  /** Đường dẫn trên web (/gallery/...); duy nhất. */
  slug: string;
  description: string | null;
  /** Nhãn địa điểm, ví dụ "Kyoto, JP". */
  locationTag: string | null;
  /** cover_image đã đặt (không tính ảnh mới nhất dùng làm bìa dự phòng). */
  coverImage: string | null;
  /** Chuyến đi đã gán; null là chưa gán. */
  tripId: number | null;
};

type DbCollectionInfo = {
  title: string;
  slug: string;
  description: string | null;
  location_tag: string | null;
  cover_image: string | null;
  trip_id: number | null;
};

export async function fetchCollectionInfo(id: number): Promise<CollectionInfo> {
  const rows = await selectRows<DbCollectionInfo>(
    'collections',
    `select=title,slug,description,location_tag,cover_image,trip_id&id=eq.${id}&limit=1`,
  );
  const row = rows[0];
  if (!row) {
    throw new Error('Không tìm thấy bộ sưu tập.');
  }
  return {
    title: row.title,
    slug: row.slug,
    description: row.description,
    locationTag: row.location_tag,
    coverImage: row.cover_image,
    tripId: row.trip_id,
  };
}

/** "Kyoto: Phố Cổ" -> "kyoto-pho-co": chữ thường không dấu, số, gạch nối. */
export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Lưu thông tin; chữ trống thành null, slug chuẩn hoá. Slug trùng bộ khác thì báo lỗi rõ ràng. */
export async function updateCollectionInfo(id: number, info: CollectionInfo): Promise<void> {
  const title = info.title.trim();
  if (!title) {
    throw new Error('Tên bộ sưu tập không được để trống.');
  }
  const slug = normalizeSlug(info.slug);
  if (!slug) {
    throw new Error('Slug không được để trống.');
  }
  try {
    await updateRows('collections', `id=eq.${id}`, {
      title,
      slug,
      description: info.description?.trim() || null,
      location_tag: info.locationTag?.trim() || null,
      cover_image: info.coverImage,
      trip_id: info.tripId,
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes('collections_slug_key')) {
      throw new Error(`Slug "${slug}" đã có bộ sưu tập khác dùng.`);
    }
    throw e;
  }
}

/** Chuyến đi để gán cho bộ sưu tập, mới nhất trước. */
export type TripOption = { id: number; title: string };

export function fetchTripOptions(): Promise<TripOption[]> {
  return selectRows<TripOption>('trips', 'select=id,title&order=start_date.desc');
}

/**
 * Lưu thứ tự hiển thị: display_order = vị trí (bắt đầu từ 1).
 * Không đổi gì thì không gửi; có đổi thì ghi lại cả dãy (số cũ có thể trùng hoặc cách quãng).
 */
export async function saveCollectionOrder(before: number[], after: number[]): Promise<void> {
  if (before.length === after.length && before.every((id, i) => after[i] === id)) {
    return;
  }
  await Promise.all(
    after.map((id, i) => updateRows('collections', `id=eq.${id}`, { display_order: i + 1 })),
  );
}

import { selectRows } from '../../../shared/api/supabase';
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

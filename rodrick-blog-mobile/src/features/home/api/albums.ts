import { selectRows } from '../../../shared/api/supabase';
import { cloudinaryUrl } from '../../../shared/utils/cloudinary';
import { Album } from '../types';

type DbCollection = {
  id: number;
  title: string;
  cover_image: string | null;
  images?: { cloudinary_url: string; is_real_photo: boolean | null }[];
};

/** Album từ bảng `collections`; album chỉ toàn ảnh tham khảo được đánh dấu `reference`. */
export async function fetchAlbums(): Promise<Album[]> {
  const rows = await selectRows<DbCollection>(
    'collections',
    'select=id,title,cover_image,images(cloudinary_url,is_real_photo)&order=display_order.asc',
  );
  return rows.map(c => {
    const images = c.images ?? [];
    const reference =
      images.length > 0 && images.every(i => i.is_real_photo === false);
    const cover = c.cover_image || images[0]?.cloudinary_url;
    return {
      id: String(c.id),
      title: c.title,
      kind: reference ? 'reference' : 'real',
      // 2x kích thước khung 150x190 cho màn mật độ cao.
      coverUrl: cover ? cloudinaryUrl(cover, { w: 300, h: 380 }) : undefined,
    };
  });
}

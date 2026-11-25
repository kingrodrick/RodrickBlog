/** Một ảnh trong tab Ảnh (bảng `images`). */
export type Photo = {
  id: number;
  url: string;
  caption: string | null;
  city: string | null;
  cameraGear: string | null;
  takenAt: string | null;
  /** false: ảnh tham khảo (không phải ảnh tự chụp). */
  isReal: boolean;
};

/** Chế độ xem của tab Ảnh. */
export type GalleryMode = 'photos' | 'collections';

/** Lọc theo loại ảnh: cả hai, chỉ ảnh thực tế, chỉ ảnh tham khảo. */
export type PhotoFilter = 'all' | 'real' | 'reference';

/** Một bộ sưu tập (bảng `collections`) trong danh sách. */
export type Collection = {
  id: number;
  title: string;
  description: string | null;
  /** Ảnh bìa: cover_image, không có thì ảnh mới nhất trong bộ. */
  coverUrl: string | null;
  photoCount: number;
  /** Tên chuyến đi đã gán (cột trip_id). */
  tripTitle: string | null;
};

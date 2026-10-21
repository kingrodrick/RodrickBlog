export interface GalleryImage {
  id: number;
  cloudinary_url: string;
  caption: string | null;
  city: 'Tokyo' | 'Kyoto' | string | null;
  camera_gear: string | null;
  exif_info: string | null;
  collection_id: number | null;
  timeline_event_id: number | null;
  is_featured: boolean;
  is_real_photo?: boolean; // true: Ảnh chụp thực tế (Sony A6400), false: Ảnh minh họa / tham khảo web
  taken_at: string;
  created_at?: string;
}

export interface Collection {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  cover_image?: string | null; // Ảnh bìa / đại diện cho Album ảnh
  location_tag: string | null;
  display_order: number;
  images?: GalleryImage[];
  created_at?: string;
}

export interface TimelineEvent {
  id: number;
  trip_id: number;
  day_number: number;
  trip_date: string;
  time_slot: string;
  location_name: string;
  city: 'Tokyo' | 'Kyoto' | string;
  category_tag: 'TRANSIT' | 'FOOD' | 'SIGHTSEEING' | 'HOTEL' | string;
  notes: string | null;
  map_embed_url?: string | null; // URL nhúng Google Maps iframe hoặc link bản đồ
  images?: GalleryImage[]; // Danh sách ảnh nối từ bảng images sang
}

export interface Trip {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  cover_image?: string | null; // Ảnh đại diện / Banner cho chuyến đi
  start_date: string;
  end_date: string;
  cities: string;
  status: 'PLANNING' | 'ONGOING' | 'COMPLETED' | string;
  timeline_events?: TimelineEvent[];
  created_at?: string;
}

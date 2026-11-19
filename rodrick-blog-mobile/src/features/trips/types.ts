export type EventCategory =
  | 'TRANSIT'
  | 'FOOD'
  | 'RESTAURANT'
  | 'SIGHTSEEING'
  | 'HOTEL'
  | string;
export type TravelMode = 'driving' | 'walking' | 'bicycling' | 'transit';
export type DocumentType = 'FLIGHT' | 'TRANSPORT' | 'BOOKING';

export type EventMap = {
  id: number;
  seq: number;
  /** Trống nghĩa là lấy vị trí hiện tại của điện thoại. */
  origin_name: string | null;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_name: string;
  destination_lat: number | null;
  destination_lng: number | null;
  travel_mode: TravelMode | null;
  waypoints: string[];
};

export type EventDocument = {
  id: number;
  name: string;
  type: DocumentType;
  url: string;
};

export type EventImage = {
  id: number;
  cloudinary_url: string;
  caption: string | null;
  is_real_photo: boolean;
};

export type DetailEvent = {
  id: number;
  day_number: number;
  /** yyyy-mm-dd */
  trip_date: string;
  /** 'HH:MM:SS' */
  start_time: string | null;
  end_time: string | null;
  /** 1 nếu kết thúc sang hôm sau. */
  end_day_offset: number;
  /** Chuỗi gốc, dùng khi start_time trống. */
  time_slot: string;
  location_name: string;
  city: string;
  category_tag: EventCategory;
  /** Mô tả chi tiết (đoạn văn tự do). */
  notes: string | null;
  event_maps: EventMap[];
  images: EventImage[];
  documents: EventDocument[];
};

export type TripDetail = {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  timeline_events: DetailEvent[];
};

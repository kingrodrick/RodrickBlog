import { NavigatorScreenParams } from '@react-navigation/native';
import type { ParsedRoute } from '../features/trips';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  TripDetail: { tripId: string };
  EventDetail: { tripId: string; eventId: string };
};

/** Các màn chuyến đi, dùng chung cho stack của tab Trang chủ và tab Chuyến đi. */
type TripScreensParamList = {
  TripDetail: { tripId: string };
  /** Kèm tripId để màn chi tiết event tìm event trong chuyến đã tải; `notice` là toast khi quay về. */
  EventDetail: { tripId: string; eventId: string; notice?: string };
  /**
   * Có `mapId`: sửa đúng lộ trình đó. Không có: thêm lộ trình mới (không đụng lộ trình cũ).
   * `route` có sẵn khi đến từ liên kết đã đọc (ví dụ nhận từ nút Chia sẻ).
   * `view`: chỉ xem thông tin lộ trình, không lưu/xoá.
   */
  RouteEdit: { tripId: string; eventId: string; mapId?: number; route?: ParsedRoute; view?: boolean };
};

/** Stack nằm trong tab Trang chủ, nên footer vẫn hiện ở các màn con. */
export type HomeStackParamList = TripScreensParamList & {
  HomeMain: undefined;
  /** Chọn event để gán lộ trình vừa nhận từ nút Chia sẻ của Google Maps. */
  PickEvent: { route: ParsedRoute };
};

/** Stack trong tab Chuyến đi: gốc là danh sách chuyến đi. */
export type TripsStackParamList = TripScreensParamList & {
  TripsList: undefined;
};

/** Stack trong tab Công cụ. */
export type ToolsStackParamList = {
  ToolsMain: undefined;
  Currency: undefined;
};

/** Stack trong tab Ảnh. */
export type PhotosStackParamList = {
  /** `mode`: mở thẳng chế độ này (ví dụ "Xem tất cả" ở Trang chủ mở Bộ sưu tập). */
  PhotosMain: { mode?: 'photos' | 'collections' } | undefined;
  /** Lưới ảnh của một bộ sưu tập; `title` hiện ngay trên header khi chưa tải xong. */
  CollectionPhotos: { collectionId: number; title: string };
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Trips: NavigatorScreenParams<TripsStackParamList> | undefined;
  Tools: NavigatorScreenParams<ToolsStackParamList> | undefined;
  Photos: NavigatorScreenParams<PhotosStackParamList> | undefined;
  Settings: undefined;
};

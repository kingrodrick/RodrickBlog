import { NavigatorScreenParams } from '@react-navigation/native';
import type { ParsedRoute } from '../features/trips';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  TripDetail: { tripId: string };
  EventDetail: { tripId: string; eventId: string };
};

/** Stack nằm trong tab Trang chủ, nên footer vẫn hiện ở các màn con. */
export type HomeStackParamList = {
  HomeMain: undefined;
  TripsList: undefined;
  TripDetail: { tripId: string };
  /** Kèm tripId để màn chi tiết event tìm event trong chuyến đã tải; `notice` là toast khi quay về. */
  EventDetail: { tripId: string; eventId: string; notice?: string };
  /**
   * Có `mapId`: sửa đúng lộ trình đó. Không có: thêm lộ trình mới (không đụng lộ trình cũ).
   * `route` có sẵn khi đến từ liên kết đã đọc (ví dụ nhận từ nút Chia sẻ).
   * `view`: chỉ xem thông tin lộ trình, không lưu/xoá.
   */
  RouteEdit: { tripId: string; eventId: string; mapId?: number; route?: ParsedRoute; view?: boolean };
  /** Chọn event để gán lộ trình vừa nhận từ nút Chia sẻ của Google Maps. */
  PickEvent: { route: ParsedRoute };
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Documents: undefined;
  Photos: undefined;
  Settings: undefined;
};

import { NavigatorScreenParams } from '@react-navigation/native';
import type { ParsedRoute } from '../features/trips/parseMapsLink';

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
  /** `route` có sẵn khi đến từ liên kết đã đọc (ví dụ nhận từ nút Chia sẻ). */
  RouteEdit: { tripId: string; eventId: string; route?: ParsedRoute };
  /** Chọn event để gán lộ trình vừa nhận từ nút Chia sẻ của Google Maps. */
  PickEvent: { route: ParsedRoute };
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Documents: undefined;
  Photos: undefined;
  Settings: undefined;
};

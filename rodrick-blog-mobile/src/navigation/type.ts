import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  TripDetail: { tripId: string };
  EventDetail: { eventId: string };
};

/** Stack nằm trong tab Trang chủ, nên footer vẫn hiện ở các màn con. */
export type HomeStackParamList = {
  HomeMain: undefined;
  TripsList: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Documents: undefined;
  Photos: undefined;
  Settings: undefined;
};

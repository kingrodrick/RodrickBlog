export type TripStatus = 'planning' | 'ongoing' | 'completed';

export type TripEvent = {
  id: string;
  title: string;
  at: string; // yyyy-mm-ddThh:mm
};

export type Trip = {
  id: string;
  title: string;
  status: TripStatus;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  places: string[];
  coverUrl?: string;
  /** Đã sắp theo giờ; mốc đầu tiên = events[0]. */
  events: TripEvent[];
};

export type Album = {
  id: string;
  title: string;
  coverUrl?: string;
  kind: 'real' | 'reference';
};

import {
  daysUntil,
  parseDateTime,
  tripDayCount,
} from '../../shared/utils/format';
import { Trip, TripEvent } from './types';

/** Ưu tiên chuyến đang diễn ra; nếu không có, chuyến lên kế hoạch chưa qua có ngày đi sớm nhất. */
export function pickNearestTrip(trips: Trip[], now: Date): Trip | null {
  const ongoing = trips.find(t => t.status === 'ongoing');
  if (ongoing) {
    return ongoing;
  }
  const upcoming = trips
    .filter(t => t.status === 'planning' && daysUntil(t.startDate, now) >= 0)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return upcoming[0] ?? null;
}

/** Mốc đầu tiên chưa tới giờ. */
export function nextEvent(trip: Trip, now: Date): TripEvent | null {
  return (
    trip.events.find(e => parseDateTime(e.at).getTime() > now.getTime()) ?? null
  );
}

/** Thời điểm khởi hành: mốc đầu tiên, không có thì 00:00 ngày bắt đầu. */
export function tripStartTime(trip: Trip): Date {
  return parseDateTime(trip.events[0]?.at ?? trip.startDate);
}

/** Ngày thứ mấy / tổng số ngày, kẹp trong khoảng hợp lệ. */
export function tripDayProgress(
  trip: Trip,
  now: Date,
): { day: number; total: number } {
  const total = tripDayCount(trip.startDate, trip.endDate);
  const day = Math.min(total, Math.max(1, 1 - daysUntil(trip.startDate, now)));
  return { day, total };
}

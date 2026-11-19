import {
  daysUntil,
  parseDateTime,
  tripDayCount,
} from '../../shared/utils/format';
import { Trip, TripEvent } from './types';

// Dùng chung với feature trips nên đã chuyển sang shared.
export { pickNearestTrip } from '../../shared/utils/nearestTrip';

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

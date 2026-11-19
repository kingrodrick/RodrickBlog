import { Trip } from '../api/trips';
import { daysUntil } from './format';

/**
 * Chuyến gần nhất: ưu tiên chuyến đang diễn ra; nếu không có, chuyến lên kế hoạch chưa qua
 * có ngày đi sớm nhất. Dùng ở Trang chủ và màn gán lộ trình nhận từ Chia sẻ.
 */
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

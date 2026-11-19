import {
  pickNearestTrip,
  tripDayProgress,
} from '../src/features/home/pickNearestTrip';
import { Trip } from '../src/features/home/types';

const trip = (
  id: string,
  status: Trip['status'],
  startDate: string,
  endDate = startDate,
): Trip => ({
  id,
  title: id,
  status,
  startDate,
  endDate,
  places: [],
  events: [],
});

const now = new Date(2026, 10, 19, 9, 51);

describe('pickNearestTrip', () => {
  it('ưu tiên chuyến đang diễn ra', () => {
    const trips = [
      trip('a', 'planning', '2026-11-20'),
      trip('b', 'ongoing', '2026-11-10'),
    ];
    expect(pickNearestTrip(trips, now)?.id).toBe('b');
  });

  it('lấy chuyến lên kế hoạch sớm nhất chưa qua', () => {
    const trips = [
      trip('past', 'planning', '2026-11-01'),
      trip('late', 'planning', '2027-01-05'),
      trip('soon', 'planning', '2026-12-11'),
      trip('done', 'completed', '2026-11-25'),
    ];
    expect(pickNearestTrip(trips, now)?.id).toBe('soon');
  });

  it('trả về null khi không có chuyến phù hợp', () => {
    expect(
      pickNearestTrip([trip('done', 'completed', '2026-10-01')], now),
    ).toBeNull();
  });
});

describe('tripDayProgress', () => {
  it('tính ngày thứ mấy trên tổng số ngày', () => {
    const t = trip('x', 'ongoing', '2026-11-17', '2026-11-24');
    expect(tripDayProgress(t, now)).toEqual({ day: 3, total: 8 });
  });
});

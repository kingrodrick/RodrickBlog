import { selectRows } from '../../../shared/api/supabase';
import { DetailEvent, TripDetail } from '../types';

const SELECT =
  'select=id,title,start_date,end_date,status,' +
  'timeline_events(id,day_number,trip_date,start_time,end_time,end_day_offset,time_slot,' +
  'location_name,city,category_tag,notes,event_maps(*),' +
  'images(id,cloudinary_url,caption,is_real_photo),documents(id,name,type,url))';

/** Sắp theo ngày, rồi start_time (trống xuống cuối). */
const byTime = (a: DetailEvent, b: DetailEvent) =>
  a.trip_date.localeCompare(b.trip_date) ||
  (a.start_time ?? '99').localeCompare(b.start_time ?? '99') ||
  a.id - b.id;

export async function fetchTripDetail(id: number): Promise<TripDetail> {
  const rows = await selectRows<TripDetail>('trips', `${SELECT}&id=eq.${id}`);
  const trip = rows[0];
  if (!trip) {
    throw new Error('Không tìm thấy chuyến đi.');
  }
  trip.timeline_events = (trip.timeline_events ?? []).map(e => ({
    ...e,
    trip_date: e.trip_date.slice(0, 10),
    end_day_offset: e.end_day_offset ?? 0,
    event_maps: (e.event_maps ?? [])
      .map(m => ({ ...m, waypoints: m.waypoints ?? [] }))
      .sort((x, y) => x.seq - y.seq),
    images: e.images ?? [],
    documents: e.documents ?? [],
  }));
  trip.timeline_events.sort(byTime);
  return trip;
}

/** Các ngày có event (yyyy-mm-dd), lấy từ dữ liệu chứ không tính từ start_date. */
export function tripDays(trip: TripDetail): string[] {
  return [...new Set(trip.timeline_events.map(e => e.trip_date))].sort();
}

import { deleteRows, insertRow } from '../../../shared/api/supabase';
import { EventMap } from '../types';

export type RouteInput = Omit<EventMap, 'id' | 'seq'>;

function toRow(eventId: number, seq: number, r: RouteInput) {
  const destination = r.destination_name.trim();
  if (!destination) {
    throw new Error('Cần nhập điểm đến.');
  }
  return {
    event_id: eventId,
    seq,
    origin_name: r.origin_name?.trim() || null,
    origin_lat: r.origin_lat,
    origin_lng: r.origin_lng,
    destination_name: destination,
    destination_lat: r.destination_lat,
    destination_lng: r.destination_lng,
    waypoints: r.waypoints.map(w => w.trim()).filter(Boolean),
    travel_mode: r.travel_mode,
  };
}

/** Thêm một lộ trình mới vào cuối danh sách của event, không đụng các lộ trình đã có. */
export async function addEventRoute(eventId: number, existing: EventMap[], r: RouteInput): Promise<void> {
  const seq = existing.reduce((max, m) => Math.max(max, m.seq), 0) + 1;
  await insertRow('event_maps', toRow(eventId, seq, r));
}

/**
 * Sửa một lộ trình: ghi bản mới (cùng seq) trước rồi mới xoá bản cũ theo id, để nếu ghi lỗi
 * thì lộ trình cũ vẫn còn. Toạ độ chỉ có khi điểm giữ nguyên tên so với bản cũ.
 */
export async function replaceEventRoute(eventId: number, old: EventMap, r: RouteInput): Promise<void> {
  await insertRow('event_maps', toRow(eventId, old.seq, r));
  await deleteRows('event_maps', `id=eq.${old.id}`);
}

/** Xoá đúng một lộ trình theo id (event có thể có nhiều lộ trình). */
export async function deleteEventRouteById(id: number): Promise<void> {
  await deleteRows('event_maps', `id=eq.${id}`);
}

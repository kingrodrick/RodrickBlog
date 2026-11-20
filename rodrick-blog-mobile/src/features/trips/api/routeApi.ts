import { deleteRows, insertRow } from '../../../shared/api/supabase';
import { EventMap } from '../types';

export type RouteInput = Omit<EventMap, 'id' | 'seq'>;

/**
 * Lưu lộ trình chặng 1 của event. Ghi bản mới trước rồi mới xoá bản cũ,
 * để nếu ghi lỗi thì lộ trình cũ vẫn còn. Toạ độ chỉ có khi điểm giữ nguyên tên so với bản cũ.
 */
export async function saveEventRoute(eventId: number, r: RouteInput): Promise<void> {
  const destination = r.destination_name.trim();
  if (!destination) {
    throw new Error('Cần nhập điểm đến.');
  }
  const created = await insertRow<{ id: number }>('event_maps', {
    event_id: eventId,
    seq: 1,
    origin_name: r.origin_name?.trim() || null,
    origin_lat: r.origin_lat,
    origin_lng: r.origin_lng,
    destination_name: destination,
    destination_lat: r.destination_lat,
    destination_lng: r.destination_lng,
    waypoints: r.waypoints.map(w => w.trim()).filter(Boolean),
    travel_mode: r.travel_mode,
  });
  await deleteRows('event_maps', `event_id=eq.${eventId}&seq=eq.1&id=neq.${created.id}`);
}

/** Xoá đúng một lộ trình theo id (event có thể có nhiều lộ trình). */
export async function deleteEventRouteById(id: number): Promise<void> {
  await deleteRows('event_maps', `id=eq.${id}`);
}

export async function deleteEventRoute(eventId: number): Promise<void> {
  await deleteRows('event_maps', `event_id=eq.${eventId}&seq=eq.1`);
}

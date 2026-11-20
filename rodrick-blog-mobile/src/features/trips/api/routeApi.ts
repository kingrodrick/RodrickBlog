import { deleteRows, insertRow, updateRows } from '../../../shared/api/supabase';
import { EventMap } from '../types';

export type RouteInput = Omit<EventMap, 'id' | 'seq'>;

/**
 * Dòng ghi vào event_maps. `depart_at` chỉ gửi khi có giá trị hoặc cần xoá giá trị cũ, để app
 * vẫn lưu được lộ trình không có giờ xuất phát kể cả khi bảng chưa thêm cột này.
 */
function toRow(eventId: number, seq: number, r: RouteInput, clearDepart = false) {
  const destination = r.destination_name.trim();
  if (!destination) {
    throw new Error('Cần nhập điểm đến.');
  }
  return {
    ...(r.depart_at || clearDepart ? { depart_at: r.depart_at } : {}),
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
 * Sửa một lộ trình: cập nhật thẳng dòng cũ theo id (một lệnh, nên lỗi thì dòng cũ vẫn nguyên).
 * Không ghi bản mới rồi xoá bản cũ được vì bảng có ràng buộc duy nhất (event_id, seq).
 */
export async function replaceEventRoute(eventId: number, old: EventMap, r: RouteInput): Promise<void> {
  await updateRows('event_maps', `id=eq.${old.id}`, toRow(eventId, old.seq, r, !!old.depart_at));
}

/** Xoá đúng một lộ trình theo id (event có thể có nhiều lộ trình). */
export async function deleteEventRouteById(id: number): Promise<void> {
  await deleteRows('event_maps', `id=eq.${id}`);
}

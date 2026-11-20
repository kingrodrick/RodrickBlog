/**
 * Ghi nhớ lộ trình vừa được mở sang Google Maps để xem/sửa. Khi người dùng bấm Chia sẻ trong
 * Google Maps quay về app, ShareReceiver lấy lại mapId này để cập nhật đúng lộ trình đó thay vì
 * thêm lộ trình mới. Chỉ giữ một mục, hết hạn sau 30 phút để không gán nhầm về sau.
 */
type Pending = { eventId: number; mapId: number; at: number };

const TTL_MS = 30 * 60 * 1000;
let pending: Pending | null = null;

export function markRouteEdit(eventId: number, mapId: number) {
  pending = { eventId, mapId, at: Date.now() };
}

export function clearRouteEdit() {
  pending = null;
}

/** Lấy (và xoá) mapId đang chờ nếu đúng event và chưa hết hạn. */
export function takeRouteEdit(eventId: number): number | undefined {
  const p = pending;
  pending = null;
  if (!p || p.eventId !== eventId || Date.now() - p.at > TTL_MS) {
    return undefined;
  }
  return p.mapId;
}

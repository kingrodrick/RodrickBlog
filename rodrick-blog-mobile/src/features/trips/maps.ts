import { EventMap, TravelMode } from './types';

/** Có toạ độ thì dùng "lat,lng", không thì "tên, thành phố". */
const pt = (
  name: string | null,
  lat: number | null,
  lng: number | null,
  city: string,
) => (lat != null && lng != null ? `${lat},${lng}` : `${name}, ${city}`);

const hasXY = (lat: number | null, lng: number | null) => lat != null && lng != null;

// Mã phương tiện trong tham số data=!3eN của URL dạng đường dẫn.
const MODE_CODE: Record<TravelMode, number> = {
  driving: 0,
  bicycling: 1,
  walking: 2,
  transit: 3,
};

/**
 * Đoạn `/data=` của link chỉ đường: phương tiện (`!3eN`) và giờ xuất phát
 * (`!2m3!6e0!7e2!8j<giây>`, giờ địa phương mã hoá như UTC). `!4mN` là số phần tử con theo sau,
 * phải đếm đúng thì Maps mới đọc.
 */
function directionsData(m: EventMap): string {
  const items: string[] = [];
  if (m.depart_at) {
    const sec = Math.floor(Date.parse(`${m.depart_at.slice(0, 19)}Z`) / 1000);
    if (Number.isFinite(sec)) {
      items.push('!2m3', '!6e0', '!7e2', `!8j${sec}`);
    }
  }
  if (m.travel_mode) {
    items.push(`!3e${MODE_CODE[m.travel_mode]}`);
  }
  if (!items.length) {
    return '';
  }
  return `/data=!4m${items.length + 1}!4m${items.length}${items.join('')}`;
}

/**
 * URL chỉ đường Google Maps, mở bằng Linking.openURL.
 * - Mọi điểm có toạ độ: dạng API `dir/?api=1&origin=&destination=` (đã chạy đúng trên máy).
 * - Có điểm chỉ có tên: dạng đường dẫn `/maps/dir/A/B/C/data=!4m2!4m1!3eN`, giống link
 *   Google tự tạo khi chia sẻ. Dạng API với tên mơ hồ làm app Maps mở trang tìm điểm đến
 *   thay vì vẽ cung đường.
 */
export function buildDirectionsUrl(m: EventMap, city: string): string {
  const allXY =
    hasXY(m.destination_lat, m.destination_lng) &&
    (!m.origin_name || hasXY(m.origin_lat, m.origin_lng)) &&
    m.waypoints.length === 0;
  // Dạng API không có tham số giờ xuất phát, nên có giờ thì luôn dùng dạng đường dẫn.
  if (!allXY || m.depart_at) {
    const seg = (s: string) => encodeURIComponent(s);
    const parts = [
      // Đoạn trống ở đầu = vị trí hiện tại (đúng như link "dir//Điểm-đến" của Google).
      m.origin_name ? seg(pt(m.origin_name, m.origin_lat, m.origin_lng, city)) : '',
      ...m.waypoints.map(w => seg(`${w}, ${city}`)),
      seg(pt(m.destination_name, m.destination_lat, m.destination_lng, city)),
    ];
    return `https://www.google.com/maps/dir/${parts.join('/')}${directionsData(m)}`;
  }

  const q: string[] = [
    'api=1',
    `destination=${encodeURIComponent(
      pt(m.destination_name, m.destination_lat, m.destination_lng, city),
    )}`,
  ];
  if (m.origin_name) {
    q.push(
      `origin=${encodeURIComponent(
        pt(m.origin_name, m.origin_lat, m.origin_lng, city),
      )}`,
    );
  }
  if (m.waypoints.length) {
    q.push(
      `waypoints=${encodeURIComponent(
        m.waypoints.map(w => `${w}, ${city}`).join('|'),
      )}`,
    );
  }
  if (m.travel_mode) {
    q.push(`travelmode=${m.travel_mode}`);
  }
  return `https://www.google.com/maps/dir/?${q.join('&')}`;
}

/**
 * Mở Google Maps ở chế độ chỉ đường để chọn lộ trình mới. Có tên địa điểm thì đặt sẵn làm
 * điểm đến (điểm đi để trống = vị trí hiện tại); không có thì mở trang chỉ đường trống.
 */
export function buildPickRouteUrl(locationName?: string, city?: string): string {
  if (!locationName) {
    return 'https://www.google.com/maps/dir/?api=1';
  }
  const dest = city ? `${locationName}, ${city}` : locationName;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

export const TRAVEL_MODE_LABEL: Record<TravelMode, string> = {
  transit: 'Tàu, xe buýt',
  walking: 'Đi bộ',
  driving: 'Ô tô',
  bicycling: 'Xe đạp',
};

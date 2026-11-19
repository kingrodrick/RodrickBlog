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
  if (!allXY) {
    const seg = (s: string) => encodeURIComponent(s);
    const parts = [
      // Đoạn trống ở đầu = vị trí hiện tại (đúng như link "dir//Điểm-đến" của Google).
      m.origin_name ? seg(pt(m.origin_name, m.origin_lat, m.origin_lng, city)) : '',
      ...m.waypoints.map(w => seg(`${w}, ${city}`)),
      seg(pt(m.destination_name, m.destination_lat, m.destination_lng, city)),
    ];
    const data = m.travel_mode ? `/data=!4m2!4m1!3e${MODE_CODE[m.travel_mode]}` : '';
    return `https://www.google.com/maps/dir/${parts.join('/')}${data}`;
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

/** Dự phòng khi event không có event_maps (và không phải chuyến bay). */
export function buildSearchUrl(locationName: string, city: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${locationName}, ${city}`,
  )}`;
}

export const TRAVEL_MODE_LABEL: Record<TravelMode, string> = {
  transit: 'Tàu, xe buýt',
  walking: 'Đi bộ',
  driving: 'Ô tô',
  bicycling: 'Xe đạp',
};

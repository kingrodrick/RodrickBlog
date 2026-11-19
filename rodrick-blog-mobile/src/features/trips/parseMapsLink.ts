import { TravelMode } from './types';

export type ParsedRoute = {
  /** null nghĩa là vị trí hiện tại của điện thoại. */
  origin: string | null;
  waypoints: string[];
  destination: string;
  mode: TravelMode | null;
};

const MODES: TravelMode[] = ['driving', 'walking', 'bicycling', 'transit'];
// Mã !3eN trong liên kết dạng đường dẫn của Google Maps.
const MODE_CODE: Record<string, TravelMode> = {
  '0': 'driving',
  '1': 'bicycling',
  '2': 'walking',
  '3': 'transit',
};

const decode = (s: string) => {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' ')).trim();
  } catch {
    return s.replace(/\+/g, ' ').trim();
  }
};

/** Tách '?a=b&c=d' (URLSearchParams của React Native chưa đầy đủ). */
function parseQuery(q: string): Record<string, string> {
  const out: Record<string, string> = {};
  q.replace(/^\?/, '')
    .split('&')
    .filter(Boolean)
    .forEach(pair => {
      const i = pair.indexOf('=');
      const k = decode(i < 0 ? pair : pair.slice(0, i));
      out[k] = i < 0 ? '' : decode(pair.slice(i + 1));
    });
  return out;
}

/**
 * Đọc điểm đi, điểm dừng, điểm đến và phương tiện từ liên kết Google Maps.
 * Hỗ trợ dạng API (/maps/dir/?api=1&origin=...) và dạng đường dẫn (/maps/dir/A/B/@...,data=!3e3).
 * Định dạng không công bố chính thức nên có thể đổi; không đọc được thì trả null.
 */
export function parseMapsLink(input: string): ParsedRoute | null {
  const raw = input.trim();
  const m0 = raw.match(/^https?:\/\/(?:www\.)?google\.[a-z.]+(\/maps[^?#]*)(\?[^#]*)?/i);
  if (!m0) {
    return null;
  }
  const path = m0[1];
  const query = parseQuery(m0[2] ?? '');

  if (query.destination) {
    const tm = query.travelmode as TravelMode;
    return {
      origin: query.origin || null,
      waypoints: query.waypoints ? query.waypoints.split('|').map(s => s.trim()).filter(Boolean) : [],
      destination: query.destination,
      mode: MODES.includes(tm) ? tm : null,
    };
  }

  const m = path.match(/^\/maps\/(dir|place)\/(.*)$/);
  if (!m) {
    return null;
  }
  // Giữ cả đoạn trống để nhận dạng "dir//Điểm-đến" (không điểm đi).
  const segs = m[2]
    .split('/')
    .filter(s => !s.startsWith('@') && !s.startsWith('data='))
    .map(decode);
  const pts = segs.filter(Boolean);
  if (pts.length === 0) {
    return null;
  }
  const code = (raw.match(/!3e(\d)/) || [])[1];
  const mode = code !== undefined ? MODE_CODE[code] ?? null : null;

  if (m[1] === 'place') {
    return { origin: null, waypoints: [], destination: pts[0], mode: null };
  }
  if (pts.length === 1) {
    return { origin: null, waypoints: [], destination: pts[0], mode };
  }
  const noOrigin = segs[0] === '';
  return {
    origin: noOrigin ? null : pts[0],
    waypoints: noOrigin ? pts.slice(0, -1) : pts.slice(1, -1),
    destination: pts[pts.length - 1],
    mode,
  };
}

/** Liên kết rút gọn (maps.app.goo.gl): đi theo chuyển hướng để lấy liên kết đầy đủ. */
export async function resolveMapsLink(input: string): Promise<string> {
  const url = input.trim();
  if (/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(url)) {
    // fetch của React Native tự đi theo chuyển hướng; res.url là địa chỉ cuối.
    const res = await fetch(url, { method: 'GET' });
    return res.url || url;
  }
  return url;
}

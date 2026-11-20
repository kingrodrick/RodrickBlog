import { TravelMode } from './types';

export type ParsedRoute = {
  /** null nghĩa là vị trí hiện tại của điện thoại. */
  origin: string | null;
  waypoints: string[];
  destination: string;
  mode: TravelMode | null;
  /** Giờ xuất phát (giờ địa phương, 'YYYY-MM-DDTHH:MM:SS'); null: đi ngay. */
  departAt?: string | null;
  /** Liên kết gốc đã đọc (ví dụ nhận từ nút Chia sẻ), để điền lại vào ô "Dán liên kết". */
  link?: string;
};

const MODES: TravelMode[] = ['driving', 'walking', 'bicycling', 'transit'];
// Mã !3eN trong liên kết dạng đường dẫn của Google Maps.
const MODE_CODE: Record<string, TravelMode> = {
  '0': 'driving',
  '1': 'bicycling',
  '2': 'walking',
  '3': 'transit',
};
// Tham số dirflg của liên kết dạng cũ.
const DIRFLG: Record<string, TravelMode> = {
  d: 'driving',
  w: 'walking',
  b: 'bicycling',
  r: 'transit',
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
  const m0 = raw.match(/^https?:\/\/((?:www\.|maps\.|consent\.)?google\.[a-z.]+)(\/[^?#]*)?(\?[^#]*)?/i);
  if (!m0) {
    return null;
  }
  const host = m0[1].toLowerCase();
  const path = m0[2] ?? '/';
  const query = parseQuery(m0[3] ?? '');

  // Trang xin đồng ý cookie: liên kết thật nằm trong tham số continue.
  if (host.startsWith('consent.')) {
    return query.continue ? parseMapsLink(query.continue) : null;
  }
  if (!path.startsWith('/maps') && !host.startsWith('maps.')) {
    return null;
  }

  if (query.destination) {
    const tm = query.travelmode as TravelMode;
    return {
      origin: query.origin || null,
      waypoints: query.waypoints ? query.waypoints.split('|').map(s => s.trim()).filter(Boolean) : [],
      destination: query.destination,
      mode: MODES.includes(tm) ? tm : null,
    };
  }

  // Dạng cũ: ?saddr=A&daddr=B+to:C&dirflg=r (maps.google.com).
  if (query.daddr) {
    const pts = query.daddr.split(/\s+to:/i).map(s => s.trim()).filter(Boolean);
    if (pts.length) {
      return {
        origin: query.saddr || null,
        waypoints: pts.slice(0, -1),
        destination: pts[pts.length - 1],
        mode: DIRFLG[query.dirflg] ?? null,
      };
    }
  }

  // Một điểm: /maps/search/?api=1&query=... hoặc ?q=...
  const single = query.query || query.q;

  const m = path.match(/^\/maps\/(dir|place|search)\/(.*)$/);
  if (!m) {
    return single ? { origin: null, waypoints: [], destination: single, mode: null } : null;
  }
  // Giữ cả đoạn trống để nhận dạng "dir//Điểm-đến" (không điểm đi).
  const segs = m[2]
    .split('/')
    .filter(s => !s.startsWith('@') && !s.startsWith('data='))
    .map(decode);
  const pts = segs.filter(Boolean);
  if (pts.length === 0) {
    return single ? { origin: null, waypoints: [], destination: single, mode: null } : null;
  }
  const code = (raw.match(/!3e(\d)/) || [])[1];
  const mode = code !== undefined ? MODE_CODE[code] ?? null : null;

  if (m[1] !== 'dir') {
    return { origin: null, waypoints: [], destination: pts[0], mode: null };
  }
  const departAt = readDepartAt(raw);
  if (pts.length === 1) {
    return { origin: null, waypoints: [], destination: pts[0], mode, departAt };
  }
  const noOrigin = segs[0] === '';
  return {
    origin: noOrigin ? null : pts[0],
    waypoints: noOrigin ? pts.slice(0, -1) : pts.slice(1, -1),
    destination: pts[pts.length - 1],
    mode,
    departAt,
  };
}

/**
 * Giờ xuất phát trong data= của link chỉ đường: `!6e0` = "Khởi hành lúc", `!8j<giây>` = thời
 * điểm. Google mã hoá giờ địa phương như thể là UTC, nên đọc lại bằng UTC là ra đúng giờ hiển
 * thị trong Maps. "Đến lúc" (`!6e1`) không phải giờ xuất phát nên bỏ qua.
 */
function readDepartAt(raw: string): string | null {
  const kind = (raw.match(/!6e(\d)/) || [])[1];
  const sec = (raw.match(/!8j(\d{9,11})/) || [])[1];
  if (kind !== '0' || !sec) {
    return null;
  }
  return new Date(Number(sec) * 1000).toISOString().slice(0, 19);
}

/** Tìm liên kết Google Maps đầy đủ nằm trong mã HTML (trang trung gian không tự chuyển hướng). */
export function findMapsUrlInHtml(html: string): string | null {
  const text = html
    .replace(/\\u003d/gi, '=')
    .replace(/\\u0026/gi, '&')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&');
  const found = text.match(/https?:\/\/(?:www\.|maps\.)?google\.[a-z.]+\/maps[^"'<>\s\\]*/i);
  return found ? found[0] : null;
}

/** Liên kết rút gọn (maps.app.goo.gl): đi theo chuyển hướng để lấy liên kết đầy đủ. */
export async function resolveMapsLink(input: string): Promise<string> {
  const url = input.trim();
  if (/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(url)) {
    // fetch của React Native tự đi theo chuyển hướng; res.url là địa chỉ cuối.
    const res = await fetch(url, { method: 'GET' });
    const final = res.url || url;
    if (parseMapsLink(final)) {
      return final;
    }
    // Không chuyển hướng tới link đọc được: tìm link đầy đủ trong nội dung trang.
    const inBody = findMapsUrlInHtml(await res.text().catch(() => ''));
    return inBody ?? final;
  }
  return url;
}

const SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const LONG = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const pad = (n: number) => String(n).padStart(2, '0');

/** 'yyyy-mm-dd' sang Date giờ địa phương (tránh lệch múi giờ của new Date(iso)). */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toIsoDay(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Chip dải ngày: { weekday: 'T7', day: '12' }. */
export function dayChip(iso: string) {
  const d = parseDay(iso);
  return { weekday: SHORT[d.getDay()], day: String(d.getDate()) };
}

/** Ngày ngắn: 'T7, 12/12'. */
export function shortDate(iso: string): string {
  const d = parseDay(iso);
  return `${SHORT[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** Tiêu đề ngày: 'Thứ Bảy, 12/12'. */
export function dayTitle(iso: string): string {
  const d = parseDay(iso);
  return `${LONG[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** Khoảng ngày gọn: '11-18/12/2026', '28/11-03/12/2026', hoặc đủ hai đầu nếu khác năm. */
export function compactRange(start: string, end: string): string {
  const a = parseDay(start);
  const b = parseDay(end);
  const dm = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  if (a.getFullYear() !== b.getFullYear()) {
    return `${dm(a)}/${a.getFullYear()}-${dm(b)}/${b.getFullYear()}`;
  }
  if (a.getMonth() !== b.getMonth()) {
    return `${dm(a)}-${dm(b)}/${b.getFullYear()}`;
  }
  return `${pad(a.getDate())}-${dm(b)}/${b.getFullYear()}`;
}

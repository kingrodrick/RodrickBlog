const DAY = 86400000;
const pad = (n: number) => String(n).padStart(2, '0');

const WEEKDAYS = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

function parseDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** yyyy-mm-ddThh:mm theo giờ máy (không phụ thuộc cách engine hiểu chuỗi ISO). */
export function parseDateTime(at: string): Date {
  const [date, time = '00:00'] = at.split('T');
  const [h, min] = time.split(':').map(Number);
  const d = parseDate(date);
  d.setHours(h || 0, min || 0, 0, 0);
  return d;
}

const full = (d: Date) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

/** 11/12/2026 - 18/12/2026 */
export function formatDateRange(start: string, end: string): string {
  return `${full(parseDate(start))} - ${full(parseDate(end))}`;
}

/** Số ngày của chuyến, tính cả ngày đầu và cuối. */
export function tripDayCount(start: string, end: string): number {
  return (
    Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / DAY) +
    1
  );
}

/** 8 ngày 7 đêm. */
export function tripLength(start: string, end: string): string {
  const days = tripDayCount(start, end);
  return `${days} ngày ${days - 1} đêm`;
}

/** Số ngày từ hôm nay đến ngày đó (âm nếu đã qua). */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseDate(iso).getTime() - today.getTime()) / DAY);
}

/** 19:15, 11/12 */
export function formatTimeDate(at: string): string {
  const [date, time = ''] = at.split('T');
  const d = parseDate(date);
  return `${time.slice(0, 5)}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** Thứ Năm, 19/11/2026 · 09:51 */
export function formatWeekdayDateTime(now: Date): string {
  return `${WEEKDAYS[now.getDay()]}, ${full(now)} · ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;
}

function splitMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

/** 22 ngày 09:09:00 (không âm). */
export function formatCountdownDays(ms: number): string {
  const { days, h, m, s } = splitMs(ms);
  return `${days} ngày ${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** 03:54:00 (không âm; giờ có thể vượt 24). */
export function formatCountdownHms(ms: number): string {
  const { days, h, m, s } = splitMs(ms);
  return `${pad(days * 24 + h)}:${pad(m)}:${pad(s)}`;
}

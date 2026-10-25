import { TimelineEvent, Trip, GalleryImage } from '@/types/database.type';
import { extractStartTimeFromSlot } from '@/lib/timeUtils';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80';

/** Ảnh bìa chuyến đi: cột cover_image, nếu trống thì ảnh đầu tiên trên timeline (như TripCard) */
export function tripCoverUrl(
  trip: Trip & { timeline_events?: (TimelineEvent & { images?: GalleryImage[] })[] }
): string {
  let url = trip.cover_image || '';
  if (!url) {
    for (const event of trip.timeline_events || []) {
      if (event.images?.[0]?.cloudinary_url) {
        url = event.images[0].cloudinary_url;
        break;
      }
    }
  }
  return optimizeCloudinaryUrl(url || FALLBACK_COVER);
}

/** Chuyến đi gần nhất chưa kết thúc; nếu không có thì chuyến đầu danh sách */
export function pickNextTrip<T extends Trip>(trips: T[]): T | null {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips
    .filter((t) => t.end_date && t.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  return upcoming[0] || trips[0] || null;
}

/** Số ảnh trên toàn bộ timeline của chuyến đi */
export function tripPhotoCount(trip: { timeline_events?: { images?: GalleryImage[] }[] }): number {
  return (trip.timeline_events || []).reduce((sum, e) => sum + (e.images?.length || 0), 0);
}

const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

function splitDate(dateStr?: string | null): [number, number, number] | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return [parts[0], parts[1], parts[2]];
}

const pad = (n: number) => String(n).padStart(2, '0');

/** '2026-12-11' -> '11/12/2026' */
export function formatDateVN(dateStr?: string | null): string {
  const p = splitDate(dateStr);
  if (!p) return dateStr || '';
  return `${pad(p[2])}/${pad(p[1])}/${p[0]}`;
}

/** '2026-12-11' -> '11/12' */
export function formatDayMonth(dateStr?: string | null): string {
  const p = splitDate(dateStr);
  if (!p) return dateStr || '';
  return `${pad(p[2])}/${pad(p[1])}`;
}

/** '2026-12-11' -> 'Thứ sáu' */
export function weekdayVN(dateStr?: string | null): string {
  const p = splitDate(dateStr);
  if (!p) return '';
  return WEEKDAYS[new Date(p[0], p[1] - 1, p[2]).getDay()];
}

/** Khoảng ngày gọn: '11–18/12/2026', hoặc '28/12/2026–02/01/2027' khi khác tháng */
export function formatDateRangeVN(start?: string | null, end?: string | null): string {
  const s = splitDate(start);
  const e = splitDate(end);
  if (!s) return formatDateVN(end);
  if (!e) return formatDateVN(start);
  if (s[0] === e[0] && s[1] === e[1]) {
    return `${pad(s[2])}–${pad(e[2])}/${pad(e[1])}/${e[0]}`;
  }
  return `${formatDateVN(start)}–${formatDateVN(end)}`;
}

/** Số ngày của chuyến đi, tính cả ngày đầu và ngày cuối */
export function tripDurationDays(start?: string | null, end?: string | null, fallback = 0): number {
  const s = splitDate(start);
  const e = splitDate(end);
  if (!s || !e) return fallback;
  const diff =
    Math.round(
      (new Date(e[0], e[1] - 1, e[2]).getTime() - new Date(s[0], s[1] - 1, s[2]).getTime()) /
        86400000
    ) + 1;
  return diff > 0 ? Math.max(diff, fallback) : fallback;
}

export function formatDuration(days: number): string {
  if (days <= 0) return '';
  return `${days} ngày ${Math.max(0, days - 1)} đêm`;
}

/** Tháng của chuyến đi: 'tháng 12/2026' */
export function formatMonthYear(dateStr?: string | null): string {
  const p = splitDate(dateStr);
  if (!p) return '';
  return `tháng ${p[1]}/${p[0]}`;
}

const JAPAN_CITY = /tokyo|kyoto|osaka|nara|hakone|nikko|narita|haneda|fuji|kamakura|yokohama|hokkaido|sapporo|nhật/i;

/** Múi giờ (UTC+) của thành phố trên lịch trình: Nhật Bản +9, còn lại theo giờ Việt Nam +7 */
export function cityUtcOffset(city?: string | null): number {
  return city && JAPAN_CITY.test(city) ? 9 : 7;
}

/** Thời điểm bắt đầu (epoch ms) của một mốc lịch trình, theo giờ địa phương của thành phố */
export function eventStartMs(event: Pick<TimelineEvent, 'trip_date' | 'time_slot' | 'city'>): number | null {
  const p = splitDate(event.trip_date);
  if (!p) return null;
  const { hours, minutes } = extractStartTimeFromSlot(event.time_slot);
  return Date.UTC(p[0], p[1] - 1, p[2], hours - cityUtcOffset(event.city), minutes);
}

export interface TimeSlotParts {
  /** Giờ bắt đầu 'HH:MM' */
  start: string;
  /** Phần sau dấu gạch, dạng 'đến 07:35 (12/12)' */
  rest: string;
  /** Giờ kết thúc 'HH:MM', rỗng nếu khung giờ chỉ có một mốc */
  end: string;
  /** Ghi chú sau giờ kết thúc, thường là ngày khi qua đêm ('12/12') */
  endNote: string;
  /** Độ dài khung giờ: '1 giờ 50 phút'; rỗng khi không tính chắc được */
  duration: string;
}

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h} giờ ${m} phút`;
  return h ? `${h} giờ` : `${m} phút`;
}

/** Tách khung giờ '19:15 - 07:35 (12/12)' thành giờ bắt đầu, giờ kết thúc, ghi chú ngày và độ dài */
export function splitTimeSlot(timeSlot?: string | null): TimeSlotParts {
  const raw = (timeSlot || '').trim();
  const first = raw.match(/(\d{1,2})[:hH.](\d{2})/);
  if (!first) return { start: raw, rest: '', end: '', endNote: '', duration: '' };
  const start = `${first[1].padStart(2, '0')}:${first[2]}`;
  const dash = raw.search(/\s[-–]\s|-(?=\s*\d)/);
  const restRaw = dash >= 0 ? raw.slice(dash).replace(/^\s*[-–]\s*/, '').trim() : '';

  const second = restRaw.match(/^(\d{1,2})[:hH.](\d{2})\s*(.*)$/);
  const end = second ? `${second[1].padStart(2, '0')}:${second[2]}` : '';
  const endNote = second ? second[3].replace(/^\(|\)$/g, '').trim() : '';

  // Kết thúc sớm hơn bắt đầu: qua đêm sang hôm sau. Có ghi chú ngày mà giờ không lùi thì không đoán được số ngày
  let duration = '';
  if (end) {
    const diff = Number(second![1]) * 60 + Number(second![2]) - (Number(first[1]) * 60 + Number(first[2]));
    if (diff > 0 && !endNote) duration = formatMinutes(diff);
    else if (diff < 0) duration = formatMinutes(diff + 24 * 60);
  }

  return { start, rest: restRaw ? `đến ${restRaw}` : '', end, endNote, duration };
}

export function categoryLabel(tag?: string | null): string {
  switch (tag?.toUpperCase()) {
    case 'TRANSIT':
      return 'Tàu, di chuyển';
    case 'FOOD':
      return 'Ẩm thực';
    case 'SIGHTSEEING':
      return 'Danh thắng';
    case 'HOTEL':
      return 'Nghỉ ngơi';
    case 'PHOTOGRAPHY':
      return 'Chụp ảnh';
    default:
      return tag || 'Lịch trình';
  }
}

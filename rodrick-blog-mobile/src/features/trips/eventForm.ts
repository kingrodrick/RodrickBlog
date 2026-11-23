import { eventType, hhmm } from './eventCategory';
import { DetailEvent } from './types';
import type { EventType } from '../../theme/colors';

export type EventForm = {
  locationName: string;
  /** 'HH:MM' */
  startTime: string;
  /** 'HH:MM', trống nếu không có giờ kết thúc. */
  endTime: string;
  /** 'dd/mm/yyyy' */
  date: string;
  city: string;
  category: EventType;
  notes: string;
};

export type EventFormErrors = Partial<Record<'locationName' | 'startTime' | 'endTime' | 'date', string>>;

/** Loại mốc chọn trong form và mã category_tag ghi vào DB (khớp bản web). */
export const CATEGORY_OPTIONS: { type: EventType; tag: string }[] = [
  { type: 'transit', tag: 'TRANSIT' },
  { type: 'food', tag: 'FOOD' },
  { type: 'sight', tag: 'SIGHTSEEING' },
  { type: 'rest', tag: 'HOTEL' },
  { type: 'photo', tag: 'PHOTO' },
];

const pad = (n: number) => String(n).padStart(2, '0');

export function isoToVn(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** 'dd/mm/yyyy' sang 'yyyy-mm-dd'; null nếu không hợp lệ (kể cả ngày không tồn tại như 31/02). */
export function vnToIso(vn: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(vn.trim());
  if (!m) {
    return null;
  }
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    return null;
  }
  return `${y}-${pad(mo)}-${pad(d)}`;
}

/** Chấp nhận '8:30', '08:30', '0830'-không; trả 'HH:MM' hoặc null. */
export function normalizeTime(t: string): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) {
    return null;
  }
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h > 23 || min > 59 ? null : `${pad(h)}:${pad(min)}`;
}

export function formFromEvent(e: DetailEvent): EventForm {
  return {
    locationName: e.location_name,
    startTime: hhmm(e.start_time) ?? '',
    endTime: hhmm(e.end_time) ?? '',
    date: isoToVn(e.trip_date),
    city: e.city,
    category: eventType(e.category_tag),
    notes: e.notes ?? '',
  };
}

export function validateEventForm(f: EventForm): EventFormErrors {
  const errors: EventFormErrors = {};
  if (!f.locationName.trim()) {
    errors.locationName = 'Cần nhập tên địa điểm.';
  }
  if (!normalizeTime(f.startTime)) {
    errors.startTime = 'Giờ dạng 08:30.';
  }
  if (f.endTime.trim() && !normalizeTime(f.endTime)) {
    errors.endTime = 'Giờ dạng 10:30.';
  }
  if (!vnToIso(f.date)) {
    errors.date = 'Ngày dạng 14/12/2026.';
  }
  return errors;
}

/** Chuỗi time_slot hiển thị dự phòng, cùng quy ước với formatTimeSlotRange của web. */
export function timeSlotText(start: string, end: string | null, isoDate: string, overnight: boolean): string {
  if (!end) {
    return start;
  }
  if (overnight) {
    const [y, m, d] = isoDate.split('-').map(Number);
    const a = new Date(y, m - 1, d);
    const b = new Date(y, m - 1, d + 1);
    return `${start} (${a.getDate()}/${a.getMonth() + 1}) - ${end} (${b.getDate()}/${b.getMonth() + 1})`;
  }
  return `${start} - ${end}`;
}

/** Số thứ tự ngày theo danh sách ngày có mốc (giống calculateDayNumberFromDates của web). */
export function dayNumberOf(isoDate: string, allDates: string[]): number {
  const sorted = [...new Set([...allDates, isoDate])].sort();
  return sorted.indexOf(isoDate) + 1;
}

export type EventPatch = {
  location_name: string;
  city: string;
  category_tag: string;
  notes: string | null;
  trip_date: string;
  day_number: number;
  start_time: string;
  end_time: string | null;
  end_day_offset: number;
  time_slot: string;
};

/**
 * Dữ liệu ghi cột của timeline_events. `otherDates`: ngày của các mốc khác trong chuyến.
 * Không gửi map_embed_url (web đã tắt bản đồ, gửi sẽ ghi đè dữ liệu cũ).
 */
export function buildEventPatch(f: EventForm, original: DetailEvent, otherDates: string[]): EventPatch {
  const start = normalizeTime(f.startTime);
  const iso = vnToIso(f.date);
  if (!start || !iso) {
    throw new Error('Thông tin mốc chưa hợp lệ.');
  }
  const end = f.endTime.trim() ? normalizeTime(f.endTime) : null;
  const overnight = end !== null && end < start;
  const keepTag = eventType(original.category_tag) === f.category;
  const tag = keepTag
    ? original.category_tag
    : CATEGORY_OPTIONS.find(o => o.type === f.category)?.tag ?? 'PHOTO';
  const notes = f.notes.replace(/\s+$/, '');
  return {
    location_name: f.locationName.trim(),
    city: f.city.trim() || original.city,
    category_tag: tag,
    notes: notes === '' ? null : notes,
    trip_date: iso,
    day_number: dayNumberOf(iso, otherDates),
    start_time: `${start}:00`,
    end_time: end ? `${end}:00` : null,
    end_day_offset: overnight ? 1 : 0,
    time_slot: timeSlotText(start, end, iso, overnight),
  };
}

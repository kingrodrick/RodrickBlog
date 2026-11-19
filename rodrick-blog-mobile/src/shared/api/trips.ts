import { cloudinaryUrl } from '../utils/cloudinary';
import { selectRows } from './supabase';

/**
 * Dữ liệu chuyến đi dùng chung cho home và trips.
 * Bảng `trips` -> `timeline_events` -> `images`, cùng schema với bản web (types/database.type.ts).
 */

export type TripStatus = 'planning' | 'ongoing' | 'completed';

export type TripEvent = {
  id: string;
  title: string;
  at: string; // yyyy-mm-ddThh:mm
};

export type Trip = {
  id: string;
  slug: string;
  title: string;
  status: TripStatus;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  places: string[];
  coverUrl?: string;
  /** Đã sắp theo giờ; mốc đầu tiên = events[0]. */
  events: TripEvent[];
};

type DbImage = { cloudinary_url: string; is_real_photo: boolean | null };

type DbEvent = {
  id: number;
  day_number: number;
  trip_date: string;
  /** 'HH:MM:SS', cột có cấu trúc; trống thì rơi về time_slot. */
  start_time: string | null;
  time_slot: string | null;
  location_name: string;
  images?: DbImage[];
};

type DbTrip = {
  id: number;
  slug: string;
  title: string;
  cover_image: string | null;
  start_date: string;
  end_date: string;
  cities: string | null;
  status: string;
  timeline_events?: DbEvent[];
};

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Giờ bắt đầu từ time_slot tự do ("08:30 - 10:30", "09h15", "Chiều 3:45"...),
 * cùng quy tắc với extractStartTimeFromSlot của bản web.
 */
export function slotStartTime(slot?: string | null): string {
  if (!slot) {
    return '00:00';
  }
  const s = slot.trim().toLowerCase();
  const isPM = s.includes('chiều') || s.includes('tối') || s.includes('pm');
  const isAM = s.includes('sáng') || s.includes('am');
  const m =
    s.match(/(\d{1,2})[:hH.](\d{2})/) ||
    s.match(/(\d{1,2})\s*[:hH]/) ||
    s.match(/\b(\d{1,2})\b/);
  if (!m) {
    return '00:00';
  }
  let h = parseInt(m[1], 10) || 0;
  const min = m[2] ? parseInt(m[2], 10) || 0 : 0;
  if (isPM && h < 12) {
    h += 12;
  } else if (isAM && h === 12) {
    h = 0;
  }
  return `${pad(Math.min(23, Math.max(0, h)))}:${pad(
    Math.min(59, Math.max(0, min)),
  )}`;
}

function toStatus(s: string): TripStatus {
  const v = s?.toLowerCase();
  return v === 'ongoing' || v === 'completed' ? v : 'planning';
}

function toTrip(row: DbTrip): Trip {
  const rawEvents = row.timeline_events ?? [];
  const events = rawEvents
    .map(e => ({
      e,
      at: `${e.trip_date.slice(0, 10)}T${
        e.start_time ? e.start_time.slice(0, 5) : slotStartTime(e.time_slot)
      }`,
    }))
    .sort(
      (a, b) =>
        a.at.localeCompare(b.at) ||
        a.e.day_number - b.e.day_number ||
        a.e.id - b.e.id,
    )
    .map(({ e, at }) => ({ id: String(e.id), title: e.location_name, at }));

  // Ảnh bìa: cover_image, nếu trống thì ảnh thật đầu tiên trong các mốc.
  const firstPhoto = rawEvents
    .flatMap(e => e.images ?? [])
    .find(img => img.is_real_photo !== false)?.cloudinary_url;
  const cover = row.cover_image || firstPhoto;

  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    status: toStatus(row.status),
    startDate: row.start_date.slice(0, 10),
    endDate: row.end_date.slice(0, 10),
    places: (row.cities ?? '')
      .split(/[,•]/)
      .map(c => c.trim())
      .filter(Boolean),
    coverUrl: cover ? cloudinaryUrl(cover) : undefined,
    events,
  };
}

export async function fetchTrips(): Promise<Trip[]> {
  const rows = await selectRows<DbTrip>(
    'trips',
    'select=id,slug,title,cover_image,start_date,end_date,cities,status,' +
      'timeline_events(id,day_number,trip_date,start_time,time_slot,location_name,images(cloudinary_url,is_real_photo))' +
      '&order=start_date.desc',
  );
  return rows.map(toTrip);
}

import { updateRows } from '../../../shared/api/supabase';
import { dayNumberOf, EventPatch } from '../eventForm';
import { DetailEvent } from '../types';

/**
 * Ghi thay đổi của một mốc. Khi đổi ngày, đánh số lại day_number cho các mốc khác của chuyến
 * (giống web) để thứ tự "Ngày N" không lệch.
 */
export async function saveEvent(eventId: number, patch: EventPatch, siblings: DetailEvent[]): Promise<void> {
  await updateRows('timeline_events', `id=eq.${eventId}`, patch);

  const others = siblings.filter(e => e.id !== eventId);
  const dates = [...others.map(e => e.trip_date), patch.trip_date];
  for (const e of others) {
    const n = dayNumberOf(e.trip_date, dates);
    if (n !== e.day_number) {
      await updateRows('timeline_events', `id=eq.${e.id}`, { day_number: n });
    }
  }
}

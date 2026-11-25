import { selectRows } from '../../../shared/api/supabase';

/** Một bộ sưu tập để gán ảnh mới tải lên mốc. */
export type CollectionOption = { id: number; title: string };

export type CollectionChoices = {
  /** Bộ của chuyến đi chứa mốc đứng trước, rồi theo thứ tự hiển thị. */
  options: CollectionOption[];
  /** Chọn sẵn: bộ sưu tập duy nhất đã gán cho chuyến của mốc; không có hoặc nhiều bộ thì null. */
  suggestedId: number | null;
};

type DbCollection = { id: number; title: string; trip_id: number | null };

/**
 * Danh sách bộ sưu tập kèm gợi ý cho ảnh của một mốc. Mốc trong app không mang trip_id
 * nên đọc thêm từ timeline_events (hai lệnh chạy song song).
 */
export async function fetchCollectionChoices(eventId: number): Promise<CollectionChoices> {
  const [collections, events] = await Promise.all([
    selectRows<DbCollection>('collections', 'select=id,title,trip_id&order=display_order.asc'),
    selectRows<{ trip_id: number | null }>('timeline_events', `select=trip_id&id=eq.${eventId}&limit=1`),
  ]);
  const tripId = events[0]?.trip_id ?? null;
  const ofTrip = collections.filter(c => tripId !== null && c.trip_id === tripId);
  const others = collections.filter(c => !ofTrip.includes(c));
  return {
    options: [...ofTrip, ...others].map(c => ({ id: c.id, title: c.title })),
    suggestedId: ofTrip.length === 1 ? ofTrip[0].id : null,
  };
}

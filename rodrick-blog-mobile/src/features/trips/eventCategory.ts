import type { EventType } from '../../theme/colors';
import { DetailEvent, EventCategory } from './types';

/** Mã category_tag sang loại mốc (màu chấm lấy ở colors.eventType). Mã lạ rơi về Chụp ảnh. */
export function eventType(tag: EventCategory): EventType {
  switch (tag?.toUpperCase()) {
    case 'TRANSIT':
      return 'transit';
    case 'FOOD':
    case 'RESTAURANT':
      return 'food';
    case 'SIGHTSEEING':
      return 'sight';
    case 'HOTEL':
      return 'rest';
    default:
      return 'photo';
  }
}

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  transit: 'Di chuyển',
  food: 'Ẩm thực',
  sight: 'Danh thắng',
  rest: 'Nghỉ ngơi',
  photo: 'Chụp ảnh',
};

/**
 * Chuyến bay: không có bản ghi bản đồ và không dùng link tìm kiếm dự phòng.
 * DB chưa có cờ riêng nên nhận theo giấy tờ FLIGHT hoặc tên dạng "Sân bay A -> Sân bay B".
 */
export function isFlight(e: DetailEvent): boolean {
  return (
    e.documents.some(d => d.type === 'FLIGHT') ||
    /(sân bay|airport).*(->|→).*(sân bay|airport)/i.test(e.location_name)
  );
}

/** 'HH:MM:SS' sang 'HH:MM'. */
export const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);

/** Giờ bắt đầu và kết thúc để hiển thị; không có end_time thì end = null. */
export function eventTimes(e: DetailEvent): { start: string; end: string | null } {
  return { start: hhmm(e.start_time) ?? e.time_slot, end: hhmm(e.end_time) };
}

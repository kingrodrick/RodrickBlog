import { TimelineEvent } from '@/types/database.type';

/**
 * Trích xuất giờ và phút bắt đầu từ chuỗi time_slot tự do
 * Hỗ trợ các định dạng:
 * - "08:30 - 10:30" => { hours: 8, minutes: 30 }
 * - "8:30" => { hours: 8, minutes: 30 }
 * - "14:00" => { hours: 14, minutes: 0 }
 * - "09h15" => { hours: 9, minutes: 15 }
 * - "20:00 - 08:30" => { hours: 20, minutes: 0 }
 * - "20:00 (11/12) - 08:30 (12/12)" => { hours: 20, minutes: 0 }
 * - "Sáng 07:30" => { hours: 7, minutes: 30 }
 * - "Chiều 15:45" => { hours: 15, minutes: 45 }
 */
export function extractStartTimeFromSlot(timeSlot?: string | null): { hours: number; minutes: number } {
  if (!timeSlot) return { hours: 0, minutes: 0 };

  const cleaned = timeSlot.trim().toLowerCase();

  // Kiểm tra từ khóa buổi nếu không có số 24h
  const isPM = cleaned.includes('chiều') || cleaned.includes('tối') || cleaned.includes('pm');
  const isAM = cleaned.includes('sáng') || cleaned.includes('am');

  // Tìm mẫu thời gian đầu tiên dạng: "HH:MM", "H:MM", "HHhMM", "HhMM" hoặc số đứng riêng
  const match =
    cleaned.match(/(\d{1,2})[:hH.](\d{2})/) ||
    cleaned.match(/(\d{1,2})\s*[:hH]/) ||
    cleaned.match(/\b(\d{1,2})\b/);

  if (!match) return { hours: 0, minutes: 0 };

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;

  if (isNaN(hours)) hours = 0;

  // Điều chỉnh 12h -> 24h nếu có chỉ dẫn AM/PM rõ ràng
  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  return {
    hours: Math.min(23, Math.max(0, hours)),
    minutes: Math.min(59, Math.max(0, isNaN(minutes) ? 0 : minutes)),
  };
}

/**
 * Phân tích chuỗi time_slot thành cấu trúc giờ bắt đầu, kết thúc và chặng qua đêm
 */
export function parseTimeSlotRange(timeSlot?: string | null): {
  startTime: string;
  endTime: string;
  isOvernight: boolean;
} {
  if (!timeSlot) {
    return { startTime: '09:00', endTime: '11:00', isOvernight: false };
  }

  const matches = Array.from(timeSlot.matchAll(/(\d{1,2})[:hH.](\d{2})/g));
  if (matches.length >= 2) {
    const startH = matches[0][1].padStart(2, '0');
    const startM = matches[0][2];
    const endH = matches[1][1].padStart(2, '0');
    const endM = matches[1][2];

    const startTime = `${startH}:${startM}`;
    const endTime = `${endH}:${endM}`;
    // Qua đêm khi có '+1' hoặc giờ kết thúc sớm hơn giờ bắt đầu. Không dựa vào dấu '(' vì
    // nhãn ngày '(12/12)' có cả ở khung giờ trong ngày, mở ra lưu lại sẽ bị đẩy sang hôm sau
    const isOvernight = timeSlot.includes('+1') || startTime > endTime;

    return { startTime, endTime, isOvernight };
  } else if (matches.length === 1) {
    const startH = matches[0][1].padStart(2, '0');
    const startM = matches[0][2];
    return { startTime: `${startH}:${startM}`, endTime: '', isOvernight: false };
  }

  return { startTime: '09:00', endTime: '11:00', isOvernight: false };
}

/**
 * Format khoảng thời gian thành chuỗi chuẩn hóa hiển thị và lưu DB
 */
export function formatTimeSlotRange(
  startTime: string,
  endTime: string,
  startDate?: string,
  isOvernight?: boolean
): string {
  if (!startTime) return '';
  if (!endTime) return startTime;

  if (isOvernight && startDate) {
    const parts = startDate.split('-').map(Number);
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const startD = new Date(year, month - 1, day);
      const nextD = new Date(year, month - 1, day + 1);

      const startLabel = `${startD.getDate()}/${startD.getMonth() + 1}`;
      const endLabel = `${nextD.getDate()}/${nextD.getMonth() + 1}`;

      return `${startTime} (${startLabel}) - ${endTime} (${endLabel})`;
    }
    return `${startTime} - ${endTime} (+1 ngày)`;
  }

  if (isOvernight) {
    return `${startTime} - ${endTime} (+1 ngày)`;
  }

  return `${startTime} - ${endTime}`;
}

/**
 * Tính toán số thứ tự ngày (day_number) chuẩn xác từ ngày thực tế
 * Tự động xếp các ngày theo thứ tự từ sớm nhất đến muộn nhất
 */
export function calculateDayNumberFromDates(
  selectedDate: string,
  existingDates: string[]
): number {
  if (!selectedDate) return 1;

  const dateSet = new Set(existingDates.filter(Boolean));
  dateSet.add(selectedDate);

  const sortedDates = Array.from(dateSet).sort();
  const index = sortedDates.indexOf(selectedDate);
  return index >= 0 ? index + 1 : 1;
}

/**
 * So sánh 2 mốc sự kiện theo thứ tự thời gian chuẩn xác
 * 1. Ưu tiên ngày thực tế (trip_date: "2026-12-11" < "2026-12-12")
 * 2. Tiếp theo là số thứ tự ngày (day_number: 1 < 2)
 * 3. Tiếp theo là giờ bắt đầu (hours, minutes)
 * 4. Nếu bằng nhau, ổn định theo ID
 */
export function compareTimelineEventsChronologically(a: TimelineEvent, b: TimelineEvent): number {
  // 1. So sánh ngày thực tế nếu có (trip_date: YYYY-MM-DD)
  if (a.trip_date && b.trip_date && a.trip_date !== b.trip_date) {
    return a.trip_date.localeCompare(b.trip_date);
  }

  // 2. So sánh ngày thứ mấy (day_number)
  if (a.day_number !== b.day_number) {
    return a.day_number - b.day_number;
  }

  // 3. So sánh giờ bắt đầu trích xuất từ time_slot
  const timeA = extractStartTimeFromSlot(a.time_slot);
  const timeB = extractStartTimeFromSlot(b.time_slot);

  if (timeA.hours !== timeB.hours) {
    return timeA.hours - timeB.hours;
  }
  if (timeA.minutes !== timeB.minutes) {
    return timeA.minutes - timeB.minutes;
  }

  // 4. Nếu giờ giống nhau, so sánh chuỗi time_slot thô
  if (a.time_slot && b.time_slot && a.time_slot !== b.time_slot) {
    return a.time_slot.localeCompare(b.time_slot);
  }

  // 5. Fallback id
  return (a.id || 0) - (b.id || 0);
}

/**
 * Sắp xếp danh sách sự kiện theo thứ tự thời gian
 */
export function sortTimelineEvents(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort(compareTimelineEventsChronologically);
}

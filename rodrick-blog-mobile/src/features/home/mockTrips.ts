import { Trip } from './types';

/**
 * Thử trạng thái "Đang diễn ra": đổi `status` của chuyến dưới đây thành 'ongoing'.
 * Sự kiện kế tiếp là mốc đầu tiên chưa tới giờ theo đồng hồ máy, nên trước 19:15 ngày
 * 11/12/2026 sẽ là "Sân bay Nội Bài"; để thấy "Tham quan chùa Kiyomizu-dera" (14:00 13/12),
 * đặt giờ máy trong khoảng 11/12 19:15 - 13/12 14:00, hoặc tạm xoá mốc Nội Bài.
 */
export const MOCK_TRIPS: Trip[] = [
  {
    id: 'nhat-ban-thang-12-2026',
    title: 'Kế hoạch chuyến đi Nhật Bản',
    status: 'planning',
    startDate: '2026-12-11',
    endDate: '2026-12-18',
    places: ['Tokyo', 'Kyoto'],
    events: [
      { id: 'noi-bai', title: 'Sân bay Nội Bài', at: '2026-12-11T19:15' },
      {
        id: 'kiyomizu',
        title: 'Tham quan chùa Kiyomizu-dera',
        at: '2026-12-13T14:00',
      },
    ],
  },
];

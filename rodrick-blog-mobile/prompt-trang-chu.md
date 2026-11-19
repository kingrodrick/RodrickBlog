# Prompt cho Claude Code: dựng lại Trang chủ

Dán nguyên khối dưới đây vào Claude Code (chạy trong thư mục `rodrick-blog-mobile`).

---

Đọc `CLAUDE.md` của dự án trước. Sau đó dựng lại màn Trang chủ (`src/features/home`) theo thiết kế đã duyệt dưới đây. Làm trực tiếp trên nhánh `main`, không tạo nhánh. Không thêm thư viện ngoài danh sách trong CLAUDE.md. Chạy `npx tsc --noEmit` và `npm run lint` sau khi xong và báo kết quả. Không sửa file ngoài phạm vi này. Mockup tham chiếu: https://claude.ai/artifact/5HhG8811CRtpuLh8yjwTVL (khung sáng = chuyến sắp tới, khung tối = chuyến đang diễn ra).

## Màn hình mục tiêu
Máy chuẩn Galaxy S25 Ultra: viewport 412 × 915 dp. Toàn bộ nội dung Trang chủ (tiêu đề + thân) nằm trong một `ScrollView` dọc, cuộn khi dài. Footer 4 icon giữ nguyên, cố định, không nằm trong phần cuộn. Mọi khối trong phần cuộn không được co lại (không để thẻ bị cắt). Kiểm tra `Screen` hiện có: nếu `Screen` đã bọc ScrollView thì dùng nó, nếu chưa thì chỉnh trong phạm vi Trang chủ.

Dùng đúng token và component trong `shared/ui` và `theme`. Không viền, không bóng, thẻ nổi bằng bước tông màu. Không dùng icon đi kèm chữ. Icon duy nhất ở màn này là mũi tên `>` (lucide `ChevronRight`, cỡ 22, nét 1.75) đứng một mình ở mép phải thẻ, có `accessibilityLabel`, vùng chạm tối thiểu 44x44. Không có dấu gạch ngang dài trong chữ hiển thị, dùng "-" hoặc "•".

## Bố cục từ trên xuống

1. **Tiêu đề**: chữ `display` "Welcome, Sir". Bên dưới là `caption` màu chữ phụ: "Thứ Năm, 19/11/2026 · 09:51" (thứ tiếng Việt, ngày dd/mm/yyyy, giờ HH:mm). Cập nhật mỗi phút.

2. **Hàng trạng thái chuyến gần nhất** (kiểu overline: 12/16, chữ hoa, 600, giãn chữ 0.6):
   - Trái: "Sắp tới" (màu chữ phụ) nếu chuyến `planning`, hoặc "Đang diễn ra" (màu nhấn) nếu `ongoing`.
   - Phải: nếu `planning` thì đếm ngược tới mốc đầu tiên của chuyến, định dạng "22 ngày 09:09:00", cập nhật mỗi giây, màu nhấn, `tabular-nums`, 13/18, không viết hoa. Nếu `ongoing` thì "Ngày 3/8" (ngày thứ mấy / tổng số ngày).
   - Không có chữ "Chuyến đi gần nhất". Không có huy hiệu trạng thái trong thẻ.

3. **Thẻ chuyến gần nhất** (`Card`, bo 16, `overflow: hidden`, bấm được → màn chi tiết chuyến `TripDetailScreen` nếu đã có, chưa có thì để `onPress` trống kèm TODO). Chia 3 phần, thứ tự:
   1. Ảnh bìa cao 210 (nền `surfaceMuted` + chữ "Ảnh bìa chuyến đi" khi chưa có `coverUrl`).
   2. Tên hành trình (`heading` 18/24) và dòng ngày `caption`: chỉ "11/12/2026 – 18/12/2026" (ngày bắt đầu và kết thúc, không địa điểm, không số ngày đêm). Đệm 16, khe 8.
   3. **Sự kiện sắp tới** (chỉ hiện khi chuyến `ongoing` và có sự kiện kế tiếp): trải kín chiều ngang thẻ, nền `surfaceMuted` (đổi một bước tông so với phần 2), đệm 16, bố cục hàng. Bên trái xếp dọc: caption "Sự kiện sắp tới", tên sự kiện (heading cỡ 16/22), caption "Dự kiến 14:00, 13/12", đếm ngược "03:54:00" (HH:MM:SS, 20/26, màu nhấn, `tabular-nums`, cập nhật mỗi giây). Bên phải: nút `>`. Bấm nút (hoặc cả phần 3) điều hướng tới `EventDetailScreen` của sự kiện đó (chưa có màn thì để TODO, không tự dựng).
   - Chuyến `planning` chỉ có phần 1 và 2.

4. **Thẻ "Danh sách chuyến đi"** (`Card`, đệm 16, bố cục hàng, cả thẻ bấm được): trái là `heading` "Danh sách chuyến đi" và `caption` "Tổng N chuyến"; phải là nút `>`. Bấm chuyển sang màn mới `TripsListScreen` (xem bên dưới).

5. **Bộ sưu tập ảnh**: overline "Bộ sưu tập ảnh", rồi dải album cuộn ngang (`FlatList` ngang, ẩn thanh cuộn, lề ngang 20 giống màn, khe 12). Mỗi album: ảnh bìa 150 x 190, bo 16, nền `surfaceMuted` khi chưa có ảnh (album ảnh tham khảo dùng nền/nhãn giấy vàng theo token "Ảnh tham khảo"), tên album bên dưới (label 14/20 600). Thẻ cuối là "Xem tất cả" (cùng kích thước, nền `surface`, chữ giữa) → chuyển sang tab Ảnh. Không có album thì dùng `EmptyState`.

## Chọn "chuyến gần nhất"
Ưu tiên chuyến `ongoing`. Nếu không có, lấy chuyến `planning` có `startDate` sớm nhất mà chưa qua. Không có chuyến nào thì hiện `EmptyState` "Chưa có chuyến đi nào sắp tới.". Viết hàm thuần `pickNearestTrip(trips, now)` trong `src/features/home/` và có thể test.

## Dữ liệu và kiểu
- Mở rộng `src/features/home/types.ts`: thêm `TripEvent = { id: string; title: string; at: string }` (at: `yyyy-mm-ddThh:mm`), đổi `Trip.firstEvent` thành `events: TripEvent[]` (đã sắp theo giờ; mốc đầu tiên = `events[0]`), thêm `Album = { id: string; title: string; coverUrl?: string; kind: 'real' | 'reference' }`.
- `mockTrips.ts`: giữ chuyến Nhật Bản `planning` (11/12/2026 - 18/12/2026, `events[0]` = 19:15 ngày 11/12 "Sân bay Nội Bài") và thêm kèm chú thích cách đổi `status` thành `ongoing` để thử, với sự kiện kế tiếp "Tham quan chùa Kiyomizu-dera" 14:00 ngày 13/12. Thêm `mockAlbums.ts` với 2 album mẫu ("Nhật Bản 2026" kind real, "Tham khảo Kyoto" kind reference).
- Thời gian: tạo hook `useNow(intervalMs)` trong `src/shared/hooks/` (dọn interval khi unmount). Dùng `useNow(1000)` cho đếm ngược, `useNow(60000)` cho dòng ngày giờ.
- `src/shared/utils/format.ts`: thêm `formatDateRange` kiểu "11/12/2026 – 18/12/2026", `formatWeekdayDateTime(now)` ("Thứ Năm, 19/11/2026 · 09:51"), `formatCountdownDays(ms)` ("22 ngày 09:09:00") và `formatCountdownHms(ms)` ("03:54:00"). Giữ `formatTimeDate` ("14:00, 13/12") cho dòng "Dự kiến". Đếm ngược không âm (chạm 0 thì dừng ở 0).

## Điều hướng
- Thêm màn `TripsListScreen` vào `src/features/trips/screens/` (chuyển danh sách "Sắp tới" và "Đã đi" hiện có ở `HomeScreen` sang đây, dùng lại `TripCard` theo thiết kế cũ) và đăng ký route trong stack trên tab Trang chủ (`RootNavigator`/`type.ts`), có header với nút quay lại dạng `IconButton`.
- "Xem tất cả" ở dải album chuyển sang tab Ảnh trong `MainTabs`.
- Footer 4 icon giữ nguyên.

## Nghiệm thu
- `npx tsc --noEmit` và `npm run lint` sạch.
- Trang chủ cuộn mượt khi nội dung dài, không khối nào bị cắt.
- Chuyến `planning`: nhãn "Sắp tới", đếm ngược ngày chạy từng giây, thẻ chỉ 2 phần.
- Chuyến `ongoing`: nhãn "Đang diễn ra", "Ngày x/y", thẻ 3 phần với sự kiện sắp tới và đếm ngược giờ.
- Giao diện sáng và tối đều đúng token. Mỗi nút `>` có `accessibilityLabel` và vùng chạm 44x44.
- Cuối cùng liệt kê file đã tạo/sửa và các TODO còn để lại (chi tiết chuyến, chi tiết sự kiện).

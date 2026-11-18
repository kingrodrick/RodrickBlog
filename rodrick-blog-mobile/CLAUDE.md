# CLAUDE.md — Rodrick Mobile

App di động (React Native CLI thuần, KHÔNG Expo) cho blog ảnh/du lịch Next.js của chủ dự án. Chức năng: đăng nhập, danh sách chuyến đi, chi tiết chuyến (timeline mốc), ảnh thật/ảnh tham khảo, giấy tờ, mở Google Maps.

## Cách làm việc với chủ dự án
- Giao tiếp bằng tiếng Việt, gọi chủ dự án là "sir", xưng "tôi". Ngắn gọn, thẳng vào việc.
- Thiết kế duyệt trước, code sau. Không tự thêm màn hình, component hay thư viện ngoài danh sách dưới đây; cần thêm thì hỏi.
- Chủ dự án tự làm tay từng bước: mỗi lần chỉ đề xuất một bước nhỏ, chờ kết quả rồi mới sang bước tiếp.
- Làm trực tiếp trên nhánh `main`, không tạo nhánh, không PR.
- Chạy `npx tsc --noEmit` sau mỗi thay đổi; không sửa file ngoài phạm vi yêu cầu.

## Nguồn thiết kế (đọc trước khi viết UI)
- Canvas thiết kế (màn hình + nền tảng + component, sáng/tối): https://claude.ai/artifact/WQTtcPWhH5USR4RwML8wYh
- Tài liệu art direction: https://claude.ai/artifact/Qv7m7QVnztKfSAcVrE2ACb
Mọi giá trị dưới đây lấy từ hai nguồn này; nếu lệch thì canvas thắng.

## Công nghệ
React Native CLI, TypeScript, React Navigation (native-stack + bottom-tabs), react-native-safe-area-context, react-native-screens, react-native-svg, lucide-react-native (icon), react-native-reanimated, react-native-keychain (lưu phiên), react-native-bootsplash, `Linking` mở Google Maps. Không dùng Expo, không dùng thư viện UI dựng sẵn.

## Cấu trúc thư mục
```
src/
  features/
    auth/ home/ trips/ galleries/ settings/
      (mỗi feature gồm: screens/ components/ hooks/ api/ types.ts index.ts)
  shared/   ui/ (nút, toast, icon, ô nhập), hooks/, utils/, api/
  theme/    màu, chữ, khoảng cách
  navigation/  tab + stack
```
Màn hình chỉ ghép component từ `shared/ui` (và component của chính feature), không tự viết style màu/cỡ riêng.

### Quy tắc tổ chức feature
- Mỗi feature tự chứa màn hình, component, hook và API của riêng nó.
- Feature không import chéo nhau; chỉ dùng chung qua `shared/` và `theme/`.
- Bên ngoài chỉ import feature qua `index.ts` của nó.
- Chỉ đưa code vào `shared/` khi có từ 2 feature trở lên dùng.
- Các UI element cơ bản (nút, toast, icon...) nằm ở `shared/ui`, theo đúng token và đặc tả đã có trong file này.

## Quy tắc thiết kế đã chốt (bắt buộc)
1. Font hệ thống (San Francisco / Roboto), không nhúng font. Không dùng `fontFamily` tuỳ chỉnh.
2. Bo góc: nhãn 8, nút/ô nhập 12, thẻ/vé 16, hộp thoại/sheet 24, chip/nút icon tròn (pill).
3. Không dùng icon đi kèm chữ. Icon chỉ đứng một mình (nút icon, footer) và chỉ khi cần thu gọn. Ngoại lệ duy nhất: icon trạng thái trong toast/cảnh báo.
4. Bố cục mọi màn: header (tiêu đề) / body (nội dung cuộn) / footer (4 icon điều hướng: Trang chủ, Giấy tờ, Ảnh, Cài đặt). Màn đăng nhập không có footer.
5. Không viền, không bóng. Thẻ nổi lên bằng bước tông màu so với nền.
6. Một màu nhấn duy nhất: Torii #b61c25.
7. Giấy tờ, ảnh, bản đồ gắn theo từng mốc (event) ở màn chi tiết mốc. Tab Giấy tờ/Ảnh là tổng hợp mọi thứ. Bản đồ không nhúng: nút "Chỉ đường" mở app Google Maps.
8. Bảng giấy tờ chưa có trên server: tab Giấy tờ hiện trạng thái trống ở giai đoạn đầu.
9. Vùng chạm tối thiểu 44×44pt. Mọi nút icon có `accessibilityLabel`.

## Token màu
| Vai trò | Sáng | Tối |
|---|---|---|
| Nền màn hình | #e8e6e1 | #171412 |
| Bề mặt (thẻ) | #ffffff | #211d1a |
| Bề mặt trầm | #d9d6cf | #2b2622 |
| Bề mặt nổi (toast, nút icon) | #ffffff | #332d29 |
| Chữ chính | #1f1b19 | #f0efec |
| Chữ phụ | #57514b | #a59d95 |
| Chữ mờ | #6b645d | #a59d95 |
| Viền ô nhập | #cfcac2 | #3a332e |
| Nút chính (nền / chữ) | #1f1b19 / #f0efec | #f0efec / #171412 |
| Màu nhấn (chữ, viền focus) | #b61c25 | #ff6b6f |
| Màu nhấn (nền nút nguy hiểm) | #b61c25 | #c42f38 |
| Lỗi | #a3161f | #ff6b6f |
| Ảnh tham khảo (nền / nhãn) | #f4ead6 / #7a5a22 | #2a2318 / #e2c48c |
Chấm loại mốc (sáng / tối): Di chuyển #2d4a7a/#8fadde · Ẩm thực #a0611a/#e0a75e · Danh thắng #b61c25/#ff6b6f · Nghỉ ngơi #4e6b3a/#9cc283 · Chụp ảnh #57514b/#c4bfb6.
Giao diện: theo máy / sáng / tối, chọn ở Cài đặt, lưu cục bộ.

## Token chữ (px)
display 34/40 đậm 700 · title 28/34 đậm 700 · heading 18/24 600 · lead 18/26 · body 16/24 · label 14/20 600 · caption 13/18 · overline 12/16 chữ hoa 600 giãn chữ 0.6.

## Khoảng cách và icon
Bước 4: 4·8·12·16·20·24. Lề màn 20, khe giữa thẻ 12, đệm trong thẻ 16.
Icon Lucide nét 1.75, đầu nét tròn; cỡ 16 (trong dòng chữ), 22 (nút, footer), 32 (trạng thái trống). Mục footer đang chọn: nét 2.25 + nền viên thuốc 64×40.

## Đặc tả component nền tảng
**Button** — kiểu: primary, secondary, danger, link. Cỡ: lg 56 (padding ngang 28), md 48 (24), sm 36 (14); chữ 16/16/14 đậm 600; bo 12. Bị khoá: opacity 0.45. Đang tải: thay chữ bằng ActivityIndicator, giữ nguyên độ rộng. Đang nhấn: tối đi một bước. Link: chữ gạch chân, nền trong suốt. Đứng một mình thì rộng kín chiều ngang.
**IconButton** — tròn 44, icon 22. Biến thể: nền bề mặt, trong suốt, nhấn mạnh (nền nút chính), nguy hiểm (icon màu lỗi). Có chấm báo 10px (đỏ nhấn, viền màu nền) khi có tin mới.
**TextField** — nhãn 14/20 600 ở trên ô; ô cao 48, bo 12, viền 1px; focus viền 2px màu nhấn; lỗi viền 2px màu lỗi + dòng lỗi 13/18 bên dưới; ô mật khẩu có chữ "Hiện/Ẩn" bên phải. Không dùng placeholder làm nhãn.
**Toast** — theo giao diện (sáng: nền #fff, tối: #332d29), bo 16, một dòng 14/20, tối đa một nút chữ màu nhấn, tự tắt sau 3 giây, nổi phía trên footer. Có thể kèm icon trạng thái 22 (thành công/lỗi). `role=status`, lỗi dùng `alert`.
**Alert (cảnh báo trong trang)** — thẻ bề mặt bo 16, thanh màu 4 bên trái + icon 22: thông tin #2d4a7a, thành công #4e6b3a, cảnh báo #a0611a, lỗi #a3161f; tiêu đề 15/20 600 + mô tả 13/18. Không tự tắt.
**Banner ngoại tuyến** — dải bo 12, nền giấy vàng (#f4ead6 / #2a2318), chữ 13/18, nằm sát dưới header.
**Badge** — nhãn trạng thái bo 8, chữ hoa 12/16 600: lên kế hoạch (nền trầm), đang đi (nền nhấn, chữ trắng), hoàn thành (nền nút chính). Số đếm: viên thuốc cao 20, nền nhấn, chữ trắng; tối đa "99+".
**Dialog** — bo 24, đệm 20, tiêu đề 20/26 700, mô tả 15/22, hai nút md ngang nhau (Huỷ bên trái, hành động bên phải; nút đỏ chỉ khi phá huỷ), phủ mờ phía sau.
**Chip / Segmented** — chip cao 40 pill; segmented nền trầm padding 4, mục đang chọn nền bề mặt.
**Skeleton / States** — khối xám bo 8 đúng hình nội dung, nhấp nháy nhẹ; trạng thái trống (vòng ensō + câu nói vì sao trống), lỗi (nút "Thử lại").

## Thứ tự dựng (mỗi mục một lượt, chờ duyệt)
1. Theme: palette, token, ThemeProvider (sáng/tối/theo máy).
2. `shared/ui`, mỗi lượt một nhóm: (a) Text, Button, IconButton, TextField; (b) Toast, Alert, Banner, Dialog, Badge; (c) Card, Ticket, Skeleton, States, Screen (header/body/footer).
3. Navigation: RootNavigator + MainTabs 4 icon.
4. Feature theo thứ tự: auth → home → trips → galleries → settings, dùng dữ liệu mẫu (đặt trong `api/` của từng feature).
5. Nối dữ liệu thật (Supabase) và đăng nhập an toàn: dùng Supabase Auth + react-native-keychain, KHÔNG nhúng thông tin admin cứng vào ứng dụng như bản web.

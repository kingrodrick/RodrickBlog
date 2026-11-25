# CLAUDE.md — Rodrick Mobile

App di động (React Native CLI thuần, KHÔNG Expo) cho blog ảnh/du lịch Next.js của chủ dự án. Chức năng: đăng nhập, danh sách chuyến đi, chi tiết chuyến (timeline mốc), ảnh thật/ảnh tham khảo, tab Ảnh (lưới ảnh, bộ sưu tập, xoá ảnh), giấy tờ, mở Google Maps, công cụ (đổi tiền VND ⇄ Yên, mở Google Dịch).

## Cách làm việc với chủ dự án
- Giao tiếp bằng tiếng Việt, gọi chủ dự án là "sir", xưng "tôi". Ngắn gọn, thẳng vào việc.
- Thiết kế duyệt trước, code sau. Không tự thêm màn hình, component hay thư viện ngoài danh sách dưới đây; cần thêm thì hỏi.
- Chủ dự án tự làm tay từng bước: mỗi lần chỉ đề xuất một bước nhỏ, chờ kết quả rồi mới sang bước tiếp.
- Làm trực tiếp trên nhánh `main`, không tạo nhánh, không PR.
- Chạy `npm run verify` (typecheck + lint + Jest) sau mỗi thay đổi và đọc kết quả thật; không sửa file ngoài phạm vi yêu cầu.

## Nguồn thiết kế (đọc trước khi viết UI)
- Canvas thiết kế (màn hình + nền tảng + component, sáng/tối): https://claude.ai/artifact/WQTtcPWhH5USR4RwML8wYh
- Tài liệu art direction: https://claude.ai/artifact/Qv7m7QVnztKfSAcVrE2ACb
Mọi giá trị dưới đây lấy từ hai nguồn này; nếu lệch thì canvas thắng.

## Công nghệ
React Native CLI, TypeScript, React Navigation (native-stack + bottom-tabs), react-native-safe-area-context, react-native-screens, react-native-svg, lucide-react-native (icon), react-native-reanimated, react-native-keychain (lưu phiên), react-native-bootsplash, react-native-image-picker (chọn ảnh để tải lên Cloudinary), @react-native-documents/picker + @react-native-documents/viewer (chọn và mở giấy tờ PDF/ảnh), @react-native-async-storage/async-storage (kho giấy tờ cục bộ), react-native-webview (trình duyệt tìm ảnh minh họa trên Pinterest/Google), react-native-nitro-share-intent + react-native-nitro-modules (nhận liên kết Google Maps từ nút Chia sẻ, chỉ Android), `Linking` mở Google Maps và Google Dịch. Tỉ giá JPY → VND lấy bằng `fetch` từ open.er-api.com (miễn phí, không cần key), dự phòng currency-api qua CDN jsdelivr; lưu bản gần nhất ở AsyncStorage để dùng khi mất mạng. Không dùng Expo, không dùng thư viện UI dựng sẵn.

## Cấu trúc thư mục
```
src/
  features/
    auth/ home/ trips/ galleries/ settings/ tools/
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
4. Bố cục mọi màn: header (tiêu đề) / body (nội dung cuộn) / footer (5 icon điều hướng: Trang chủ, Chuyến đi, Công cụ, Ảnh, Cài đặt; tab Chuyến đi có stack riêng `TripsStack`, gốc là danh sách chuyến đi, thẻ "Danh sách chuyến đi" ở Trang chủ chuyển sang tab này). Màn đăng nhập không có footer.
5. Không viền, không bóng. Thẻ nổi lên bằng bước tông màu so với nền. Ngoại lệ có chủ đích: ô chọn giao diện ở Cài đặt, ô đang chọn có khung màu nhấn dày 3 bao ngoài (dựng bằng `View` đệm 3 nền màu nhấn, không dùng `borderWidth`).
6. Một màu nhấn duy nhất: Torii #b61c25.
7. Giấy tờ, ảnh, bản đồ gắn theo từng mốc (event) ở màn chi tiết mốc. Tab Ảnh là tổng hợp ảnh; giấy tờ chỉ xem ở màn chi tiết mốc (tab Giấy tờ đã thay bằng tab Công cụ). Bản đồ không nhúng: nút "Chỉ đường" mở app Google Maps.
8. Giấy tờ chỉ lưu trên điện thoại (sao chép vào thư mục riêng của app, thông tin ở AsyncStorage), chỉ xem, không tải lên Cloudinary hay Supabase vì bảo mật. Bảng `documents` trên Supabase không dùng ở mobile.
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
Nền màn: hoa văn sóng seigaiha (`shared/ui/PatternBackground`, `Screen` tự vẽ), viền trắng độ đục 0.85 (sáng) / 0.07 (tối) trên màu nền màn.

## Token chữ (px)
display 34/40 đậm 700 · title 28/34 đậm 700 · heading 18/24 600 · lead 18/26 · body 16/24 · label 14/20 600 · caption 13/18 · overline 12/16 chữ hoa 600 giãn chữ 0.6.

## Khoảng cách và icon
Bước 4: 4·8·12·16·20·24. Lề màn 20, khe giữa thẻ 12, đệm trong thẻ 16.
Icon Lucide nét 1.75, đầu nét tròn; cỡ 16 (trong dòng chữ), 22 (nút, footer), 32 (trạng thái trống). Footer: nền đen trong suốt 88% (`rgba(0,0,0,0.88)`), icon màu chữ chính của giao diện tối. Mục đang chọn: icon tô đặc (fill), chi tiết bên trong khoét bằng màu thanh; không dùng khối nền dưới icon.

## Đặc tả component nền tảng
**Screen** — header / body cuộn / footer như quy tắc 4. `keyboardShouldPersistTaps="handled"` cho màn có nút bấm khi bàn phím đang mở (ví dụ chip số nhanh ở Đổi tiền).
**Button** — kiểu: primary, secondary, danger, link. Cỡ: lg 56 (padding ngang 28), md 48 (24), sm 36 (14); chữ 16/16/14 đậm 600; bo 12. Bị khoá: opacity 0.45. Đang tải: thay chữ bằng ActivityIndicator, giữ nguyên độ rộng. Đang nhấn: tối đi một bước. Link: chữ gạch chân, nền trong suốt. Đứng một mình thì rộng kín chiều ngang.
**IconButton** — tròn 44, icon 22. Biến thể: nền bề mặt, trong suốt, nhấn mạnh (nền nút chính), nguy hiểm (icon màu lỗi). Có chấm báo 10px (đỏ nhấn, viền màu nền) khi có tin mới.
**TextField** — nhãn 14/20 600 ở trên ô; ô cao 48, bo 12, viền 1px; focus viền 2px màu nhấn; lỗi viền 2px màu lỗi + dòng lỗi 13/18 bên dưới; ô mật khẩu có chữ "Hiện/Ẩn" bên phải. Không dùng placeholder làm nhãn. `labelWidth`: nhãn nằm bên trái cùng dòng, rộng cố định để nhiều ô xếp dọc thẳng hàng (dùng ở màn Đổi tiền).
**Toast** — theo giao diện (sáng: nền #fff, tối: #332d29), bo 16, một dòng 14/20, tối đa một nút chữ màu nhấn, tự tắt sau 3 giây, nổi phía trên footer. Có thể kèm icon trạng thái 22 (thành công/lỗi). `role=status`, lỗi dùng `alert`.
**Alert (cảnh báo trong trang)** — thẻ bề mặt bo 16, thanh màu 4 bên trái + icon 22: thông tin #2d4a7a, thành công #4e6b3a, cảnh báo #a0611a, lỗi #a3161f; tiêu đề 15/20 600 + mô tả 13/18. Không tự tắt.
**Banner ngoại tuyến** — dải bo 12, nền giấy vàng (#f4ead6 / #2a2318), chữ 13/18, nằm sát dưới header.
**Badge** — nhãn trạng thái bo 8, chữ hoa 12/16 600: lên kế hoạch (nền trầm), đang đi (nền nhấn, chữ trắng), hoàn thành (nền nút chính). Số đếm: viên thuốc cao 20, nền nhấn, chữ trắng; tối đa "99+".
**Dialog** — bo 24, đệm 20, tiêu đề 20/26 700, mô tả 15/22, hai nút md ngang nhau (Huỷ bên trái, hành động bên phải; nút đỏ chỉ khi phá huỷ), phủ mờ phía sau.
**Sheet** — bo 24 trượt từ đáy, tiêu đề qua prop `title` (hoặc `header` tuỳ chỉnh). Tự làm hoạt ảnh (Modal `animationType="none"`): mở thì lớp phủ hiện dần cùng lúc sheet trượt lên; đóng thì sheet trượt xuống hẳn rồi lớp phủ mới mờ dần. Vuốt xuống từ thanh kéo/tiêu đề để đóng (mặc định bật), phải kéo quá nửa chiều cao sheet; đang lưu (onClose rỗng) thì tự bật về. Vùng vuốt nhận chạm từ đầu (`onStartShouldSetPanResponder`), nếu không phần tử cha của màn bên dưới giành mất. Nội dung phụ thuộc dữ liệu màn cha xoá khi đóng thì giữ bằng `useRetained` để không trống/co lại lúc trượt xuống. Thanh tab mảnh cần vùng chạm thật (không dựa vào hitSlop).
**Chip / Segmented** — chip cao 40 pill; segmented nền trầm padding 4, mục đang chọn nền bề mặt.
**Skeleton / States** — khối xám bo 8 đúng hình nội dung, nhấp nháy nhẹ; trạng thái trống (vòng ensō + câu nói vì sao trống), lỗi (nút "Thử lại").

## Thứ tự dựng (mỗi mục một lượt, chờ duyệt)
1. Theme: palette, token, ThemeProvider (sáng/tối/theo máy).
2. `shared/ui`, mỗi lượt một nhóm: (a) Text, Button, IconButton, TextField; (b) Toast, Alert, Banner, Dialog, Badge; (c) Card, Ticket, Skeleton, States, Screen (header/body/footer).
3. Navigation: RootNavigator + MainTabs 5 icon.
4. Feature theo thứ tự: auth → home → trips → galleries → settings, dùng dữ liệu mẫu (đặt trong `api/` của từng feature).
5. Nối dữ liệu thật (Supabase) và đăng nhập an toàn: dùng Supabase Auth + react-native-keychain, KHÔNG nhúng thông tin admin cứng vào ứng dụng như bản web.

## Tab Công cụ (`features/tools`)
- Màn Công cụ: 2 thẻ. "Đổi tiền" mở màn Đổi tiền; "Dịch" mở thẳng app Google Dịch (link translate.google.com, mặc định Việt → Nhật), không có màn dịch trong app. App Google Dịch bỏ qua chữ gắn trong link, nên không gửi chữ sang; muốn gửi chữ phải viết module native (ACTION_SEND vào package Google Dịch), hỏi trước khi làm.
- Đổi tiền: ô nhập và ô quy đổi (chỉ đọc) xếp dọc, nhãn bên trái; nút icon đảo VND ⇄ Yên bên phải; chip số nhanh dưới ô nhập (thêm chip "000" khi nhập VND); dòng "Đọc ¥... là" (romaji, phiên âm Việt, kanji); dòng nói rõ tỉ giá mới nhất hay tỉ giá đã lưu; mất mạng thì Banner "đang dùng tỉ giá lưu lúc ..."; cuối màn là thẻ "Cách đọc tiền Nhật".
- Logic thuần có test: `currency.ts` (đọc/định dạng số kiểu Việt, đổi tiền), `yenReading.ts` (`readYen`, nhóm 4 số man/oku, số biến âm), `api/exchangeRate.ts` (nguồn chính, dự phòng, cache).

## Tab Ảnh (`features/galleries`)
- Màn Ảnh: thanh chọn **Ảnh | Bộ sưu tập** (nhớ lựa chọn ở AsyncStorage `galleries.mode`; Trang chủ "Xem tất cả" mở thẳng Bộ sưu tập qua tham số `mode`).
- Lưới ảnh (`PhotoGrid`): ô vuông 3 cột (màn rộng thêm cột), khe 2, tràn sát mép, chỉ có ảnh. Ảnh mới chụp nhất trước (`taken_at` desc, rồi `created_at`), tải theo trang 60 ảnh. Ảnh thu nhỏ lỗi thì tự thử lại 3 lần (lần đầu Cloudinary phải dựng bản thu nhỏ, nhiều ảnh cùng lúc hay lỗi), hết lượt hiện icon ảnh hỏng.
- Nút lọc (góc phải trên): Cả hai / Ảnh thực tế / Ảnh tham khảo; `is_real_photo` trống tính là ảnh thực tế. Khi xem cả hai, ảnh tham khảo có nhãn icon địa cầu nền giấy vàng ở góc ảnh.
- Nhấn giữ một ảnh để chọn nhiều, nút xoá (chỉ icon, màu lỗi) cạnh nút lọc, hỏi lại bằng Dialog. Xoá file Cloudinary qua route web `/api/cloudinary/delete` rồi xoá dòng `images`; Cloudinary lỗi thì vẫn xoá DB và báo số file còn sót. Mất mạng không cho chọn.
- Đang chọn ảnh còn có nút chuyển sang bộ sưu tập khác (`MoveSheet`, đổi `images.collection_id` một lệnh).
- Bộ sưu tập: thẻ bìa 16:9 (cover_image, không có thì ảnh mới nhất), tên chuyến đã gán (`collections.trip_id`), mô tả, số ảnh. Bấm mở màn lưới của bộ sưu tập (cùng lọc/chọn/xoá, `usePhotoBrowser`).
- Màn bộ sưu tập có nút bút chì (`EditCollectionSheet`): ảnh bìa mới (tải lên Cloudinary `rodrick-blog/collections` khi bấm Lưu, không xoá bìa cũ), tên, slug (UNIQUE, tự chuẩn hoá không dấu), mô tả, location_tag, chuyến đi (trip_id, chip "Chưa gán" = null).
- Danh sách bộ sưu tập: nút sắp xếp ở header mở chế độ kéo thả (`ReorderList`, PanResponder, kéo bằng tay cầm bên phải); Lưu ghi lại `display_order` 1..n. Xoá/chuyển/sửa ở màn bộ sưu tập thì tab Ảnh tải lại ngầm khi quay về (`collectionsStale`).
- Màn xem ảnh (`PhotoViewer` của galleries, nền đen): vuốt ngang; chạm hiện dải đen mờ (nút đóng, số thứ tự, nút xoay và chia sẻ ở trên; caption và dòng phụ ở đáy), chạm lần nữa ẩn. `PhotoPager` (PanResponder + Animated, không thư viện) tự xử lý cả vuốt ngang lẫn thu phóng trong một bộ nhận chạm; KHÔNG dùng FlatList cuộn ngang vì trên Android nó giành mất cử chỉ chụm hai ngón. Lưới và màn xem dùng chung `photoUrls.ts`: ảnh nhỏ của lưới `gridThumbUrl` giữ tỉ lệ (c_limit 540, ô cắt vuông bằng `resizeMode="cover"`, KHÔNG dùng c_fill) để màn xem hiện ngay ảnh nhỏ đã có trong cache rồi đè ảnh nét lên khi tải xong. Ảnh nét xin cỡ vừa màn (`viewerUrl`: c_limit theo cạnh dài × mật độ điểm ảnh, tối đa 2560), KHÔNG xin ảnh gốc 24MP (lần đầu vuốt tới bị nền đen rồi ảnh hiện dần); tải trước 2 ảnh mỗi bên, `fadeDuration={0}`. Dải ảnh: mỗi ảnh đặt cố định `left = chỉ số × bề ngang`, dải dịch tới `-current × bề ngang`; KHÔNG đổi left của ảnh rồi đặt dải về 0 sau khi vuốt (hoạt ảnh native lệch một khung hình, ảnh nháy). Chụm hai ngón thu phóng tới 4x, chạm đúp phóng 2.5x tại chỗ chạm, đang phóng to thì kéo trong ảnh. Không tự xoay ảnh theo tỉ lệ ảnh; chỉ xoay bằng nút, cầm máy ngang thì theo cài đặt xoay màn hình của máy. Chia sẻ dùng `Share` của React Native, gửi caption + link ảnh (không gửi tệp; muốn gửi tệp phải thêm thư viện, hỏi trước).

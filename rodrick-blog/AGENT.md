# RODRICK BLOG — ARCHITECTURE & DEVELOPMENT GUIDE

> Tài liệu đặc tả kỹ thuật, cấu trúc thư mục, thiết kế cơ sở dữ liệu và quy chuẩn giao diện cho dự án **Rodrick Travel & Photography Blog** (`rodrick-blog`)[cite: 13].  
> Mọi AI Agent (Antigravity / Copilot) khi tham gia viết code cho dự án này **bắt buộc** phải tuân thủ nghiêm ngặt các quy tắc dưới đây[cite: 13].

---

## 1. Ý Tưởng Cốt Lõi & Phong Cách Thiết Kế (Product Vision & Design System)

### 1.1. Ý tưởng sản phẩm

Xây dựng một **Blog Cá Nhân chuyên về Lịch Trình Du Lịch & Bộ Sưu Tập Nhiếp Ảnh** hoạt động theo kiến trúc **Single Page / Hybrid SPA**[cite: 13]:

- **Trọng tâm 1 - Kế Hoạch & Nhật Ký Hành Trình (`trips` & `timeline_events`):** Hiển thị lịch trình chi tiết chuyến đi Nhật Bản (Tháng 12/2026 - 6 ngày 7 đêm tại **Tokyo & Kyoto**) theo từng mốc ngày/giờ, phương tiện di chuyển, quán ăn (Ramen, thịt nướng, cơm... không ăn sushi), ghi chú thực tế[cite: 13] và **Bản đồ tuyến đường di chuyển (Route Map)** trực quan.
- **Trọng tâm 2 - Bộ Sưu Tập Nhiếp Ảnh (`collections` & `images`):** Lưu trữ và trưng bày các bức ảnh/video chụp từ máy **Sony A6400 (kèm lens 18-135mm)**[cite: 13]. Bảng `images` đóng vai trò trung tâm: vừa hiển thị theo từng Album nghệ thuật (`collections`), vừa liên kết trực tiếp vào từng mốc địa điểm trong `timeline_events`[cite: 13].

### 1.2. Hệ thống thiết kế (Parchment & Vermilion Editorial Design System)

- **Tông màu chủ đạo (Parchment & Vermilion Editorial)[cite: 7]:**
  - Nền chính (Paper / Background Primary): `#FAF8F5`[cite: 5, 13]
  - Nền phụ / Khối (Card / Background Secondary): `#F3F0EA` và `#FFFFFF`[cite: 5, 13]
  - Chữ chính (Neutral / Text Primary): `#1A1A1A`[cite: 5, 7]
  - Chữ phụ (Text Muted): `#4A4742` / `#57544E` / `#78756E`[cite: 13]
  - Màu nhấn thương hiệu (Primary Vermilion): `#B61C25`[cite: 7]
  - Màu phụ (Secondary Slate): `#2D3436`[cite: 7]
  - Màu nhấn phụ (Tertiary Gold): `#C59F60`[cite: 7]
  - Đường viền (Border): `#EFECE4` / `#E6E2DA`[cite: 13]
- **Typography Không Đuôi Đồng Nhất (Khai báo trong `app/layout.tsx` & `app/globals.css`):**
  - **TUYỆT ĐỐI KHÔNG SỬ DỤNG FONT CÓ ĐUÔI (SERIF)** để tránh lỗi rớt dấu tiếng Việt và lệch hiển thị giữa Local và Production trên Vercel.
  - **Headline & Label (`--font-serif`, `--font-mono`, `h1..h6`)**: Sử dụng **`Plus Jakarta Sans`** (`weight: ['500', '600', '700', '800']`)[cite: 7].
  - **Body (`--font-sans`)**: Sử dụng **`Inter`** (`weight: ['400', '500', '600', '700']`)[cite: 7], thẻ `<body>` áp dụng mặc định class `font-sans font-medium` để nét chữ đanh và dày dặn.
  - **Favicon (`app/icon.svg`)**: Biểu tượng nền vuông bo góc `#1A1A1A` với chữ **R** siêu đậm màu `#B61C25`[cite: 7, 8].

### 1.3. Quy Chuẩn Thẩm Mỹ & Ràng Buộc Taste Skill (`design-taste-frontend`)

Mọi tác vụ tạo mới hoặc chỉnh sửa giao diện trong `app/` và `components/` **BẮT BUỘC** phải đọc và tuân thủ file `.claude/skills/design-taste-frontend/SKILL.md` (kết hợp `.agents/skills/design-taste-frontend/SKILL.md`), với các quy tắc khóa cứng (Overrides) dành riêng cho `rodrick-blog` như sau:

1. **Thứ tự ưu tiên (Source of Truth Precedence):**
   - **Font chữ & Bảng màu:** Tuân thủ tuyệt đối Mục 1.2 của `AGENT.md` (`Plus Jakarta Sans` cho Heading/Mono, `Inter` cho Body; nền `#FAF8F5`, chữ `#1A1A1A`, màu nhấn `#B61C25`). Quy tắc cấm font Serif của `AGENT.md` được ưu tiên cao hơn gợi ý font mặc định trong `SKILL.md`.
   - **Bố cục (Layout), Chuyển động (Motion) & Chống giao diện rập khuôn (Anti-Slop):** Tuân thủ tuyệt đối Section 4 (The 3 Locks), Section 9 (Anti-Slop Bans) và Section 14 (Pre-Flight Check) của `SKILL.md`.
2. **The 3 Locks (Khóa đồng nhất toàn trang):**
   - **Color Lock:** Chỉ sử dụng `#B61C25` (Primary Vermilion) làm màu nhấn hành động chính và `#C59F60` (Gold) cho chi tiết phụ tinh tế. Không tự ý thêm các badge màu xanh lục/xanh dương rực rỡ gây phá vỡ tông màu giấy cổ điển (`#FAF8F5`).
   - **Shape Lock:** Thống nhất một hệ bo góc duy nhất trên toàn bộ thẻ lịch trình và khung ảnh.
   - **Theme Lock:** Cố định tông màu sáng ấm (`#FAF8F5` / `#F3F0EA`), không lật sang nền tối giữa chừng (trừ popup `ImageLightboxModal` xem ảnh toàn màn hình).
3. **Quy tắc Anti-Slop bắt buộc (Section 9 trong `SKILL.md`):**
   - **Cấm tuyệt đối dấu gạch ngang dài** (Em-dash `—` và En-dash `–`) trong toàn bộ giao diện và dữ liệu text; chỉ sử dụng dấu gạch ngang ngắn (`-`) hoặc dấu chấm tròn (`•`).
   - **Không đè thẻ Pill/Tag lên trên bề mặt ảnh (`PhotoCard`):** Thông tin EXIF chi tiết và địa điểm đặt ở phần caption/metadata ngay bên dưới bức ảnh.
   - **Ngoại lệ duy nhất - Giấy nhớ phân loại ảnh (`components/ui/PhotoFrame.tsx`):** Trong trang lịch trình, ảnh được đóng khung (`.photo-frame`) và dán một tờ giấy nhớ (`.sticky-tag`) lệch ở mép trên: ảnh thực tế là bản in giấy trắng + giấy nhớ đỏ `#B61C25`; ảnh tham khảo là mẩu cắt giấy ngả vàng nét đứt + giấy nhớ vàng (rút từ `#C59F60`). Không thêm màu khác cho nhãn này.
   - **Không chia 3 cột thẻ đều nhau đơn điệu:** Ưu tiên lưới bất đối xứng (asymmetric editorial grid) hoặc bố cục tạp chí 2 cột lệch nhịp cho trang Bộ sưu tập và Lịch trình.

---

## 2. Cấu Trúc Cơ Sở Dữ Liệu (Supabase PostgreSQL - 4 Bảng Quan Hệ)

Hệ thống Database tập trung hoàn toàn vào **Du lịch** và **Nhiếp ảnh** thông qua 4 bảng chuẩn hóa[cite: 13]:

1. **`collections`**: Lưu các bộ sưu tập / album ảnh có hỗ trợ ảnh bìa (`id`, `slug`, `title`, `description`, `cover_image`, `location_tag`, `display_order`)[cite: 13].
2. **`trips`**: Lưu thông tin tổng quan chuyến đi có hỗ trợ ảnh banner/đại diện (`id`, `slug`, `title`, `summary`, `cover_image`, `start_date`, `end_date`, `cities`, `status`)[cite: 13].
3. **`timeline_events`**: Lưu các mốc thời gian chi tiết trong chuyến đi (`id`, `trip_id`, `day_number`, `trip_date`, `time_slot`, `location_name`, `city`, `category_tag`, `notes`, `map_embed_url`)[cite: 13].
   - `map_embed_url` (`TEXT`): Lưu URL nhúng Google Maps (`https://www.google.com/maps?q=...&output=embed` hoặc URL tùy chọn) hiển thị trực quan qua thẻ `<iframe>` và liên kết dẫn đường trực tiếp trên app.
4. **`images`**: Bảng trung tâm lưu ảnh/video từ Cloudinary (`id`, `cloudinary_url`, `caption`, `city`, `camera_gear`, `exif_info`, `collection_id`, `timeline_event_id`, `is_featured`, `is_real_photo`, `taken_at`)[cite: 13].
   - `is_real_photo = true`: Ảnh chụp thực tế từ máy Sony A6400 (kèm thông số EXIF, nhãn xanh lục)[cite: 13].
   - `is_real_photo = false`: Ảnh minh họa / tư liệu tham khảo web cho kế hoạch lịch trình (nhãn xanh dương)[cite: 13].
   - Liên kết `timeline_event_id -> timeline_events(id)`: Giúp mỗi mốc lịch trình lấy được toàn bộ ảnh chụp tại địa điểm đó[cite: 13].
   - Liên kết `collection_id -> collections(id)`: Giúp gom ảnh thành các bộ sưu tập trưng bày riêng trên web[cite: 13].

### Cấu hình Quyền Ghi Dữ Liệu (Supabase RLS & Schema Migration):

Để cho phép thêm/sửa trực tiếp từ giao diện quản trị trên Blog mà không bị chặn bởi Row-Level Security mặc định của Supabase, chạy câu lệnh SQL sau trong Supabase SQL Editor[cite: 12]:

```sql
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE images DISABLE ROW LEVEL SECURITY;
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;

-- Loại bỏ cột route_coordinates cũ và thêm cột map_embed_url chuẩn Google Maps Embed
ALTER TABLE timeline_events DROP COLUMN IF EXISTS route_coordinates;
ALTER TABLE timeline_events ADD COLUMN IF NOT EXISTS map_embed_url TEXT;
```

---

## 3. Cách Tổ Chức Thư Mục Dự Án (Project Directory Structure)

Dự án **không sử dụng thư mục `src/`**, toàn bộ mã nguồn đặt tại thư mục gốc `rodrick-blog/` theo kiến trúc phân tầng rõ ràng[cite: 13]:

```text
RodrickBlog/                        <-- Git Repository Root
└── rodrick-blog/                   <-- NEXT.JS ROOT DIRECTORY (Cấu hình trên Vercel)
    ├── app/                        <-- 1. TẦNG ROUTING & SERVER ENTRY
    │   ├── icon.svg                <-- Favicon SVG chữ R đỏ (#B61C25) trên nền đen (#1A1A1A)
    │   ├── globals.css             <-- Cấu hình Tailwind v4 (@import "tailwindcss"; & @theme inline)
    │   ├── layout.tsx              <-- Cấu hình Fonts (Plus Jakarta Sans & Inter) & Metadata
    │   └── page.tsx                <-- Server Component: Gọi Services lấy dữ liệu & hiển thị Single Page
    │
    ├── components/                 <-- 2. TẦNG GIAO DIỆN (UI COMPONENTS)
    │   ├── layout/
    │   │   ├── Navbar.tsx          <-- Thanh điều hướng (Trang chủ | Hành trình | Bộ sưu tập | Về tôi)
    │   │   └── Footer.tsx          <-- Chân trang
    │   ├── home/
    │   │   ├── HeroSection.tsx     <-- Khối giới thiệu mở đầu
    │   │   └── StatsBar.tsx        <-- Thanh thống kê (Số hành trình, số album, số bức ảnh Sony A6400)
    │   ├── itinerary/              <-- MODULE 1: KẾ HOẠCH, TIMELINE & BẢN ĐỒ TUYẾN ĐƯỜNG
    │   │   ├── ItinerarySinglePageView.tsx  <-- Client Component ('use client') lọc theo Ngày & Thành phố + Admin Modal
    │   │   ├── DayFilterTabs.tsx            <-- Thanh bấm chuyển Ngày tức thì (0ms)
    │   │   ├── TimelineItemCard.tsx         <-- Thẻ hiển thị mốc giờ, ghi chú, bản đồ Google Maps Embed và lưới ảnh
    │   │   ├── TimelineRouteMap.tsx         <-- Bản đồ Google Maps Embed & Dẫn đường trực tiếp (h-[240px])
    │   │   └── AdminRoutePickerMap.tsx      <-- Bản đồ Tuyến đường Google Maps (Admin Edit, Dual-Mode)
    │   └── gallery/                <-- MODULE 2: BỘ SƯU TẬP NHIẾP ẢNH (COLLECTIONS & IMAGES)
    │       ├── CollectionGrid.tsx           <-- Hiển thị lưới các bộ sưu tập ảnh kèm cover_image
    │       ├── PhotoCard.tsx                <-- Thẻ ảnh kèm thông số EXIF (Sony A6400 • 18-135mm)
    │       └── ImageLightboxModal.tsx       <-- Popup phóng to ảnh chất lượng cao toàn màn hình khi click
    │
    ├── services/                   <-- 3. TẦNG XỬ LÝ DỮ LIỆU (DATA ACCESS LAYER)
    │   ├── itinerary.service.ts    <-- Truy vấn & cập nhật `trips` và `timeline_events` (kèm `map_embed_url` & `images`)
    │   └── gallery.service.ts      <-- Truy vấn & cập nhật `collections` và `images`
    │
    ├── types/                      <-- 4. TẦNG MODELS / ENTITIES (TYPE DEFINITIONS)
    │   └── database.type.ts        <-- Khai báo Interfaces: Trip, TimelineEvent, Collection, GalleryImage
    │
    ├── lib/                        <-- 5. TẦNG CORE / INFRASTRUCTURE
    │   ├── supabase.ts             <-- Khởi tạo Supabase Client
    │   └── cloudinary.ts           <-- Hàm helper tự động chèn `f_auto,q_auto` tối ưu URL ảnh Cloudinary
    │
    ├── .env.local                  <-- Biến môi trường (Chỉ lưu ở máy Local)
    ├── AGENT.md                    <-- Tài liệu hướng dẫn chuẩn cho AI Agent
    └── package.json
```

---

## 4. Mẫu Code Chuẩn Cho Tầng Types & Services (Core Templates)

### 4.1. Định nghĩa Model (`types/database.type.ts`)[cite: 13]

```typescript
export interface GalleryImage {
  id: number;
  cloudinary_url: string;
  caption: string | null;
  city: "Tokyo" | "Kyoto" | string | null;
  camera_gear: string | null;
  exif_info: string | null;
  collection_id: number | null;
  timeline_event_id: number | null;
  is_featured: boolean;
  is_real_photo: boolean; // 🌟 true: Ảnh chụp thực tế (Sony A6400), false: Ảnh tham khảo web
  taken_at: string;
}

export interface Collection {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null; // 🌟 Ảnh bìa Album ảnh
  location_tag: string | null;
  display_order: number;
  images?: GalleryImage[];
}

export interface TimelineEvent {
  id: number;
  trip_id: number;
  day_number: number;
  trip_date: string;
  time_slot: string;
  location_name: string;
  city: "Tokyo" | "Kyoto" | string;
  category_tag: "TRANSIT" | "FOOD" | "SIGHTSEEING" | "HOTEL" | string;
  notes: string | null;
  map_embed_url?: string | null; // 🌟 URL nhúng Google Maps iframe hoặc link bản đồ
  images?: GalleryImage[]; // Danh sách ảnh nối từ bảng images sang
}

export interface Trip {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  cover_image: string | null; // 🌟 Ảnh banner đại diện chuyến đi
  start_date: string;
  end_date: string;
  cities: string;
  status: "PLANNING" | "ONGOING" | "COMPLETED" | string;
  timeline_events?: TimelineEvent[];
}
```

### 4.2. Truy vấn Lịch trình kèm Ảnh & Tuyến đường (`services/itinerary.service.ts`)[cite: 13]

```typescript
import { supabase } from "@/lib/supabase";
import { TimelineEvent, Trip } from "@/types/database.type";

export const ItineraryService = {
  async getTripDetails(slug = "nhat-ban-thang-12-2026"): Promise<Trip null |> {
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("slug", slug)
      .single();

    if (tripError || !trip) return null;

    const { data: events, error: eventError } = await supabase
      .from("timeline_events")
      .select(
        `
        *,
        images (*)
      `,
      )
      .eq("trip_id", trip.id)
      .order("day_number", { ascending: true })
      .order("time_slot", { ascending: true });

    if (eventError) throw new Error(eventError.message);

    return {
      ...trip,
      timeline_events: events ?? [],
    } as Trip;
  },
};
```

### 4.3. Truy vấn Bộ sưu tập ảnh (`services/gallery.service.ts`)[cite: 13]

```typescript
import { supabase } from "@/lib/supabase";
import { Collection, GalleryImage } from "@/types/database.type";

export const GalleryService = {
  async getCollectionsWithImages(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from("collections")
      .select(
        `
        *,
        images (*)
      `,
      )
      .order("display_order", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as Collection[];
  },
};
```

---

## 5. Các Lưu Ý Kỹ Thuật Quan Trọng (Critical Technical Notes)

1. **Quy tắc cấu hình Font với Tailwind CSS v4 (`app/globals.css`):**
   - **BẮT BUỘC dùng `@theme inline`** thay vì `@theme` thông thường để tránh lỗi trình biên dịch trên Vercel làm đứt gãy biến CSS từ `next/font/google`.
   - Khai báo đầy đủ mảng `weight` trong `app/layout.tsx` và không để bất kỳ font fallback có đuôi nào (`Georgia`, `Times New Roman`, `ui-serif`) trong `globals.css`.
2. **Quy tắc tích hợp Bản đồ Google Maps (Pure Google Maps Embed / URL):**
   - Sử dụng thẻ `<iframe>` chuẩn mực với URL `https://www.google.com/maps?q=...&output=embed` hoặc URL từ trường `map_embed_url` kết hợp nút bấm dẫn đường "Mở trên Google Maps App" (`https://www.google.com/maps/search/?api=1&query=...`).
   - Không sử dụng Google Maps JavaScript API hoặc `@vis.gl/react-google-maps` để tránh hoàn toàn các lỗi `ApiTargetBlockedMapError`, `ERR_BLOCKED_BY_CLIENT` và không tốn chi phí API Key.
3. **Biến môi trường Supabase (`.env.local` & Vercel)[cite: 13]:**
   - `NEXT_PUBLIC_SUPABASE_URL=https://brnvhhehummrrixzkxen.supabase.co`[cite: 13]
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`[cite: 13]
   - Trong `lib/supabase.ts` luôn gọi đúng `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!`[cite: 13].
4. **Quy tắc Fetch dữ liệu trên Next.js 16.4.2 (`cacheComponents`)[cite: 13]:**
   - **KHÔNG dùng:** `export const revalidate = 60;` (gây lỗi xung đột với `cacheComponents`)[cite: 13].
   - **Bắt buộc dùng:** Đặt `export const instant = false;` ở đầu file `app/page.tsx` (hoặc dùng `"use cache";` trong thân hàm async) để cho phép Server Component truy vấn Supabase[cite: 13].
5. **Tối ưu ảnh từ Cloudinary[cite: 13]:**
   - Khi hiển thị ảnh dung lượng lớn từ máy Sony A6400, tự động chèn tham số `f_auto,q_auto/` ngay sau đoạn `/upload/` của URL Cloudinary để nén nhẹ xuống WebP/AVIF giữ nguyên chất lượng[cite: 13].
6. **Lỗi thiếu gói Native Binary của Tailwind CSS v4 trên Windows[cite: 13]:**
   - Nếu gặp lỗi thiếu module `@tailwindcss/oxide-win32-x64-msvc` sau khi cài package mới, chạy lệnh[cite: 13]:
     `npm install @tailwindcss/oxide-win32-x64-msvc --save-optional`[cite: 13]
7. **Quy trình Kiểm tra Build Production tại Local (trên Windows CMD) & Cấu hình Vercel:**
   - **Vercel Root Directory:** `rodrick-blog` | **Framework Preset:** `Next.js`[cite: 13]
   - Trước khi push lên Vercel, luôn xóa cache và kiểm tra bản build bằng cụm lệnh CMD:
     ```cmd
     rmdir /s /q .next
     npm run build
     npm run start
     ```

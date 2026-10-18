# RODRICK BLOG — ARCHITECTURE & DEVELOPMENT GUIDE

> Tài liệu đặc tả kỹ thuật, cấu trúc thư mục, thiết kế cơ sở dữ liệu và quy chuẩn giao diện cho dự án **Rodrick Travel & Photography Blog** (`rodrick-blog`).  
> Mọi AI Agent (Antigravity / Copilot) khi tham gia viết code cho dự án này **bắt buộc** phải tuân thủ nghiêm ngặt các quy tắc dưới đây.

---

## 1. Ý Tưởng Cốt Lõi & Phong Cách Thiết Kế (Product Vision & Design System)

### 1.1. Ý tưởng sản phẩm

Xây dựng một **Blog Cá Nhân chuyên về Lịch Trình Du Lịch & Bộ Sưu Tập Nhiếp Ảnh** hoạt động theo kiến trúc **Single Page / Hybrid SPA**:

- **Trọng tâm 1 - Kế Hoạch & Nhật Ký Hành Trình (`trips` & `timeline_events`):** Hiển thị lịch trình chi tiết chuyến đi Nhật Bản (Tháng 12/2026 - 6 ngày 7 đêm tại **Tokyo & Kyoto**) theo từng mốc ngày/giờ, phương tiện di chuyển, quán ăn (Ramen, thịt nướng... không ăn sushi) và ghi chú thực tế.
- **Trọng tâm 2 - Bộ Sưu Tập Nhiếp Ảnh (`collections` & `images`):** Lưu trữ và trưng bày các bức ảnh/video chụp từ máy **Sony A6400 (kèm lens 18-135mm)**. Bảng `images` đóng vai trò trung tâm: vừa hiển thị theo từng Album nghệ thuật (`collections`), vừa liên kết trực tiếp vào từng mốc địa điểm trong `timeline_events`.

### 1.2. Hệ thống thiết kế (Editorial Design System)

- **Tông màu chủ đạo (Warm Paper & Crimson Accent):**
  - Nền chính (Background Primary): `#FAF8F5`
  - Nền phụ / Khối (Background Secondary / Card): `#F3F0EA` và `#FFFFFF`
  - Chữ chính (Text Primary): `#1C1B18`
  - Chữ phụ (Text Muted): `#57544E` / `#78756E`
  - Màu nhấn thương hiệu (Primary Accent - Đỏ trầm): `#B93829`
  - Đường viền (Border): `#E6E2DA` / `#E5E0D8`
- **Typography (Khai báo trong `app/layout.tsx` & `app/globals.css`):**
  - `font-serif` (**Newsreader**): Dùng cho tiêu đề lớn (H1, H2, H3) và câu trích dẫn nghiêng.
  - `font-sans` (**Inter**): Dùng cho nội dung mô tả, ghi chú lịch trình.
  - `font-mono` (**JetBrains Mono**): Dùng cho nhãn ngày giờ, thông số EXIF máy ảnh (`35mm • f/4.0`), tọa độ, badge.

---

## 2. Cấu Trúc Cơ Sở Dữ Liệu (Supabase PostgreSQL - 4 Bảng Quan Hệ)

Hệ thống Database tập trung hoàn toàn vào **Du lịch** và **Nhiếp ảnh** thông qua 4 bảng chuẩn hóa:

1. **`collections`**: Lưu các bộ sưu tập / album ảnh có hỗ trợ ảnh bìa (`id`, `slug`, `title`, `description`, `cover_image`, `location_tag`, `display_order`).
2. **`trips`**: Lưu thông tin tổng quan chuyến đi có hỗ trợ ảnh banner/đại diện (`id`, `slug`, `title`, `summary`, `cover_image`, `start_date`, `end_date`, `cities`, `status`).
3. **`timeline_events`**: Lưu các mốc thời gian chi tiết trong chuyến đi (`id`, `trip_id`, `day_number`, `trip_date`, `time_slot`, `location_name`, `city`, `category_tag`, `notes`).
4. **`images`**: Bảng trung tâm lưu ảnh/video từ Cloudinary (`id`, `cloudinary_url`, `caption`, `city`, `camera_gear`, `exif_info`, `collection_id`, `timeline_event_id`, `is_featured`, `is_real_photo`, `taken_at`).
   - `is_real_photo = true`: Ảnh chụp thực tế từ máy Sony A6400 (kèm thông số EXIF, nhãn xanh lục).
   - `is_real_photo = false`: Ảnh minh họa / tư liệu tham khảo web cho kế hoạch lịch trình (nhãn xanh dương).
   - Liên kết `timeline_event_id -> timeline_events(id)`: Giúp mỗi mốc lịch trình lấy được toàn bộ ảnh chụp tại địa điểm đó.
   - Liên kết `collection_id -> collections(id)`: Giúp gom ảnh thành các bộ sưu tập trưng bày riêng trên web.

---

## 3. Cách Tổ Chức Thư Mục Dự Án (Project Directory Structure)

Dự án **không sử dụng thư mục `src/`**, toàn bộ mã nguồn đặt tại thư mục gốc `rodrick-blog/` theo kiến trúc phân tầng rõ ràng:

```text
RodrickBlog/                        <-- Git Repository Root
└── rodrick-blog/                   <-- NEXT.JS ROOT DIRECTORY (Cấu hình trên Vercel)
    ├── app/                        <-- 1. TẦNG ROUTING & SERVER ENTRY
    │   ├── globals.css             <-- Cấu hình Tailwind v4 (@import "tailwindcss"; & @theme)
    │   ├── layout.tsx              <-- Cấu hình Fonts (Inter, Newsreader, JetBrains Mono) & Metadata
    │   └── page.tsx                <-- Server Component: Gọi Services lấy dữ liệu & hiển thị Single Page
    │
    ├── components/                 <-- 2. TẦNG GIAO DIỆN (UI COMPONENTS)
    │   ├── layout/
    │   │   ├── Navbar.tsx          <-- Thanh điều hướng (Hành trình | Bộ sưu tập | Về tôi)
    │   │   └── Footer.tsx          <-- Chân trang
    │   ├── home/
    │   │   ├── HeroSection.tsx     <-- Khối giới thiệu mở đầu
    │   │   └── StatsBar.tsx        <-- Thanh thống kê (Số ngày đi, số địa điểm, số bức ảnh Sony A6400)
    │   ├── itinerary/              <-- MODULE 1: KẾ HOẠCH & TIMELINE DU LỊCH
    │   │   ├── ItinerarySinglePageView.tsx  <-- Client Component ('use client') lọc theo Ngày (Day 1..6) & Thành phố
    │   │   ├── DayFilterTabs.tsx            <-- Thanh bấm chuyển Ngày tức thì (0ms)
    │   │   └── TimelineItemCard.tsx         <-- Thẻ hiển thị mốc giờ, ghi chú và lưới ảnh lấy từ bảng `images`
    │   └── gallery/                <-- MODULE 2: BỘ SƯU TẬP NHIẾP ẢNH (COLLECTIONS & IMAGES)
    │       ├── CollectionGrid.tsx           <-- Hiển thị lưới các bộ sưu tập ảnh kèm cover_image
    │       ├── PhotoCard.tsx                <-- Thẻ ảnh kèm thông số EXIF (Sony A6400 • 18-135mm)
    │       └── ImageLightboxModal.tsx       <-- Popup phóng to ảnh chất lượng cao toàn màn hình khi click
    │
    ├── services/                   <-- 3. TẦNG XỬ LÝ DỮ LIỆU (DATA ACCESS LAYER)
    │   ├── itinerary.service.ts    <-- Truy vấn `trips` và `timeline_events` (join sẵn bảng `images`)
    │   └── gallery.service.ts      <-- Truy vấn `collections` và `images`
    │
    ├── types/                      <-- 4. TẦNG MODELS / ENTITIES (TYPE DEFINITIONS)
    │   └── database.type.ts        <-- Khai báo Interfaces: Trip, TimelineEvent, Collection, GalleryImage
    │
    ├── lib/                        <-- 5. TẦNG CORE / INFRASTRUCTURE
    │   ├── supabase.ts             <-- Khởi tạo Supabase Client
    │   └── cloudinary.ts           <-- Hàm helper tự động chèn `f_auto,q_auto` tối ưu URL ảnh Cloudinary
    │
    ├── .env.local                  <-- Biến môi trường (Chỉ lưu ở máy Local)
    ├── AGENTS.md                   <-- Tài liệu hướng dẫn cho AI Agent
    └── package.json
```

---

## 4. Mẫu Code Chuẩn Cho Tầng Types & Services (Core Templates)

### 4.1. Định nghĩa Model (`types/database.type.ts`)

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

### 4.2. Truy vấn Lịch trình kèm Ảnh (`services/itinerary.service.ts`)

```typescript
import { supabase } from "@/lib/supabase";
import { TimelineEvent, Trip } from "@/types/database.type";

export const ItineraryService = {
  async getTripDetails(slug = "nhat-ban-thang-12-2026"): Promise<Trip | null> {
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

### 4.3. Truy vấn Bộ sưu tập ảnh (`services/gallery.service.ts`)

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

1. **Biến môi trường Supabase (`.env.local` & Vercel):**
   - `NEXT_PUBLIC_SUPABASE_URL=[https://brnvhhehummrrixzkxen.supabase.co](https://brnvhhehummrrixzkxen.supabase.co)`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`
   - Trong `lib/supabase.ts` luôn gọi đúng `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!`.
2. **Quy tắc Fetch dữ liệu trên Next.js 16.4.2 (`cacheComponents`):**
   - **KHÔNG dùng:** `export const revalidate = 60;` (gây lỗi xung đột với `cacheComponents`).
   - **Bắt buộc dùng:** Đặt `export const instant = false;` ở đầu file `app/page.tsx` (hoặc dùng `"use cache";` trong thân hàm async) để cho phép Server Component truy vấn Supabase.
3. **Tối ưu ảnh từ Cloudinary:**
   - Khi hiển thị ảnh dung lượng lớn từ máy Sony A6400, tự động chèn tham số `f_auto,q_auto/` ngay sau đoạn `/upload/` của URL Cloudinary để nén nhẹ xuống WebP/AVIF giữ nguyên chất lượng.
4. **Lỗi thiếu gói Native Binary của Tailwind CSS v4 trên Windows:**
   - Nếu gặp lỗi thiếu module `@tailwindcss/oxide-win32-x64-msvc` sau khi cài package mới, chạy lệnh:
     `npm install @tailwindcss/oxide-win32-x64-msvc --save-optional`
5. **Cấu hình Vercel Deployment:**
   - **Root Directory:** `rodrick-blog`
   - **Framework Preset:** `Next.js`

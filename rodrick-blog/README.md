# 📷 Rodrick Travel & Photography Blog

Blog cá nhân chuyên về **Lịch trình du lịch** & **Bộ sưu tập nhiếp ảnh**.
- 🌸 **Hành trình**: Lịch trình chi tiết chuyến đi Nhật Bản (Tokyo & Kyoto) kèm bản đồ lộ trình, ghi chú quán ăn, mốc thời gian thực tế.
- 📸 **Nhiếp ảnh**: Trưng bày các album ảnh/video từ máy Sony A6400 (lens 18-135mm), liên kết trực tiếp với từng mốc sự kiện trong hành trình.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Turbopack) & [React 19](https://react.dev/)
- **Ngôn ngữ:** TypeScript
- **Styling:** Tailwind CSS v4 (Hệ thiết kế Parchment & Vermilion Editorial)
- **Cơ sở dữ liệu:** [Supabase](https://supabase.com/) (PostgreSQL & Storage)
- **Lưu trữ & CDN ảnh:** [Cloudinary](https://cloudinary.com/)

---

## 🚀 Hướng Dẫn Khởi Chạy (Quick Start)

### Bước 1: Mở Terminal và vào thư mục dự án
Nếu đang ở thư mục ngoài (`RodrickBlog`):
```bash
cd rodrick-blog
```

### Bước 2: Cài đặt thư viện (nếu cần)
```bash
npm install
```

### Bước 3: Kiểm tra biến môi trường
Đảm bảo file `.env.local` đã khai báo các biến cần thiết:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Cloudinary (Upload và quản lý ảnh)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Bước 4: Chạy Development Server
```bash
npm run dev
```

Sau khi server chạy, mở trình duyệt truy cập:  
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📜 Các Lệnh Thường Dùng (Scripts)

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run dev` | Khởi chạy server phát triển (`localhost:3000`) |
| `npm run build` | Đóng gói tối ưu mã nguồn cho môi trường Production |
| `npm run start` | Chạy ứng dụng Production (sau khi đã `build`) |
| `npm run lint` | Quét kiểm tra lỗi cú pháp và chuẩn code (ESLint) |

---

## 📂 Cấu Trúc Thư Mục Chính

```text
rodrick-blog/
├── app/               # Giao diện chính, routing (Next.js App Router), layout
├── components/        # Các UI Components (Timeline, PhotoCard, Lightbox...)
├── lib/               # Cấu hình Supabase client, utils và helper functions
├── services/          # Các hàm truy vấn dữ liệu từ Supabase / Cloudinary
├── types/             # Định nghĩa kiểu dữ liệu TypeScript (Trip, Image, Event...)
├── public/            # File tĩnh (icons, fonts, ảnh tĩnh)
├── .env.local         # Biến môi trường (không commit lên Git)
└── AGENT.md           # Đặc tả kỹ thuật, bảng màu, font chữ & quy chuẩn thiết kế
```

---

## 📖 Tài Liệu Tham Khảo Thêm
- Xem chi tiết về hệ màu Parchment & Vermilion, quy chuẩn thiết kế và cấu trúc cơ sở dữ liệu tại: [`AGENT.md`](./AGENT.md).

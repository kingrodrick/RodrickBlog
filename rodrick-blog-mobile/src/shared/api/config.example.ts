/**
 * Mẫu cấu hình Supabase. Sao chép thành `config.ts` (đã gitignore) rồi điền key.
 * Lấy giá trị giống NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY của bản web.
 */
export const SUPABASE_URL: string = 'https://brnvhhehummrrixzkxen.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY: string = '';

/** Giống NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET của bản web. */
export const CLOUDINARY_CLOUD_NAME: string = '';
export const CLOUDINARY_UPLOAD_PRESET: string = '';

/**
 * Địa chỉ gốc của web trên Vercel (không có dấu "/" cuối), ví dụ 'https://ten-blog.vercel.app'.
 * Dùng để gọi route xoá ảnh Cloudinary /api/cloudinary/delete (cần khoá bí mật nên chỉ chạy ở server).
 * Để trống thì app vẫn xoá dòng trong DB nhưng báo file chưa xoá khỏi Cloudinary.
 */
export const WEB_API_BASE_URL: string = '';

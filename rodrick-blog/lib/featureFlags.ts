/**
 * Cờ tính năng. Giá trị NEXT_PUBLIC_* được Next.js gắn cứng vào bundle lúc build,
 * nên đổi cờ cần build lại.
 */

/**
 * Bản đồ trên web (từ 20/11 mặc định tắt): không hiển thị bản đồ, không có ô dán link,
 * không ghi `map_embed_url`. Lộ trình chỉ sửa trên app mobile (bảng `event_maps`).
 * Bật lại bằng NEXT_PUBLIC_ENABLE_WEB_MAP=true.
 */
export const WEB_MAP_ENABLED = process.env.NEXT_PUBLIC_ENABLE_WEB_MAP === 'true';

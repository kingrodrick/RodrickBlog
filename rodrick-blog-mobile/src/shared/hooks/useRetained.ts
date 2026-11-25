import { useRef } from 'react';

/**
 * Giữ giá trị cuối cùng khác null/undefined. Dùng cho nội dung sheet: màn cha đóng sheet bằng
 * cách xoá dữ liệu (ảnh đang sửa = null, danh sách = rỗng) nhưng sheet còn chạy hoạt ảnh trượt
 * xuống, nên phải vẽ tiếp nội dung cũ thay vì để trống hay co lại giữa chừng.
 */
export function useRetained<T>(value: T | null | undefined): T | null {
  const last = useRef<T | null>(null);
  if (value !== null && value !== undefined) {
    last.current = value;
  }
  return last.current;
}

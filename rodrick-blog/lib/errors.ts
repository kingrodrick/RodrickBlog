/**
 * Đọc lỗi bắt được trong `catch (err)` (kiểu unknown) mà không cần `any`.
 * Lỗi Supabase (PostgrestError) là object thường có `code`/`message`, không phải `Error`,
 * nên các hàm dưới đây kiểm theo trường thay vì `instanceof`.
 */

function readField(err: unknown, field: 'message' | 'code'): string | undefined {
  if (typeof err !== 'object' || err === null || !(field in err)) return undefined;
  const value = (err as Record<string, unknown>)[field];
  return typeof value === 'string' && value ? value : undefined;
}

/** Message của lỗi nếu có, ngược lại trả `fallback`. */
export function getErrorMessage(err: unknown, fallback: string): string {
  return readField(err, 'message') ?? fallback;
}

/** Postgres từ chối vì Row-Level Security (mã 42501). */
export function isRlsError(err: unknown): boolean {
  return (
    readField(err, 'code') === '42501' ||
    (readField(err, 'message')?.includes('row-level security') ?? false)
  );
}

/** Vi phạm ràng buộc unique (mã 23505), ví dụ slug trùng. */
export function isDuplicateKeyError(err: unknown): boolean {
  return (
    readField(err, 'code') === '23505' ||
    (readField(err, 'message')?.includes('duplicate key') ?? false)
  );
}

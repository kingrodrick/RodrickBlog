import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

/**
 * Đọc bảng Supabase qua REST (PostgREST) bằng fetch, không cần thư viện supabase-js.
 * `query` là chuỗi tham số PostgREST, ví dụ: 'select=*,images(*)&order=start_date.desc'.
 */
export async function selectRows<T>(
  table: string,
  query: string,
): Promise<T[]> {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Chưa cấu hình Supabase trong src/shared/api/config.ts.');
  }
  const headers: Record<string, string> = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Accept: 'application/json',
  };
  // Khoá kiểu cũ (JWT "eyJ...") cần thêm Authorization; khoá sb_publishable_ chỉ cần apikey.
  if (SUPABASE_PUBLISHABLE_KEY.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${SUPABASE_PUBLISHABLE_KEY}`;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Lỗi tải dữ liệu (HTTP ${res.status}).`);
  }
  return (await res.json()) as T[];
}

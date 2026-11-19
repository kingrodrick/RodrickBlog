import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

/** Header chung cho REST PostgREST. */
function headers(): Record<string, string> {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Chưa cấu hình Supabase trong src/shared/api/config.ts.');
  }
  const h: Record<string, string> = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Accept: 'application/json',
  };
  // Khoá kiểu cũ (JWT "eyJ...") cần thêm Authorization; khoá sb_publishable_ chỉ cần apikey.
  if (SUPABASE_PUBLISHABLE_KEY.startsWith('eyJ')) {
    h.Authorization = `Bearer ${SUPABASE_PUBLISHABLE_KEY}`;
  }
  return h;
}

async function fail(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => null);
  throw new Error(body?.message ?? `${fallback} (HTTP ${res.status}).`);
}

/**
 * Đọc bảng Supabase qua REST (PostgREST) bằng fetch, không cần thư viện supabase-js.
 * `query` là chuỗi tham số PostgREST, ví dụ: 'select=*,images(*)&order=start_date.desc'.
 */
export async function selectRows<T>(table: string, query: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: headers(),
  });
  if (!res.ok) {
    return fail(res, 'Lỗi tải dữ liệu');
  }
  return (await res.json()) as T[];
}

/** Thêm một dòng, trả về dòng vừa ghi (có id). */
export async function insertRow<T>(table: string, row: object): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      ...headers(),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    return fail(res, 'Lỗi ghi dữ liệu');
  }
  const rows = (await res.json()) as T[];
  return rows[0];
}

/** Xoá các dòng khớp `filter` (cú pháp PostgREST, ví dụ 'event_id=eq.12&seq=eq.1'). */
export async function deleteRows(table: string, filter: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) {
    return fail(res, 'Lỗi xoá dữ liệu');
  }
}

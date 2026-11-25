import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';
import { loadRead, noteCacheHit, saveRead } from './readCache';

/** Mạng chập chờn: chờ tối đa 12 giây rồi dùng bản lưu. */
const READ_TIMEOUT_MS = 12000;

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

/** Gửi lệnh ghi (thêm/sửa/xoá); mất mạng thì báo rõ là chưa lưu. */
async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error('Không có mạng, chưa lưu được thay đổi.');
  }
}

async function fail(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => null);
  throw new Error(body?.message ?? `${fallback} (HTTP ${res.status}).`);
}

/**
 * Đọc bảng Supabase qua REST (PostgREST) bằng fetch, không cần thư viện supabase-js.
 * `query` là chuỗi tham số PostgREST, ví dụ: 'select=*,images(*)&order=start_date.desc'.
 * Đọc được thì lưu lại; mất mạng thì trả bản đã lưu của đúng truy vấn này (xem readCache).
 */
export async function selectRows<T>(table: string, query: string): Promise<T[]> {
  const key = `${table}?${query}`;
  const init = { headers: headers() };

  let res: Response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), READ_TIMEOUT_MS);
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/${key}`, { ...init, signal: controller.signal });
  } catch {
    // Lỗi mạng hoặc quá giờ (không phải lỗi máy chủ): dùng bản lưu nếu có.
    const cached = await loadRead<T>(key);
    if (cached) {
      noteCacheHit(cached.savedAt);
      return cached.rows;
    }
    throw new Error('Không có mạng và chưa có dữ liệu đã lưu cho mục này.');
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    return fail(res, 'Lỗi tải dữ liệu');
  }
  const rows = (await res.json()) as T[];
  await saveRead(key, rows).catch(() => undefined);
  return rows;
}

/** Thêm một dòng, trả về dòng vừa ghi (có id). */
export async function insertRow<T>(table: string, row: object): Promise<T> {
  const res = await send(`${SUPABASE_URL}/rest/v1/${table}`, {
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

/** Cập nhật các dòng khớp `filter` (cú pháp PostgREST, ví dụ 'id=eq.12'). */
export async function updateRows(table: string, filter: string, patch: object): Promise<void> {
  const res = await send(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { ...headers(), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    return fail(res, 'Lỗi cập nhật dữ liệu');
  }
}

/** Xoá các dòng khớp `filter` (cú pháp PostgREST, ví dụ 'event_id=eq.12&seq=eq.1'). */
export async function deleteRows(table: string, filter: string): Promise<void> {
  const res = await send(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) {
    return fail(res, 'Lỗi xoá dữ liệu');
  }
}

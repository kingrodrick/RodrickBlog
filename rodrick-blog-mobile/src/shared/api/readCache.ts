import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Bản lưu cục bộ của các lần đọc Supabase (chỉ dữ liệu, không lưu ảnh).
 * Mỗi truy vấn (bảng + tham số) lưu một bản mới nhất, để mất mạng vẫn xem lại được
 * những gì đã từng mở. Đăng xuất thì xoá hết.
 */
const PREFIX = 'readcache.v1:';
const INDEX_KEY = `${PREFIX}index`;

type Entry<T> = { rows: T[]; savedAt: number };

async function readIndex(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? (list as string[]) : [];
  } catch {
    return [];
  }
}

export async function saveRead<T>(key: string, rows: T[]): Promise<void> {
  const entry: Entry<T> = { rows, savedAt: Date.now() };
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
  const index = await readIndex();
  if (!index.includes(key)) {
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify([...index, key]));
  }
}

export async function loadRead<T>(key: string): Promise<Entry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    const entry = raw ? (JSON.parse(raw) as Entry<T>) : null;
    return entry && Array.isArray(entry.rows) && typeof entry.savedAt === 'number'
      ? entry
      : null;
  } catch {
    return null;
  }
}

/** Xoá mọi bản lưu (khi đăng xuất). */
export async function clearReadCache(): Promise<void> {
  const index = await readIndex();
  await Promise.all(index.map(k => AsyncStorage.removeItem(PREFIX + k)));
  await AsyncStorage.removeItem(INDEX_KEY);
}

// ---------- Ghi nhận lần đọc phải dùng bản lưu ----------

type Hit = { at: number; savedAt: number };
let hits: Hit[] = [];

/** selectRows gọi khi mất mạng và đã trả bản lưu. */
export function noteCacheHit(savedAt: number): void {
  hits = [...hits.slice(-19), { at: Date.now(), savedAt }];
}

/**
 * Từ mốc `since` có lần đọc nào phải dùng bản lưu không; có thì trả thời điểm
 * bản lưu cũ nhất (để báo "đang xem dữ liệu lưu lúc ..."), không thì null.
 */
export function cacheHitSince(since: number): number | null {
  const recent = hits.filter(h => h.at >= since);
  return recent.length ? Math.min(...recent.map(h => h.savedAt)) : null;
}

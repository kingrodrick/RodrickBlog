import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tỉ giá JPY → VND.
 * Nguồn chính: open.er-api.com (miễn phí, không cần key, cập nhật mỗi ngày).
 * Dự phòng: currency-api qua CDN jsdelivr.
 * Mỗi lần tải được thì lưu lại, để khi mất mạng vẫn đổi được bằng tỉ giá gần nhất.
 */
export type ExchangeRate = {
  /** Số đồng cho 1 yên. */
  vndPerJpy: number;
  /** Lúc nguồn cập nhật tỉ giá (ms). */
  sourceUpdatedAt: number;
  /** Lúc app tải về (ms). */
  fetchedAt: number;
  source: 'open.er-api' | 'currency-api';
};

export type RateStatus = 'live' | 'cached' | 'none';

const PRIMARY_URL = 'https://open.er-api.com/v6/latest/JPY';
const FALLBACK_URL =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/jpy.json';
const CACHE_KEY = 'tools.rate.JPY_VND';
const TIMEOUT_MS = 8000;

const isRate = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0;

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fromPrimary(): Promise<ExchangeRate> {
  const json = (await fetchJson(PRIMARY_URL)) as {
    result?: string;
    rates?: { VND?: unknown };
    time_last_update_unix?: unknown;
  };
  const rate = json.rates?.VND;
  if (json.result !== 'success' || !isRate(rate)) {
    throw new Error('Nguồn chính trả dữ liệu không hợp lệ.');
  }
  const updated = typeof json.time_last_update_unix === 'number' ? json.time_last_update_unix * 1000 : Date.now();
  return { vndPerJpy: rate, sourceUpdatedAt: updated, fetchedAt: Date.now(), source: 'open.er-api' };
}

async function fromFallback(): Promise<ExchangeRate> {
  const json = (await fetchJson(FALLBACK_URL)) as { date?: unknown; jpy?: { vnd?: unknown } };
  const rate = json.jpy?.vnd;
  if (!isRate(rate)) {
    throw new Error('Nguồn dự phòng trả dữ liệu không hợp lệ.');
  }
  const day = typeof json.date === 'string' ? Date.parse(`${json.date}T00:00:00Z`) : NaN;
  return {
    vndPerJpy: rate,
    sourceUpdatedAt: Number.isFinite(day) ? day : Date.now(),
    fetchedAt: Date.now(),
    source: 'currency-api',
  };
}

/** Tỉ giá đã lưu lần gần nhất, hoặc null nếu chưa có / hỏng. */
export async function readCachedRate(): Promise<ExchangeRate | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const data = raw ? (JSON.parse(raw) as Partial<ExchangeRate>) : null;
    return data && isRate(data.vndPerJpy) && typeof data.fetchedAt === 'number'
      ? (data as ExchangeRate)
      : null;
  } catch {
    return null;
  }
}

/** Tải tỉ giá mới (nguồn chính rồi dự phòng) và lưu lại. Lỗi cả hai thì ném lỗi. */
export async function fetchLatestRate(): Promise<ExchangeRate> {
  let rate: ExchangeRate;
  try {
    rate = await fromPrimary();
  } catch {
    rate = await fromFallback();
  }
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(rate)).catch(() => undefined);
  return rate;
}

/** Ưu tiên tỉ giá mới; không tải được thì trả tỉ giá đã lưu kèm trạng thái. */
export async function getExchangeRate(): Promise<{ rate: ExchangeRate | null; status: RateStatus }> {
  try {
    return { rate: await fetchLatestRate(), status: 'live' };
  } catch {
    const cached = await readCachedRate();
    return { rate: cached, status: cached ? 'cached' : 'none' };
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getExchangeRate, readCachedRate } from '../src/features/tools/api/exchangeRate';

const CACHE_KEY = 'tools.rate.JPY_VND';
const PRIMARY = { result: 'success', time_last_update_unix: 1764028800, rates: { VND: 172.35 } };
const FALLBACK = { date: '2026-11-25', jpy: { vnd: 171.9 } };

type Reply = { ok: boolean; status?: number; body?: unknown } | Error;

/** Giả lập fetch: trả lần lượt theo thứ tự gọi (nguồn chính trước, dự phòng sau). */
function mockFetch(...replies: Reply[]) {
  const fn = jest.fn(async () => {
    const r = replies.shift();
    if (!r || r instanceof Error) {
      throw r ?? new Error('không có mạng');
    }
    return { ok: r.ok, status: r.status ?? 200, json: async () => r.body };
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

beforeEach(async () => {
  await AsyncStorage.removeItem(CACHE_KEY);
});

describe('tỉ giá JPY → VND', () => {
  it('nguồn chính được thì trả tỉ giá mới và lưu lại', async () => {
    const fetchFn = mockFetch({ ok: true, body: PRIMARY });
    const { rate, status } = await getExchangeRate();

    expect(status).toBe('live');
    expect(rate?.vndPerJpy).toBe(172.35);
    expect(rate?.source).toBe('open.er-api');
    expect(rate?.sourceUpdatedAt).toBe(1764028800 * 1000);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect((await readCachedRate())?.vndPerJpy).toBe(172.35);
  });

  it('nguồn chính lỗi thì dùng nguồn dự phòng', async () => {
    const fetchFn = mockFetch({ ok: false, status: 500 }, { ok: true, body: FALLBACK });
    const { rate, status } = await getExchangeRate();

    expect(status).toBe('live');
    expect(rate?.vndPerJpy).toBe(171.9);
    expect(rate?.source).toBe('currency-api');
    expect(rate?.sourceUpdatedAt).toBe(Date.parse('2026-11-25T00:00:00Z'));
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('dữ liệu nguồn chính sai cũng chuyển sang dự phòng', async () => {
    mockFetch({ ok: true, body: { result: 'error' } }, { ok: true, body: FALLBACK });
    expect((await getExchangeRate()).rate?.vndPerJpy).toBe(171.9);
  });

  it('mất mạng thì dùng tỉ giá đã lưu', async () => {
    mockFetch({ ok: true, body: PRIMARY });
    await getExchangeRate();

    mockFetch(new Error('offline'), new Error('offline'));
    const { rate, status } = await getExchangeRate();
    expect(status).toBe('cached');
    expect(rate?.vndPerJpy).toBe(172.35);
  });

  it('mất mạng và chưa lưu lần nào thì không có tỉ giá', async () => {
    mockFetch(new Error('offline'), new Error('offline'));
    expect(await getExchangeRate()).toEqual({ rate: null, status: 'none' });
  });

  it('bản lưu hỏng thì coi như chưa có', async () => {
    await AsyncStorage.setItem(CACHE_KEY, '{hỏng');
    expect(await readCachedRate()).toBeNull();
  });
});

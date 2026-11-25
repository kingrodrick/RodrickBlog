import { selectRows } from '../src/shared/api/supabase';
import { cacheHitSince, clearReadCache, loadRead } from '../src/shared/api/readCache';

jest.mock('../src/shared/api/config', () => ({
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
}));

const KEY = 'trips?select=id,title';

function mockFetch(impl: () => Promise<unknown>) {
  const fn = jest.fn(impl);
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

const ok = (body: unknown) => async () => ({ ok: true, status: 200, json: async () => body });
const offline = async () => {
  throw new TypeError('Network request failed');
};

beforeEach(async () => {
  await clearReadCache();
});

describe('lưu dữ liệu đã đọc để xem khi mất mạng', () => {
  it('đọc được thì lưu lại, không tính là dùng bản lưu', async () => {
    const started = Date.now();
    mockFetch(ok([{ id: 1, title: 'Tokyo' }]));

    expect(await selectRows('trips', 'select=id,title')).toEqual([{ id: 1, title: 'Tokyo' }]);
    expect((await loadRead(KEY))?.rows).toEqual([{ id: 1, title: 'Tokyo' }]);
    expect(cacheHitSince(started)).toBeNull();
  });

  it('mất mạng thì trả bản đã lưu và ghi nhận thời điểm lưu', async () => {
    mockFetch(ok([{ id: 1, title: 'Tokyo' }]));
    await selectRows('trips', 'select=id,title');
    const savedAt = (await loadRead(KEY))?.savedAt;

    const started = Date.now();
    mockFetch(offline);
    expect(await selectRows('trips', 'select=id,title')).toEqual([{ id: 1, title: 'Tokyo' }]);
    expect(cacheHitSince(started)).toBe(savedAt);
  });

  it('mất mạng và chưa từng mở thì báo lỗi', async () => {
    mockFetch(offline);
    await expect(selectRows('trips', 'select=id,title')).rejects.toThrow('chưa có dữ liệu đã lưu');
  });

  it('lỗi máy chủ không dùng bản lưu (để thấy lỗi thật)', async () => {
    mockFetch(ok([{ id: 1 }]));
    await selectRows('trips', 'select=id,title');
    mockFetch(async () => ({ ok: false, status: 400, json: async () => ({ message: 'Sai truy vấn' }) }));
    await expect(selectRows('trips', 'select=id,title')).rejects.toThrow('Sai truy vấn');
  });

  it('mỗi truy vấn lưu riêng, đăng xuất xoá hết', async () => {
    mockFetch(ok([{ id: 1 }]));
    await selectRows('trips', 'select=id,title');
    mockFetch(ok([{ id: 9 }]));
    await selectRows('trips', 'select=id,title&id=eq.9');

    expect((await loadRead(KEY))?.rows).toEqual([{ id: 1 }]);
    expect((await loadRead('trips?select=id,title&id=eq.9'))?.rows).toEqual([{ id: 9 }]);

    await clearReadCache();
    expect(await loadRead(KEY)).toBeNull();
    expect(await loadRead('trips?select=id,title&id=eq.9')).toBeNull();
  });
});

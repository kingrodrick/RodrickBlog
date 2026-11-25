jest.mock('../src/shared/api/config', () => ({
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'key',
  WEB_API_BASE_URL: 'https://blog.example',
}));

import { deletePhotos, PAGE_SIZE, photosQuery } from '../src/features/galleries/api/photos';
import { Photo } from '../src/features/galleries/types';

describe('photosQuery', () => {
  it('tất cả ảnh: mới chụp nhất trước, phân trang theo offset', () => {
    const q = photosQuery(120);
    expect(q).toContain('order=taken_at.desc.nullslast,created_at.desc,id.desc');
    expect(q).toContain(`limit=${PAGE_SIZE}&offset=120`);
    expect(q).not.toContain('collection_id');
  });

  it('lọc theo bộ sưu tập', () => {
    expect(photosQuery(0, { collectionId: 7 })).toContain('&collection_id=eq.7&');
  });

  it('lọc loại ảnh: ảnh cũ để trống is_real_photo vẫn tính là ảnh thực tế', () => {
    expect(photosQuery(0, { filter: 'real' })).toContain('&is_real_photo=not.is.false&');
    expect(photosQuery(0, { filter: 'reference' })).toContain('&is_real_photo=is.false&');
    expect(photosQuery(0, { filter: 'all' })).not.toContain('is_real_photo=');
  });
});

const photo = (id: number): Photo => ({
  id,
  url: `https://res.cloudinary.com/demo/image/upload/v1/a/${id}.png`,
  caption: null,
  city: null,
  cameraGear: null,
  takenAt: null,
  isReal: false,
});

const json = (body: unknown, ok = true) =>
  Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) } as Response);

describe('deletePhotos', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('xoá file Cloudinary từng ảnh (file đã mất vẫn tính là xong), rồi xoá DB một lệnh', async () => {
    const calls: { url: string; method?: string; body?: string }[] = [];
    globalThis.fetch = jest.fn((url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method, body: init?.body as string });
      if (url.endsWith('/api/cloudinary/delete')) {
        const result = (init?.body as string).includes('/2.png') ? 'not found' : 'ok';
        return json({ success: true, result: { result } });
      }
      return json(null);
    }) as unknown as typeof fetch;

    const res = await deletePhotos([photo(1), photo(2)]);

    expect(res).toEqual({ cdnFailed: 0 });
    expect(calls.filter(c => c.url.endsWith('/api/cloudinary/delete'))).toHaveLength(2);
    const db = calls.find(c => c.method === 'DELETE');
    expect(db?.url).toBe('https://example.supabase.co/rest/v1/images?id=in.(1,2)');
  });

  it('Cloudinary lỗi: vẫn xoá DB và báo số file chưa xoá', async () => {
    globalThis.fetch = jest.fn((url: string) =>
      url.endsWith('/api/cloudinary/delete') ? json(null, false) : json(null),
    ) as unknown as typeof fetch;

    await expect(deletePhotos([photo(3)])).resolves.toEqual({ cdnFailed: 1 });
  });

  it('DB lỗi thì báo lỗi', async () => {
    globalThis.fetch = jest.fn((url: string) =>
      url.endsWith('/api/cloudinary/delete')
        ? json({ success: true, result: { result: 'ok' } })
        : json({ message: 'boom' }, false),
    ) as unknown as typeof fetch;

    await expect(deletePhotos([photo(4)])).rejects.toThrow();
  });
});

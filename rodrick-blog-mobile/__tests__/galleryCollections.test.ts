jest.mock('../src/shared/api/config', () => ({
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'key',
}));

import {
  CollectionInfo,
  fetchCollectionInfo,
  fetchCollections,
  normalizeSlug,
  saveCollectionOrder,
  updateCollectionInfo,
} from '../src/features/galleries/api/collections';
import { moveItem } from '../src/features/galleries/components/ReorderList';

describe('fetchCollections', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('bìa: cover_image trước, không có thì ảnh mới nhất; đếm ảnh và tên chuyến', async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            {
              id: 1,
              title: 'Kyoto',
              description: null,
              cover_image: 'https://x/cover.jpg',
              trip: { title: 'Nhật Bản 12/2026' },
              photos: [{ count: 5 }],
              cover: [{ cloudinary_url: 'https://x/newest.jpg' }],
            },
            {
              id: 2,
              title: 'Tokyo',
              description: 'Neon',
              cover_image: null,
              trip: null,
              photos: [{ count: 0 }],
              cover: [],
            },
          ]),
      } as Response),
    ) as unknown as typeof fetch;

    const [a, b] = await fetchCollections();
    expect(a).toMatchObject({ coverUrl: 'https://x/cover.jpg', photoCount: 5, tripTitle: 'Nhật Bản 12/2026' });
    expect(b).toMatchObject({ coverUrl: null, photoCount: 0, tripTitle: null, description: 'Neon' });
  });
});

describe('thông tin bộ sưu tập', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });
  const respond = (body: unknown, ok = true) =>
    Promise.resolve({ ok, status: ok ? 200 : 409, json: () => Promise.resolve(body) } as Response);
  const record = () => {
    const calls: { url: string; method?: string; body?: string }[] = [];
    globalThis.fetch = jest.fn((url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method, body: init?.body as string });
      return respond(null);
    }) as unknown as typeof fetch;
    return calls;
  };
  const base: CollectionInfo = {
    title: 'Kyoto',
    slug: 'kyoto',
    description: null,
    locationTag: null,
    coverImage: null,
    tripId: null,
  };

  it('đọc đủ các cột sửa được', async () => {
    globalThis.fetch = jest.fn(() =>
      respond([
        {
          title: 'Kyoto',
          slug: 'kyoto-ancient-streets',
          description: null,
          location_tag: 'Kyoto, JP',
          cover_image: 'https://c/x.jpg',
          trip_id: 4,
        },
      ]),
    ) as unknown as typeof fetch;
    await expect(fetchCollectionInfo(3)).resolves.toEqual({
      title: 'Kyoto',
      slug: 'kyoto-ancient-streets',
      description: null,
      locationTag: 'Kyoto, JP',
      coverImage: 'https://c/x.jpg',
      tripId: 4,
    });
    expect((globalThis.fetch as jest.Mock).mock.calls[0][0]).toContain('&id=eq.3');
  });

  it('lưu: cắt khoảng trắng, chữ trống thành null, slug chuẩn hoá, gán chuyến', async () => {
    const calls = record();
    await updateCollectionInfo(3, {
      title: ' Kyoto ',
      slug: 'Phố Cổ Đẹp',
      description: '  ',
      locationTag: ' Kyoto, JP ',
      coverImage: 'https://c/y.jpg',
      tripId: 7,
    });
    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].url).toBe('https://example.supabase.co/rest/v1/collections?id=eq.3');
    expect(JSON.parse(calls[0].body ?? '')).toEqual({
      title: 'Kyoto',
      slug: 'pho-co-dep',
      description: null,
      location_tag: 'Kyoto, JP',
      cover_image: 'https://c/y.jpg',
      trip_id: 7,
    });
  });

  it('tên hoặc slug trống thì báo lỗi, không gọi mạng', async () => {
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
    await expect(updateCollectionInfo(3, { ...base, title: ' ' })).rejects.toThrow();
    await expect(updateCollectionInfo(3, { ...base, slug: ' -- ' })).rejects.toThrow();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('slug trùng bộ khác: báo lỗi dễ hiểu', async () => {
    globalThis.fetch = jest.fn(() =>
      respond(
        { message: 'duplicate key value violates unique constraint "collections_slug_key"' },
        false,
      ),
    ) as unknown as typeof fetch;
    await expect(updateCollectionInfo(3, base)).rejects.toThrow('Slug "kyoto" đã có bộ sưu tập khác dùng.');
  });

  it('normalizeSlug: bỏ dấu, chữ thường, gạch nối', () => {
    expect(normalizeSlug('  Kyoto: Những Con Hẻm Cổ Kính ')).toBe('kyoto-nhung-con-hem-co-kinh');
    expect(normalizeSlug('Đà Lạt 2026')).toBe('da-lat-2026');
    expect(normalizeSlug('--a__b--')).toBe('a-b');
  });

  it('lưu thứ tự: không đổi thì không gửi, có đổi thì ghi lại cả dãy từ 1', async () => {
    let calls = record();
    await saveCollectionOrder([1, 2, 3], [1, 2, 3]);
    expect(calls).toHaveLength(0);

    calls = record();
    await saveCollectionOrder([1, 2, 3], [3, 1, 2]);
    const sent = calls
      .map(c => ({ url: c.url.split('?')[1], body: JSON.parse(c.body ?? '') }))
      .sort((a, b) => a.body.display_order - b.body.display_order);
    expect(sent).toEqual([
      { url: 'id=eq.3', body: { display_order: 1 } },
      { url: 'id=eq.1', body: { display_order: 2 } },
      { url: 'id=eq.2', body: { display_order: 3 } },
    ]);
  });
});

describe('moveItem', () => {
  it('kéo xuống và kéo lên', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });
});

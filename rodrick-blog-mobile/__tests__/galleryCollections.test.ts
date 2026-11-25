jest.mock('../src/shared/api/config', () => ({
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'key',
}));

import { fetchCollections } from '../src/features/galleries/api/collections';

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

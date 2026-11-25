jest.mock('../src/shared/api/config', () => ({
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'key',
}));

import { fetchCollectionChoices } from '../src/features/trips/api/collectionApi';

const respond = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);

function mockDb(collections: { id: number; title: string; trip_id: number | null }[], tripId: number | null) {
  globalThis.fetch = jest.fn((url: string) =>
    respond(url.includes('/collections?') ? collections : [{ trip_id: tripId }]),
  ) as unknown as typeof fetch;
}

describe('fetchCollectionChoices', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  const rows = [
    { id: 1, title: 'Kyoto', trip_id: null },
    { id: 2, title: 'Tokyo', trip_id: 5 },
    { id: 3, title: 'Osaka', trip_id: 6 },
  ];

  it('bộ của chuyến chứa mốc đứng đầu và được chọn sẵn khi chỉ có một', async () => {
    mockDb(rows, 5);
    const r = await fetchCollectionChoices(9);
    expect(r.options.map(o => o.id)).toEqual([2, 1, 3]);
    expect(r.suggestedId).toBe(2);
  });

  it('chuyến có nhiều bộ hoặc không có bộ nào: không chọn sẵn', async () => {
    mockDb([...rows, { id: 4, title: 'Nara', trip_id: 5 }], 5);
    expect((await fetchCollectionChoices(9)).suggestedId).toBeNull();
    mockDb(rows, 7);
    const r = await fetchCollectionChoices(9);
    expect(r.suggestedId).toBeNull();
    expect(r.options.map(o => o.id)).toEqual([1, 2, 3]);
  });
});

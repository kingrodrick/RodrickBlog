import { findMapsUrlInHtml, parseMapsLink } from '../src/features/trips/parseMapsLink';
import { buildDirectionsUrl } from '../src/features/trips/maps';

describe('parseMapsLink', () => {
  it('đọc dạng API', () => {
    expect(
      parseMapsLink(
        'https://www.google.com/maps/dir/?api=1&origin=A&destination=B&waypoints=C%7CD&travelmode=transit',
      ),
    ).toEqual({ origin: 'A', waypoints: ['C', 'D'], destination: 'B', mode: 'transit' });
  });

  it('đọc dạng đường dẫn có phương tiện', () => {
    expect(
      parseMapsLink(
        'https://www.google.com/maps/dir/Ga+Kyoto/Chùa+Kiyomizu/@34.99,135.76,14z/data=!4m2!4m1!3e2?entry=ttu',
      ),
    ).toEqual({
      origin: 'Ga Kyoto',
      waypoints: [],
      destination: 'Chùa Kiyomizu',
      mode: 'walking',
      departAt: null,
    });
  });

  it('đọc dạng đường dẫn không có điểm đi (vị trí hiện tại)', () => {
    expect(parseMapsLink('https://www.google.com/maps/dir//Fushimi+Inari/data=!3e3')).toEqual({
      origin: null,
      waypoints: [],
      destination: 'Fushimi Inari',
      mode: 'transit',
      departAt: null,
    });
  });

  it('đọc dạng cũ saddr/daddr trên maps.google.com', () => {
    expect(parseMapsLink('https://maps.google.com/maps?saddr=A&daddr=B+to:C&dirflg=w')).toEqual({
      origin: 'A',
      waypoints: ['B'],
      destination: 'C',
      mode: 'walking',
    });
  });

  it('đọc link nằm trong trang xin đồng ý cookie', () => {
    const inner = encodeURIComponent('https://www.google.com/maps/dir/A/B/data=!3e0');
    expect(parseMapsLink(`https://consent.google.com/ml?continue=${inner}&gl=VN`)).toEqual({
      origin: 'A',
      waypoints: [],
      destination: 'B',
      mode: 'driving',
      departAt: null,
    });
  });

  it('trả null với link không phải Google Maps', () => {
    expect(parseMapsLink('https://example.com/maps/dir/A/B')).toBeNull();
    expect(parseMapsLink('https://www.google.com/search?q=A')).toBeNull();
  });
});

describe('findMapsUrlInHtml', () => {
  it('lấy link Google Maps trong HTML đã mã hoá', () => {
    const html = '<script>x="https:\\/\\/www.google.com\\/maps\\/dir\\/A\\/B?api\\u003d1"</script>';
    expect(findMapsUrlInHtml(html)).toBe('https://www.google.com/maps/dir/A/B?api=1');
  });
});

describe('giờ xuất phát', () => {
  // 1765786500 = 2025-12-15T08:15:00 (giờ địa phương mã hoá như UTC).
  const link =
    'https://www.google.com/maps/dir/Ga+Kyoto/Fushimi+Inari/data=!4m6!4m5!2m3!6e0!7e2!8j1765786500!3e3';

  it('đọc giờ xuất phát từ data=', () => {
    expect(parseMapsLink(link)?.departAt).toBe('2025-12-15T08:15:00');
  });

  it('bỏ qua "Đến lúc" (!6e1)', () => {
    expect(parseMapsLink(link.replace('!6e0', '!6e1'))?.departAt).toBeNull();
  });

  it('dựng lại link có giờ xuất phát, đọc ngược ra đúng giá trị', () => {
    const url = buildDirectionsUrl(
      {
        id: 1,
        seq: 1,
        origin_name: 'Ga Kyoto',
        origin_lat: null,
        origin_lng: null,
        destination_name: 'Fushimi Inari',
        destination_lat: null,
        destination_lng: null,
        waypoints: [],
        travel_mode: 'transit',
        depart_at: '2025-12-15T08:15:00',
      },
      'Kyoto',
    );
    expect(url).toContain('/data=!4m6!4m5!2m3!6e0!7e2!8j1765786500!3e3');
    expect(parseMapsLink(url)?.departAt).toBe('2025-12-15T08:15:00');
  });
});

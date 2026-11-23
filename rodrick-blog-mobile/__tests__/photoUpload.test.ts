import { hostOf, parseImageUrl, upgradePinterestUrl } from '../src/features/trips/photoUpload';

describe('upgradePinterestUrl', () => {
  it('đổi ảnh nhỏ của Pinterest sang 736x', () => {
    expect(upgradePinterestUrl('https://i.pinimg.com/236x/ab/cd/ef.jpg')).toBe('https://i.pinimg.com/736x/ab/cd/ef.jpg');
    expect(upgradePinterestUrl('https://i.pinimg.com/474x/ab/cd/ef.jpg')).toBe('https://i.pinimg.com/736x/ab/cd/ef.jpg');
  });

  it('địa chỉ khác giữ nguyên', () => {
    expect(upgradePinterestUrl('https://example.com/236x/a.jpg')).toBe('https://example.com/236x/a.jpg');
  });
});

describe('parseImageUrl', () => {
  it('nhận địa chỉ http(s)', () => {
    expect(parseImageUrl(' https://a.com/x.jpg ')).toBe('https://a.com/x.jpg');
  });

  it('từ chối địa chỉ không hợp lệ', () => {
    expect(parseImageUrl('abc')).toBeNull();
    expect(parseImageUrl('file:///x.jpg')).toBeNull();
    expect(parseImageUrl('https://user@evil.com/x.jpg')).toBeNull();
    expect(parseImageUrl('https://a.com/x y.jpg')).toBeNull();
  });
});

describe('hostOf', () => {
  it('lấy tên miền', () => {
    expect(hostOf('https://i.pinimg.com/736x/a.jpg')).toBe('i.pinimg.com');
  });
});

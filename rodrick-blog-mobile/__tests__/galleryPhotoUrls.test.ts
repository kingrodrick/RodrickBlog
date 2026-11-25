import { PixelRatio } from 'react-native';
import { gridThumbUrl, viewerUrl } from '../src/features/galleries/photoUrls';

const SRC = 'https://res.cloudinary.com/demo/image/upload/v1/a/1.jpg';

describe('địa chỉ ảnh của tab Ảnh', () => {
  it('ảnh nhỏ của lưới giữ tỉ lệ (không cắt vuông) để màn xem dùng lại làm ảnh tạm', () => {
    const url = gridThumbUrl(SRC);
    expect(url).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_540,h_540/v1/a/1.jpg');
    expect(url).not.toContain('c_fill');
  });

  it('ảnh nét vừa màn theo cạnh dài, xoay máy không đổi địa chỉ, tối đa 2560', () => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(3);
    expect(viewerUrl(SRC, 400, 900)).toContain('c_limit,w_2560,h_2560');
    expect(viewerUrl(SRC, 400, 800)).toBe(viewerUrl(SRC, 800, 400));
    jest.spyOn(PixelRatio, 'get').mockReturnValue(2);
    expect(viewerUrl(SRC, 400, 800)).toContain('c_limit,w_1600,h_1600');
  });
});

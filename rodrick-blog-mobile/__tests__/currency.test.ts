import {
  appendThousands,
  convert,
  formatAmountInput,
  formatJpy,
  formatRate,
  formatResult,
  formatVnd,
  parseAmount,
} from '../src/features/tools/currency';

describe('đọc số tiền', () => {
  it('bỏ dấu chấm nhóm, nhận dấu phẩy thập phân', () => {
    expect(parseAmount('1.000.000')).toBe(1000000);
    expect(parseAmount('1,5')).toBe(1.5);
    expect(parseAmount(' 2.500 ₫')).toBe(2500);
    expect(parseAmount('¥1.000')).toBe(1000);
  });

  it('trống hoặc sai trả null', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('1,2,3')).toBeNull();
  });
});

describe('định dạng khi đang gõ', () => {
  it('chèn dấu nhóm nghìn', () => {
    expect(formatAmountInput('1000000')).toBe('1.000.000');
    expect(formatAmountInput('1.0000')).toBe('10.000');
  });

  it('giữ dấu phẩy và tối đa 2 số thập phân', () => {
    expect(formatAmountInput('12,')).toBe('12,');
    expect(formatAmountInput('12,345')).toBe('12,34');
    expect(formatAmountInput(',5')).toBe('0,5');
  });

  it('bỏ số 0 ở đầu và ký tự lạ', () => {
    expect(formatAmountInput('007a')).toBe('7');
    expect(formatAmountInput('')).toBe('');
  });
});

describe('nút 000', () => {
  it('nhân số đang nhập lên 1.000', () => {
    expect(appendThousands('5')).toBe('5.000');
    expect(appendThousands('50.000')).toBe('50.000.000');
    expect(appendThousands('1,5')).toBe('1.500');
  });

  it('ô trống hoặc bằng 0 thì giữ nguyên', () => {
    expect(appendThousands('')).toBe('');
    expect(appendThousands('0')).toBe('0');
  });
});

describe('đổi tiền hai chiều', () => {
  const rate = 172.5;

  it('yên sang đồng', () => {
    expect(convert(1000, 'JPY_TO_VND', rate)).toBe(172500);
    expect(formatResult(1000 * rate, 'JPY_TO_VND')).toBe('172.500 ₫');
  });

  it('đồng sang yên, làm tròn tới yên', () => {
    expect(convert(1000000, 'VND_TO_JPY', rate)).toBeCloseTo(5797.1, 1);
    expect(formatResult(1000000 / rate, 'VND_TO_JPY')).toBe('¥5.797');
  });

  it('định dạng tiền và tỉ giá', () => {
    expect(formatVnd(1234567.4)).toBe('1.234.567 ₫');
    expect(formatJpy(999.5)).toBe('¥1.000');
    expect(formatRate(172.3456)).toBe('172,35');
    expect(formatRate(1234.5)).toBe('1.234,50');
  });
});

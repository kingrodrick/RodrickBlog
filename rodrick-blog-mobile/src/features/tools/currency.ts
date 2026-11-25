/**
 * Logic thuần cho công cụ đổi tiền VND ⇄ JPY.
 * Định dạng kiểu Việt Nam: dấu chấm nhóm nghìn, dấu phẩy thập phân.
 * Tự dựng chuỗi thay vì dùng Intl để kết quả giống nhau trên mọi máy.
 */
export type Direction = 'VND_TO_JPY' | 'JPY_TO_VND';

const pad = (n: number) => String(n).padStart(2, '0');

/** "1234567" → "1.234.567" */
function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Đọc số tiền người dùng gõ: "1.000.000" → 1000000, "1,5" → 1.5. Trống/sai → null. */
export function parseAmount(text: string): number | null {
  const clean = text.replace(/[\s.₫¥]/g, '').replace(',', '.');
  if (!clean || !/^\d+(\.\d*)?$/.test(clean)) {
    return null;
  }
  const value = Number(clean);
  return Number.isFinite(value) ? value : null;
}

/**
 * Chèn dấu nhóm ngay khi đang gõ. Giữ dấu phẩy cuối ("12,") để gõ tiếp phần thập phân,
 * tối đa 2 chữ số thập phân.
 */
export function formatAmountInput(text: string): string {
  const kept = text.replace(/[^\d,]/g, '');
  const commaAt = kept.indexOf(',');
  const intPart = (commaAt === -1 ? kept : kept.slice(0, commaAt)).replace(/^0+(?=\d)/, '');
  const grouped = groupDigits(intPart);
  if (commaAt === -1) {
    return grouped;
  }
  const decimals = kept.slice(commaAt + 1).replace(/,/g, '').slice(0, 2);
  return `${grouped || '0'},${decimals}`;
}

/** Nút "000": nhân số đang nhập lên 1.000 ("5" → "5.000"). Ô trống thì giữ nguyên. */
export function appendThousands(input: string): string {
  const amount = parseAmount(input);
  return amount === null || amount === 0
    ? input
    : formatAmountInput(String(Math.round(amount * 1000)));
}

export function convert(amount: number, direction: Direction, vndPerJpy: number): number {
  return direction === 'VND_TO_JPY' ? amount / vndPerJpy : amount * vndPerJpy;
}

/** 1234567.4 → "1.234.567 ₫" */
export function formatVnd(value: number): string {
  return `${groupDigits(String(Math.round(value)))} ₫`;
}

/** 1234.6 → "¥1.235" */
export function formatJpy(value: number): string {
  return `¥${groupDigits(String(Math.round(value)))}`;
}

/** Định dạng theo đơn vị của kết quả (chiều đổi). */
export function formatResult(value: number, direction: Direction): string {
  return direction === 'VND_TO_JPY' ? formatJpy(value) : formatVnd(value);
}

/** Tỉ giá 2 chữ số thập phân: 172.3456 → "172,35" */
export function formatRate(vndPerJpy: number): string {
  const [intPart, dec] = vndPerJpy.toFixed(2).split('.');
  return `${groupDigits(intPart)},${dec}`;
}

/** Mốc thời gian theo giờ máy: "07:00 25/11/2026". */
export function formatStamp(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

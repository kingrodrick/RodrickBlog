/**
 * Bảng cách đọc tiền Nhật cho người Việt: kanji, romaji và phiên âm gần đúng.
 * Người Nhật nhóm số theo 4 chữ số (万 man = 10.000), khác cách nhóm 3 số của mình.
 */
export type YenReading = {
  yen: number;
  kanji: string;
  romaji: string;
  /** Phiên âm kiểu Việt, gần đúng để đọc theo. */
  phonetic: string;
};

/** Các đơn vị chính, từ nhỏ tới lớn. */
export const YEN_UNITS: YenReading[] = [
  { yen: 1, kanji: '一円', romaji: 'ichi en', phonetic: 'i-chi en' },
  { yen: 10, kanji: '十円', romaji: 'juu en', phonetic: 'giu en' },
  { yen: 100, kanji: '百円', romaji: 'hyaku en', phonetic: 'hi-a-cư en' },
  { yen: 1000, kanji: '千円', romaji: 'sen en', phonetic: 'xen en' },
  { yen: 10000, kanji: '一万円', romaji: 'ichi man en', phonetic: 'i-chi man en' },
  { yen: 100000, kanji: '十万円', romaji: 'juu man en', phonetic: 'giu man en' },
  { yen: 1000000, kanji: '百万円', romaji: 'hyaku man en', phonetic: 'hi-a-cư man en' },
  { yen: 10000000, kanji: '一千万円', romaji: 'issen man en', phonetic: 'ít-xen man en' },
  { yen: 100000000, kanji: '一億円', romaji: 'ichi oku en', phonetic: 'i-chi ô-cư en' },
];

/** Số đọc biến âm hay gặp khi trả tiền. */
export const YEN_IRREGULAR: YenReading[] = [
  { yen: 300, kanji: '三百円', romaji: 'sanbyaku en', phonetic: 'xan-bi-a-cư en' },
  { yen: 600, kanji: '六百円', romaji: 'roppyaku en', phonetic: 'rốp-pi-a-cư en' },
  { yen: 800, kanji: '八百円', romaji: 'happyaku en', phonetic: 'háp-pi-a-cư en' },
  { yen: 3000, kanji: '三千円', romaji: 'sanzen en', phonetic: 'xan-den en' },
  { yen: 8000, kanji: '八千円', romaji: 'hassen en', phonetic: 'hát-xen en' },
  { yen: 50000, kanji: '五万円', romaji: 'go man en', phonetic: 'gô man en' },
];

/** Số đếm 1 tới 9, ghép trước đơn vị: 5.000 = go + sen. */
export const JP_DIGITS: { digit: number; kanji: string; romaji: string; phonetic: string }[] = [
  { digit: 1, kanji: '一', romaji: 'ichi', phonetic: 'i-chi' },
  { digit: 2, kanji: '二', romaji: 'ni', phonetic: 'ni' },
  { digit: 3, kanji: '三', romaji: 'san', phonetic: 'xan' },
  { digit: 4, kanji: '四', romaji: 'yon', phonetic: 'yôn' },
  { digit: 5, kanji: '五', romaji: 'go', phonetic: 'gô' },
  { digit: 6, kanji: '六', romaji: 'roku', phonetic: 'rô-cư' },
  { digit: 7, kanji: '七', romaji: 'nana', phonetic: 'na-na' },
  { digit: 8, kanji: '八', romaji: 'hachi', phonetic: 'ha-chi' },
  { digit: 9, kanji: '九', romaji: 'kyuu', phonetic: 'kiu' },
];

// ---------- Đọc một số yên bất kỳ ----------

const ONES_RO = ['', 'ichi', 'ni', 'san', 'yon', 'go', 'roku', 'nana', 'hachi', 'kyuu'];
const ONES_PH = ['', 'i-chi', 'ni', 'xan', 'yôn', 'gô', 'rô-cư', 'na-na', 'ha-chi', 'kiu'];
const ONES_KJ = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

type Part = { ro: string; ph: string; kj: string };

/** Hàng trăm có biến âm: 300 sanbyaku, 600 roppyaku, 800 happyaku. */
const HUNDREDS: Record<number, [string, string]> = {
  1: ['hyaku', 'hi-a-cư'],
  3: ['sanbyaku', 'xan-bi-a-cư'],
  6: ['roppyaku', 'rốp-pi-a-cư'],
  8: ['happyaku', 'háp-pi-a-cư'],
};

/** Hàng nghìn có biến âm: 3000 sanzen, 8000 hassen. */
const THOUSANDS: Record<number, [string, string]> = {
  1: ['sen', 'xen'],
  3: ['sanzen', 'xan-den'],
  8: ['hassen', 'hát-xen'],
};

/**
 * Đọc nhóm 4 số (1..9999).
 * `beforeUnit`: nhóm đứng trước 万/億 (1000 man đọc issen man, viết 一千万).
 * `last`: nhóm cuối đứng trước 円 (4 yên đọc "yo en").
 */
function readGroup(n: number, beforeUnit: boolean, last: boolean): Part[] {
  const th = Math.floor(n / 1000);
  const hu = Math.floor(n / 100) % 10;
  const te = Math.floor(n / 10) % 10;
  const on = n % 10;
  const parts: Part[] = [];

  if (th) {
    if (th === 1 && beforeUnit) {
      parts.push({ ro: 'issen', ph: 'ít-xen', kj: '一千' });
    } else {
      const [ro, ph] = THOUSANDS[th] ?? [`${ONES_RO[th]}sen`, `${ONES_PH[th]}-xen`];
      parts.push({ ro, ph, kj: `${th === 1 ? '' : ONES_KJ[th]}千` });
    }
  }
  if (hu) {
    const [ro, ph] = HUNDREDS[hu] ?? [`${ONES_RO[hu]}hyaku`, `${ONES_PH[hu]}-hi-a-cư`];
    parts.push({ ro, ph, kj: `${hu === 1 ? '' : ONES_KJ[hu]}百` });
  }
  if (te) {
    parts.push(
      te === 1
        ? { ro: 'juu', ph: 'giu', kj: '十' }
        : { ro: `${ONES_RO[te]}juu`, ph: `${ONES_PH[te]}-giu`, kj: `${ONES_KJ[te]}十` },
    );
  }
  if (on) {
    parts.push(
      on === 4 && last
        ? { ro: 'yo', ph: 'yô', kj: '四' }
        : { ro: ONES_RO[on], ph: ONES_PH[on], kj: ONES_KJ[on] },
    );
  }
  return parts;
}

export type YenSpoken = { romaji: string; phonetic: string; kanji: string };

/**
 * Cách đọc một số yên: 15000 → "ichi man gosen en" / "i-chi man gô-xen en" / "一万五千円".
 * Làm tròn tới yên. Trả null khi ≤ 0 hoặc từ 1 nghìn tỉ (兆) trở lên.
 */
export function readYen(value: number): YenSpoken | null {
  const n = Math.round(value);
  if (!Number.isFinite(n) || n <= 0 || n >= 1e12) {
    return null;
  }
  const oku = Math.floor(n / 1e8);
  const man = Math.floor(n / 1e4) % 1e4;
  const rest = n % 1e4;

  const parts: Part[] = [];
  if (oku) {
    parts.push(...readGroup(oku, true, false), { ro: 'oku', ph: 'ô-cư', kj: '億' });
  }
  if (man) {
    parts.push(...readGroup(man, true, false), { ro: 'man', ph: 'man', kj: '万' });
  }
  parts.push(...readGroup(rest, false, true), { ro: 'en', ph: 'en', kj: '円' });

  // 1 man / 1 oku phải đọc rõ "ichi": readGroup(1) đã cho "ichi", không cần xử lý thêm.
  return {
    romaji: parts.map(p => p.ro).join(' '),
    phonetic: parts.map(p => p.ph).join(' '),
    kanji: parts.map(p => p.kj).join(''),
  };
}

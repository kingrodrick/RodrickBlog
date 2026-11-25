import { readYen } from '../src/features/tools/yenReading';

const ro = (n: number) => readYen(n)?.romaji;
const kj = (n: number) => readYen(n)?.kanji;

describe('đọc số yên', () => {
  it('đơn vị cơ bản', () => {
    expect(ro(1)).toBe('ichi en');
    expect(ro(10)).toBe('juu en');
    expect(ro(100)).toBe('hyaku en');
    expect(ro(1000)).toBe('sen en');
    expect(ro(10000)).toBe('ichi man en');
    expect(ro(100000000)).toBe('ichi oku en');
  });

  it('nhóm 4 số theo man', () => {
    expect(ro(15000)).toBe('ichi man gosen en');
    expect(ro(150000)).toBe('juu go man en');
    expect(ro(50000)).toBe('go man en');
    expect(ro(10000000)).toBe('issen man en');
    expect(ro(123456789)).toBe(
      'ichi oku nisen sanbyaku yonjuu go man rokusen nanahyaku hachijuu kyuu en',
    );
  });

  it('số biến âm', () => {
    expect(ro(300)).toBe('sanbyaku en');
    expect(ro(600)).toBe('roppyaku en');
    expect(ro(800)).toBe('happyaku en');
    expect(ro(3000)).toBe('sanzen en');
    expect(ro(8000)).toBe('hassen en');
    expect(ro(4)).toBe('yo en');
    expect(ro(1234)).toBe('sen nihyaku sanjuu yo en');
    expect(ro(40000)).toBe('yon man en');
  });

  it('kanji', () => {
    expect(kj(15000)).toBe('一万五千円');
    expect(kj(1234)).toBe('千二百三十四円');
    expect(kj(10000000)).toBe('一千万円');
    expect(kj(110)).toBe('百十円');
  });

  it('phiên âm Việt và làm tròn', () => {
    expect(readYen(15000)?.phonetic).toBe('i-chi man gô-xen en');
    expect(ro(999.6)).toBe('sen en');
  });

  it('ngoài phạm vi trả null', () => {
    expect(readYen(0)).toBeNull();
    expect(readYen(-5)).toBeNull();
    expect(readYen(1e12)).toBeNull();
  });
});

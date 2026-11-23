import { handleNotesChange, parseNotes, toggleBullet } from '../src/features/trips/notes';

describe('parseNotes', () => {
  it('trả mảng rỗng khi không có ghi chú', () => {
    expect(parseNotes(null)).toEqual([]);
    expect(parseNotes('')).toEqual([]);
  });

  it('tách dòng thường và gạch đầu dòng, bỏ dòng trống cuối', () => {
    expect(parseNotes('Mở đầu\n- một\n- hai\n\n')).toEqual([
      { kind: 'text', text: 'Mở đầu' },
      { kind: 'bullet', text: 'một' },
      { kind: 'bullet', text: 'hai' },
    ]);
  });

  it('chấp nhận "• " và CRLF, giữ dòng trống ở giữa', () => {
    expect(parseNotes('a\r\n\r\n• b')).toEqual([
      { kind: 'text', text: 'a' },
      { kind: 'text', text: '' },
      { kind: 'bullet', text: 'b' },
    ]);
  });

  it('"-chữ" không có dấu cách thì không phải gạch đầu dòng', () => {
    expect(parseNotes('-abc')).toEqual([{ kind: 'text', text: '-abc' }]);
  });
});

describe('handleNotesChange (Enter)', () => {
  it('Enter cuối dòng "- chữ" thì dòng mới tự có "- "', () => {
    const r = handleNotesChange('- abc', '- abc\n');
    expect(r).toEqual({ value: '- abc\n- ', selection: { start: 8, end: 8 } });
  });

  it('Enter giữa dòng bullet cắt dòng và mở bullet mới cho phần còn lại', () => {
    const r = handleNotesChange('- abcdef', '- abc\ndef');
    expect(r?.value).toBe('- abc\n- def');
    expect(r?.selection).toEqual({ start: 8, end: 8 });
  });

  it('Enter ở dòng chỉ có "- " thì xoá "- " và thoát danh sách', () => {
    const r = handleNotesChange('- abc\n- ', '- abc\n- \n');
    expect(r).toEqual({ value: '- abc\n', selection: { start: 6, end: 6 } });
  });

  it('Enter ở dòng thường giữ nguyên', () => {
    expect(handleNotesChange('abc', 'abc\n')).toBeNull();
  });

  it('gõ chữ thường không bị can thiệp', () => {
    expect(handleNotesChange('- ab', '- abc')).toBeNull();
  });

  it('dán nhiều ký tự không bị can thiệp', () => {
    expect(handleNotesChange('- a', '- a\nb\n')).toBeNull();
  });
});

describe('toggleBullet', () => {
  it('thêm "- " cho dòng có con trỏ', () => {
    const r = toggleBullet('xin chào', { start: 3, end: 3 });
    expect(r.value).toBe('- xin chào');
    expect(r.selection).toEqual({ start: 5, end: 5 });
  });

  it('bỏ "- " khi dòng đã là gạch đầu dòng', () => {
    const r = toggleBullet('- xin chào', { start: 5, end: 5 });
    expect(r.value).toBe('xin chào');
    expect(r.selection).toEqual({ start: 3, end: 3 });
  });

  it('dòng trống cũng thêm được "- " để bắt đầu danh sách', () => {
    const r = toggleBullet('a\n', { start: 2, end: 2 });
    expect(r.value).toBe('a\n- ');
    expect(r.selection).toEqual({ start: 4, end: 4 });
  });

  it('nhiều dòng: thêm cho dòng thiếu, bỏ qua dòng trống', () => {
    const r = toggleBullet('a\n\n- b\nc', { start: 0, end: 8 });
    expect(r.value).toBe('- a\n\n- b\n- c');
  });

  it('nhiều dòng đều đã có "- " thì bỏ hết', () => {
    const r = toggleBullet('- a\n- b', { start: 0, end: 7 });
    expect(r.value).toBe('a\nb');
    expect(r.selection).toEqual({ start: 0, end: 3 });
  });

  it('chỉ đụng các dòng nằm trong vùng chọn', () => {
    const r = toggleBullet('x\ny\nz', { start: 2, end: 3 });
    expect(r.value).toBe('x\n- y\nz');
  });
});

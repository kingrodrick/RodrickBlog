/**
 * Ghi chú của mốc (timeline_events.notes) là văn bản thuần: mỗi dòng bắt đầu bằng "- " là một gạch đầu dòng,
 * ký tự xuống dòng là xuống dòng. Không đổi cột DB; web đọc được bằng whitespace-pre-line.
 */

export type Selection = { start: number; end: number };
export type EditResult = { value: string; selection: Selection };
export type NoteBlock = { kind: 'text' | 'bullet'; text: string };

const BULLET = '- ';
const BULLET_LINE = /^[-•]\s+/;

/** Tách ghi chú thành các dòng để vẽ; chấp nhận cả "• " (dữ liệu gõ tay cũ). Bỏ dòng trống ở cuối. */
export function parseNotes(notes: string | null | undefined): NoteBlock[] {
  if (!notes) {
    return [];
  }
  const lines = notes.replace(/\r\n?/g, '\n').split('\n');
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }
  return lines.map(l =>
    BULLET_LINE.test(l) ? { kind: 'bullet', text: l.replace(BULLET_LINE, '') } : { kind: 'text', text: l },
  );
}

const lineStart = (value: string, pos: number) => value.lastIndexOf('\n', pos - 1) + 1;
const lineEnd = (value: string, pos: number) => {
  const i = value.indexOf('\n', pos);
  return i === -1 ? value.length : i;
};

/**
 * Gọi khi nội dung ô nhập đổi. Nếu vừa gõ Enter đúng một lần:
 * - dòng trước đó là "- chữ": dòng mới tự có "- ";
 * - dòng trước đó chỉ có "- ": xoá "- " và thoát danh sách.
 * Trả null khi không cần can thiệp (giữ nguyên nội dung vừa gõ).
 */
export function handleNotesChange(prev: string, next: string): EditResult | null {
  if (next.length !== prev.length + 1) {
    return null;
  }
  let i = 0;
  while (i < prev.length && prev[i] === next[i]) {
    i++;
  }
  if (next[i] !== '\n' || next.slice(i + 1) !== prev.slice(i)) {
    return null;
  }
  const ls = lineStart(prev, i);
  const before = prev.slice(ls, i);
  if (!before.startsWith(BULLET)) {
    return null;
  }
  if (before.slice(BULLET.length).trim() === '') {
    return { value: prev.slice(0, ls) + prev.slice(i), selection: { start: ls, end: ls } };
  }
  const value = `${prev.slice(0, i)}\n${BULLET}${prev.slice(i)}`;
  const pos = i + 1 + BULLET.length;
  return { value, selection: { start: pos, end: pos } };
}

/** Bật/tắt "- " cho các dòng đang chọn (hoặc dòng có con trỏ). Tất cả đã có "- " thì bỏ, ngược lại thêm. */
export function toggleBullet(value: string, sel: Selection): EditResult {
  const start = Math.max(0, Math.min(sel.start, value.length));
  const rawEnd = Math.max(start, Math.min(sel.end, value.length));
  const endPos = rawEnd > start && value[rawEnd - 1] === '\n' ? rawEnd - 1 : rawEnd;
  const from = lineStart(value, start);
  const to = lineEnd(value, endPos);
  const lines = value.slice(from, to).split('\n');
  const single = lines.length === 1;
  const filled = lines.filter(l => l.trim() !== '');
  const remove = filled.length > 0 && filled.every(l => l.startsWith(BULLET));

  let firstDelta = 0;
  let total = 0;
  const out = lines.map((l, idx) => {
    let next = l;
    if (remove) {
      next = l.startsWith(BULLET) ? l.slice(BULLET.length) : l;
    } else if (!l.startsWith(BULLET) && (single || l.trim() !== '')) {
      next = BULLET + l;
    }
    const d = next.length - l.length;
    if (idx === 0) {
      firstDelta = d;
    }
    total += d;
    return next;
  });

  const newValue = value.slice(0, from) + out.join('\n') + value.slice(to);
  const newStart = Math.max(from, start + firstDelta);
  const newEnd = Math.max(newStart, rawEnd + total);
  return { value: newValue, selection: { start: newStart, end: newEnd } };
}

/**
 * Đánh dấu số ảnh của các bộ sưu tập đã cũ (vừa xoá hoặc chuyển ảnh ở màn bộ sưu tập).
 * Tab Ảnh kiểm tra khi quay lại màn và tải lại ngầm danh sách bộ sưu tập.
 */
let stale = false;

export function markCollectionsStale() {
  stale = true;
}

/** Trả true nếu danh sách đã cũ, đồng thời xoá dấu. */
export function takeCollectionsStale(): boolean {
  const was = stale;
  stale = false;
  return was;
}

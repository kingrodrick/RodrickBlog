import { useEffect, useState } from 'react';

/** Trả về thời điểm hiện tại, cập nhật mỗi `intervalMs`; dọn interval khi unmount. */
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

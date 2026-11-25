import { useCallback, useEffect, useRef, useState } from 'react';
import { cacheHitSince } from '../api/readCache';

type State<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Có giá trị: mất mạng, đang hiện bản lưu lúc này (ms). */
  cachedAt: number | null;
};

/**
 * Chạy hàm tải dữ liệu khi mount; `reload` để thử lại (hiện trạng thái đang tải),
 * `refresh` để tải lại ngầm: giữ dữ liệu đang hiện, lỗi thì giữ nguyên bản cũ.
 */
export function useAsync<T>(load: () => Promise<T>) {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: true,
    error: null,
    cachedAt: null,
  });
  const [attempt, setAttempt] = useState(0);
  // Lượt tải hiện tại là tải ngầm (từ refresh).
  const silent = useRef(false);

  useEffect(() => {
    let alive = true;
    const quiet = silent.current;
    silent.current = false;
    if (!quiet) {
      setState(s => ({ ...s, loading: true, error: null }));
    }
    const started = Date.now();
    load()
      .then(
        data =>
          alive &&
          setState({ data, loading: false, error: null, cachedAt: cacheHitSince(started) }),
      )
      .catch((e: unknown) => {
        if (!alive || quiet) {
          return;
        }
        setState({
          data: null,
          loading: false,
          error: e instanceof Error ? e.message : 'Không tải được dữ liệu.',
          cachedAt: null,
        });
      });
    return () => {
      alive = false;
    };
  }, [load, attempt]);

  const reload = useCallback(() => setAttempt(a => a + 1), []);
  const refresh = useCallback(() => {
    silent.current = true;
    setAttempt(a => a + 1);
  }, []);
  return { ...state, reload, refresh };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { cacheHitSince } from '../../../shared/api/readCache';
import { fetchPhotos, PAGE_SIZE } from '../api/photos';
import { Photo, PhotoFilter } from '../types';

type State = {
  photos: Photo[];
  /** Đang tải trang đầu. */
  loading: boolean;
  /** Đang tải thêm trang sau. */
  loadingMore: boolean;
  error: string | null;
  /** Đã hết ảnh, không tải thêm. */
  done: boolean;
  /** Có giá trị: mất mạng, đang hiện bản lưu lúc này (ms). */
  cachedAt: number | null;
};

const INITIAL: State = {
  photos: [],
  loading: true,
  loadingMore: false,
  error: null,
  done: false,
  cachedAt: null,
};

const message = (e: unknown) => (e instanceof Error ? e.message : 'Không tải được ảnh.');

/** Tải ảnh theo trang (mới nhất trước); `loadMore` khi cuộn gần cuối, `reload` để tải lại từ đầu. */
export function usePhotoPages(collectionId?: number, filter: PhotoFilter = 'all') {
  const [state, setState] = useState<State>(INITIAL);
  const [attempt, setAttempt] = useState(0);
  // Chặn gọi tải thêm chồng nhau (onEndReached có thể bắn nhiều lần liền).
  const busy = useRef(true);
  // Mỗi lần tải lại từ đầu tăng số này, để kết quả của lượt cũ bị bỏ qua.
  const generation = useRef(0);

  useEffect(() => {
    const gen = ++generation.current;
    busy.current = true;
    setState(INITIAL);
    const started = Date.now();
    fetchPhotos(0, { collectionId, filter })
      .then(page => {
        if (gen !== generation.current) {
          return;
        }
        setState({
          ...INITIAL,
          photos: page,
          loading: false,
          done: page.length < PAGE_SIZE,
          cachedAt: cacheHitSince(started),
        });
      })
      .catch(e => gen === generation.current && setState({ ...INITIAL, loading: false, error: message(e) }))
      .finally(() => {
        if (gen === generation.current) {
          busy.current = false;
        }
      });
  }, [collectionId, filter, attempt]);

  const loadMore = useCallback(() => {
    if (busy.current || state.done || state.error) {
      return;
    }
    busy.current = true;
    const gen = generation.current;
    const started = Date.now();
    setState(s => ({ ...s, loadingMore: true }));
    fetchPhotos(state.photos.length, { collectionId, filter })
      .then(page => {
        if (gen !== generation.current) {
          return;
        }
        setState(s => {
          // Bỏ ảnh trùng (ví dụ vừa có ảnh mới chèn lên đầu làm lệch offset).
          const seen = new Set(s.photos.map(p => p.id));
          return {
            ...s,
            photos: [...s.photos, ...page.filter(p => !seen.has(p.id))],
            loadingMore: false,
            done: page.length < PAGE_SIZE,
            cachedAt: s.cachedAt ?? cacheHitSince(started),
          };
        });
      })
      // Lỗi khi tải thêm (thường là mất mạng mà trang này chưa lưu): dừng, giữ ảnh đang có.
      .catch(() => gen === generation.current && setState(s => ({ ...s, loadingMore: false, done: true })))
      .finally(() => {
        if (gen === generation.current) {
          busy.current = false;
        }
      });
  }, [collectionId, filter, state.done, state.error, state.photos.length]);

  const reload = useCallback(() => setAttempt(a => a + 1), []);

  /** Bỏ các ảnh vừa xoá khỏi lưới, không tải lại (giữ chỗ đang cuộn). */
  const removeLocal = useCallback((ids: number[]) => {
    const gone = new Set(ids);
    setState(s => ({ ...s, photos: s.photos.filter(p => !gone.has(p.id)) }));
  }, []);

  return { ...state, loadMore, reload, removeLocal };
}

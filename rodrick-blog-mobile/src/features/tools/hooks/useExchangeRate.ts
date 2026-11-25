import { useCallback, useEffect, useRef, useState } from 'react';
import { ExchangeRate, getExchangeRate, RateStatus, readCachedRate } from '../api/exchangeRate';

type State = {
  rate: ExchangeRate | null;
  /** 'loading': lần đầu mở, chưa có cả tỉ giá lưu lẫn tỉ giá mới. */
  status: RateStatus | 'loading';
  refreshing: boolean;
};

/**
 * Mở màn: hiện ngay tỉ giá đã lưu (nếu có), đồng thời tải tỉ giá mới.
 * `refresh` để tải lại thủ công.
 */
export function useExchangeRate() {
  const [state, setState] = useState<State>({ rate: null, status: 'loading', refreshing: true });
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, refreshing: true }));
    const { rate, status } = await getExchangeRate();
    if (alive.current) {
      setState({ rate, status, refreshing: false });
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    readCachedRate().then(cached => {
      // Chỉ hiện tỉ giá lưu nếu bản mới chưa về kịp.
      if (alive.current && cached) {
        setState(s => (s.status === 'loading' ? { ...s, rate: cached, status: 'cached' } : s));
      }
    });
    refresh();
    return () => {
      alive.current = false;
    };
  }, [refresh]);

  return { ...state, refresh };
}

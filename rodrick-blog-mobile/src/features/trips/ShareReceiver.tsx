import React, { useCallback, useEffect, useState } from 'react';
import {
  clearShareIntent,
  getInitialShare,
  SharePayload,
  useShareIntent,
} from 'react-native-nitro-share-intent';
import { Toast } from '../../shared/ui';
import { navigationRef } from '../../navigation/navigationRef';
import { ParsedRoute, parseMapsLink, resolveMapsLink } from './parseMapsLink';

const URL_RE = /https?:\/\/\S+/i;

/** Đợi NavigationContainer sẵn sàng (khi app được mở thẳng bằng nút Chia sẻ). */
function whenReady(run: () => void, tries = 50) {
  if (navigationRef.isReady()) {
    run();
  } else if (tries > 0) {
    setTimeout(() => whenReady(run, tries - 1), 100);
  }
}

/**
 * Gán lộ trình vừa nhận: đang ở một event (Chi tiết event / Sửa lộ trình) thì gán thẳng vào
 * event đó, ngược lại mở màn chọn event.
 */
function openRoute(route: ParsedRoute) {
  whenReady(() => {
    const cur = navigationRef.getCurrentRoute();
    const p = cur?.params as { tripId?: string; eventId?: string; mapId?: number } | undefined;
    if ((cur?.name === 'EventDetail' || cur?.name === 'RouteEdit') && p?.tripId && p.eventId) {
      // Từ Chi tiết event: thêm lộ trình mới. Đang ở màn Sửa một lộ trình: điền vào lộ trình đó.
      const mapId = cur.name === 'RouteEdit' ? p.mapId : undefined;
      navigationRef.navigate('Home', {
        screen: 'RouteEdit',
        params: { tripId: p.tripId, eventId: p.eventId, mapId, route },
      });
    } else {
      navigationRef.navigate('Home', { screen: 'PickEvent', params: { route } });
    }
  });
}

/**
 * Nhận văn bản chia sẻ từ Google Maps (react-native-nitro-share-intent). Google Maps gửi cả tên
 * địa điểm lẫn liên kết, nên lấy liên kết đầu tiên trong văn bản. Đặt bên trong NavigationContainer.
 */
export function ShareReceiver() {
  const [failed, setFailed] = useState(false);

  const handle = useCallback(async (p: SharePayload | null) => {
    if (!p || p.type !== 'text' || !p.text) {
      return;
    }
    const url = p.text.match(URL_RE)?.[0];
    if (!url) {
      setFailed(true);
      return;
    }
    try {
      const route = parseMapsLink(await resolveMapsLink(url));
      if (route) {
        openRoute({ ...route, link: url });
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    }
  }, []);

  // App đang chạy (nền hoặc trước) nhận thêm một lần chia sẻ.
  useShareIntent(handle);

  // App được mở bằng nút Chia sẻ.
  useEffect(() => {
    getInitialShare()
      .then(handle)
      .catch(() => setFailed(true))
      .finally(clearShareIntent);
  }, [handle]);

  return (
    <Toast
      kind="error"
      visible={failed}
      message="Không đọc được liên kết này, hãy dán thủ công trong màn Sửa lộ trình"
      onDismiss={() => setFailed(false)}
    />
  );
}

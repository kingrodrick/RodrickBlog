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
import { clearRouteEdit, takeRouteEdit } from './pendingRouteEdit';

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
      // Lộ trình vừa mở sang Google Maps từ danh sách (chạm vào lộ trình) thì cập nhật lộ trình
      // đó; đang ở hộp thoại một lộ trình thì điền vào lộ trình đó; còn lại thêm lộ trình mới.
      const pendingId = takeRouteEdit(Number(p.eventId));
      const mapId = pendingId ?? (cur.name === 'RouteEdit' ? p.mapId : undefined);
      navigationRef.navigate('Home', {
        screen: 'RouteEdit',
        params: { tripId: p.tripId, eventId: p.eventId, mapId, route, view: false },
      });
    } else {
      clearRouteEdit();
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
    // Ghi lại văn bản nhận được khi đọc lỗi (xem bằng `adb logcat -s ReactNativeJS`), để biết
    // Google Maps gửi định dạng nào mà app chưa hiểu.
    const fail = (why: string, extra?: string) => {
      console.warn(`[ShareReceiver] ${why}`, JSON.stringify({ text: p.text, extra }));
      setFailed(true);
    };
    // Bỏ dấu câu dính ở cuối liên kết (ví dụ ")" hay "." khi Google Maps gửi kèm câu mô tả).
    const url = p.text.match(URL_RE)?.[0]?.replace(/[)\].,;]+$/, '');
    if (!url) {
      fail('không có liên kết');
      return;
    }
    let resolved = url;
    try {
      resolved = await resolveMapsLink(url);
      const route = parseMapsLink(resolved);
      if (route) {
        openRoute({ ...route, link: url });
      } else {
        fail('không đọc được', resolved);
      }
    } catch (e) {
      fail('lỗi khi mở liên kết', `${resolved} | ${e instanceof Error ? e.message : String(e)}`);
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

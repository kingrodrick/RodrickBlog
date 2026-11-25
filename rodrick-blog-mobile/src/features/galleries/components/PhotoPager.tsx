import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Image,
  NativeTouchEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { gridThumbUrl, viewerUrl } from '../photoUrls';
import { Photo } from '../types';

type Props = {
  photos: Photo[];
  current: number;
  onChange: (index: number) => void;
  /** Khung xem (bằng màn hình). */
  width: number;
  height: number;
  /** Số độ xoay thêm theo id ảnh (nút xoay). */
  rotation: Record<number, number>;
  /** Chạm một lần (đã trừ trường hợp chạm đúp). */
  onTap: () => void;
};

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
/** Hai lần chạm cách nhau dưới khoảng này là chạm đúp. */
const DOUBLE_TAP_MS = 280;
/** Ngưỡng coi là đang phóng to (tránh sai số dấu phẩy động). */
const ZOOMED = 1.01;
/** Vuốt quá tỉ lệ bề ngang này (hoặc đủ nhanh) thì sang ảnh kế. */
const SWIPE_RATIO = 0.2;
const SWIPE_VELOCITY = 0.5;

/** Tải trước bao nhiêu ảnh mỗi bên (ngoài ảnh liền kề đã dựng sẵn) để vuốt nhanh không thấy nền đen. */
const PREFETCH = 2;

const distance = (t: readonly NativeTouchEvent[]) =>
  Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);

/**
 * Một ảnh vừa khung, xoay thêm theo nút (xoay 90° thì đổi rộng/cao để vẫn vừa khung).
 * Hiện ngay ảnh nhỏ của lưới (đã có trong cache, không phải tải lại) rồi đè ảnh nét lên khi tải
 * xong; mạng kém vẫn thấy ảnh ngay, chỉ mờ hơn một lúc. Ảnh nét lỗi thì giữ ảnh nhỏ.
 */
function Slide({ photo, width, height, deg }: { photo: Photo; width: number; height: number; deg: number }) {
  const sideways = deg % 180 !== 0;
  const [sharp, setSharp] = useState(false);
  return (
    <View
      style={[
        sideways ? { width: height, height: width } : { width, height },
        { transform: [{ rotate: `${deg}deg` }] },
      ]}
    >
      {/* Bỏ ảnh nhỏ khi ảnh nét đã hiện: ảnh PNG trong suốt sẽ lộ ảnh nhỏ phía sau. */}
      {sharp ? null : (
        <Image
          source={{ uri: gridThumbUrl(photo.url) }}
          resizeMode="contain"
          fadeDuration={0}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Image
        source={{ uri: viewerUrl(photo.url, width, height) }}
        resizeMode="contain"
        // Android mặc định cho ảnh mờ dần vào 300ms khi tải xong: trông như chớp khi vừa vuốt tới.
        fadeDuration={0}
        onLoad={() => setSharp(true)}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

/**
 * Xem ảnh vuốt ngang kèm thu phóng, tự xử lý mọi cử chỉ trong một bộ nhận chạm (không dùng
 * danh sách cuộn ngang: trên Android danh sách cuộn giành mất cử chỉ chụm hai ngón).
 * - Một ngón, cỡ gốc: vuốt ngang sang ảnh trước/sau.
 * - Hai ngón: chụm/mở để thu phóng (tới 4x).
 * - Một ngón khi đang phóng to: kéo trong ảnh, tới mép thì dừng.
 * - Chạm đúp: phóng 2.5x tại chỗ chạm hoặc về cỡ gốc. Chạm đơn: onTap.
 */
export function PhotoPager({ photos, current, onChange, width, height, rotation, onTap }: Props) {
  // Dải ảnh: mỗi ảnh nằm cố định ở left = chỉ số × bề ngang, dải dịch tới -current × bề ngang
  // (cộng thêm độ kéo của ngón tay). Vuốt xong dải đã đứng đúng chỗ của ảnh mới nên không phải
  // đặt lại về 0 và các ảnh không đổi chỗ. Cách cũ (ảnh đổi left, dải đặt về 0 cùng lúc) bị lệch
  // một khung hình trên Android vì hoạt ảnh chạy native: thấy ảnh nháy/lật trước khi đứng yên.
  const strip = useRef(new Animated.Value(-current * width)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;

  // Trạng thái cử chỉ để trong ref: PanResponder tạo một lần, đọc giá trị mới nhất qua đây.
  const g = useRef({
    scale: 1,
    x: 0,
    y: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    startDist: 0,
    mode: 'none' as 'none' | 'swipe' | 'pan' | 'pinch',
    moved: false,
    lastTap: 0,
    tapX: 0,
    tapY: 0,
    animating: false,
  }).current;
  const latest = useRef({ width, height, current, count: photos.length, onChange, onTap });
  latest.current = { width, height, current, count: photos.length, onChange, onTap };
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const zoomTo = useMemo(() => {
    /** Ảnh phóng to chỉ kéo được tới mép, không lộ nền đen quá mép ảnh. */
    const clamp = (s: number, x: number, y: number) => {
      const mx = ((s - 1) * latest.current.width) / 2;
      const my = ((s - 1) * latest.current.height) / 2;
      return [Math.max(-mx, Math.min(mx, x)), Math.max(-my, Math.min(my, y))];
    };
    return (s: number, x: number, y: number, animate: boolean) => {
      const [cx, cy] = clamp(Math.max(s, 1), x, y);
      g.scale = s;
      g.x = cx;
      g.y = cy;
      if (animate) {
        Animated.parallel([
          Animated.spring(scale, { toValue: s, useNativeDriver: true, bounciness: 0 }),
          Animated.spring(tx, { toValue: cx, useNativeDriver: true, bounciness: 0 }),
          Animated.spring(ty, { toValue: cy, useNativeDriver: true, bounciness: 0 }),
        ]).start();
      } else {
        scale.setValue(s);
        tx.setValue(cx);
        ty.setValue(cy);
      }
    };
  }, [g, scale, tx, ty]);

  const responder = useMemo(() => {
    const handleTap = () => {
      const now = Date.now();
      if (now - g.lastTap < DOUBLE_TAP_MS) {
        // Chạm đúp: huỷ chạm đơn đang chờ.
        if (tapTimer.current) {
          clearTimeout(tapTimer.current);
        }
        g.lastTap = 0;
        if (g.scale > ZOOMED) {
          zoomTo(1, 0, 0, true);
        } else {
          const { width: w, height: h } = latest.current;
          const k = DOUBLE_TAP_SCALE - 1;
          zoomTo(DOUBLE_TAP_SCALE, (w / 2 - g.tapX) * k, (h / 2 - g.tapY) * k, true);
        }
        return;
      }
      g.lastTap = now;
      // Chờ xem có chạm lần hai không rồi mới tính là chạm đơn.
      tapTimer.current = setTimeout(() => latest.current.onTap(), DOUBLE_TAP_MS);
    };

    /** Kết thúc vuốt: đủ xa/nhanh thì trượt hẳn sang ảnh kế, không thì bật về. */
    const finishSwipe = (dx: number, vx: number) => {
      const { width: w, current: i, count } = latest.current;
      let dir = 0;
      if ((dx < -w * SWIPE_RATIO || vx < -SWIPE_VELOCITY) && i < count - 1) {
        dir = 1;
      } else if ((dx > w * SWIPE_RATIO || vx > SWIPE_VELOCITY) && i > 0) {
        dir = -1;
      }
      g.animating = true;
      Animated.timing(strip, {
        toValue: -(i + dir) * w,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        g.animating = false;
        if (dir) {
          // Dải đã đứng đúng chỗ ảnh mới; chỉ báo đổi chỉ số, không dịch gì thêm.
          latest.current.onChange(i + dir);
        }
      });
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Không nhường cho phần tử nào khác giữa chừng cử chỉ.
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: e => {
        g.moved = false;
        g.mode = 'none';
        g.startScale = g.scale;
        g.startX = g.x;
        g.startY = g.y;
        g.tapX = e.nativeEvent.pageX;
        g.tapY = e.nativeEvent.pageY;
      },
      onPanResponderMove: (e: GestureResponderEvent, gs) => {
        if (g.animating) {
          return;
        }
        const touches = e.nativeEvent.touches;
        if (touches.length >= 2) {
          const d = distance(touches);
          if (g.mode !== 'pinch') {
            // Đang vuốt dở mà đặt thêm ngón: bỏ vuốt, chuyển sang chụm.
            if (g.mode === 'swipe') {
              strip.setValue(-latest.current.current * latest.current.width);
            }
            g.mode = 'pinch';
            g.moved = true;
            g.startDist = d;
            g.startScale = g.scale;
            g.startX = g.x;
            g.startY = g.y;
            return;
          }
          const s = Math.min(MAX_SCALE, Math.max(0.8, (g.startScale * d) / g.startDist));
          const k = s / g.startScale;
          zoomTo(s, g.startX * k, g.startY * k, false);
          return;
        }
        if (g.mode === 'pinch') {
          // Nhấc một ngón sau khi chụm: chờ nhấc nốt, không đổi sang kéo/vuốt.
          return;
        }
        if (Math.abs(gs.dx) + Math.abs(gs.dy) > 8) {
          g.moved = true;
        }
        if (g.scale > ZOOMED) {
          g.mode = 'pan';
          zoomTo(g.scale, g.startX + gs.dx, g.startY + gs.dy, false);
        } else if (g.mode === 'swipe' || (g.moved && Math.abs(gs.dx) > Math.abs(gs.dy))) {
          g.mode = 'swipe';
          const { current: i, count, width: w } = latest.current;
          // Ảnh đầu/cuối: kéo nặng tay, không có ảnh để sang.
          const edge = (gs.dx > 0 && i === 0) || (gs.dx < 0 && i === count - 1);
          strip.setValue(-i * w + (edge ? gs.dx / 3 : gs.dx));
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (g.mode === 'swipe') {
          finishSwipe(gs.dx, gs.vx);
        } else if (g.scale <= ZOOMED) {
          // Chụm nhỏ hơn cỡ gốc thì bật về cỡ gốc.
          zoomTo(1, 0, 0, g.scale < 1);
        }
        if (!g.moved) {
          handleTap();
        }
        g.mode = 'none';
      },
      onPanResponderTerminate: () => {
        if (g.mode === 'swipe') {
          finishSwipe(0, 0);
        } else if (g.scale <= ZOOMED) {
          zoomTo(1, 0, 0, true);
        }
        g.mode = 'none';
      },
    });
  }, [g, strip, zoomTo]);

  // Đổi ảnh / xoay màn / xoay ảnh: dải đứng đúng chỗ ảnh đang xem, ảnh về cỡ gốc.
  // Vuốt xong thì dải đã ở đúng giá trị này (đặt lại không làm gì); chỉ mở ảnh khác hay xoay màn
  // mới thật sự dịch. useLayoutEffect để chạy trước khi vẽ.
  const deg = photos[current] ? rotation[photos[current].id] ?? 0 : 0;
  useLayoutEffect(() => {
    strip.setValue(-current * width);
    zoomTo(1, 0, 0, false);
  }, [current, width, height, deg, strip, zoomTo]);

  // Tải trước ảnh xa hơn ảnh liền kề (ảnh liền kề đã dựng sẵn trong dải nên tự tải):
  // ảnh nhỏ trước (nhẹ, để vuốt tới là có ảnh), rồi ảnh nét.
  useEffect(() => {
    const ahead = [];
    for (let k = 2; k <= 1 + PREFETCH; k++) {
      ahead.push(photos[current + k], photos[current - k]);
    }
    const near = ahead.filter((x): x is Photo => !!x);
    for (const x of near) {
      Image.prefetch(gridThumbUrl(x.url)).catch(() => undefined);
    }
    for (const x of near) {
      Image.prefetch(viewerUrl(x.url, width, height)).catch(() => undefined);
    }
  }, [photos, current, width, height]);

  useEffect(
    () => () => {
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
      }
    },
    [],
  );

  const slots = [-1, 0, 1]
    .map(offset => ({ offset, photo: photos[current + offset] }))
    .filter((s): s is { offset: number; photo: Photo } => !!s.photo);
  const shown = photos[current];

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={shown?.caption || 'Ảnh'}
      accessibilityValue={{ text: `${current + 1}/${photos.length}` }}
      accessibilityHint="Vuốt lên xuống để sang ảnh khác, chạm đúp để hiện thông tin"
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
      onAccessibilityAction={e => {
        const a = e.nativeEvent.actionName;
        if (a === 'increment' && current < photos.length - 1) {
          onChange(current + 1);
        } else if (a === 'decrement' && current > 0) {
          onChange(current - 1);
        } else if (a === 'activate') {
          onTap();
        }
      }}
      style={[styles.root, { width, height }]}
      {...responder.panHandlers}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: strip }] }]}>
        {slots.map(({ offset, photo }) => (
          // key theo id: vuốt sang thì ảnh kế chỉ đổi chỗ, không tải lại.
          <View key={photo.id} style={[styles.slot, { width, height, left: (current + offset) * width }]}>
            {/* Cùng một cây cho mọi vị trí (chỉ ảnh giữa có thu phóng), để vào giữa không dựng lại ảnh. */}
            <Animated.View
              style={
                offset === 0
                  ? { transform: [{ translateX: tx }, { translateY: ty }, { scale }] }
                  : undefined
              }
            >
              <Slide photo={photo} width={width} height={height} deg={rotation[photo.id] ?? 0} />
            </Animated.View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  slot: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

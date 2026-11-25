import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { radius, useTheme } from '../../theme';
import { Text } from './Text';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** true: cao gần kín màn (hộp thoại sửa); false: chỉ cao bằng nội dung. */
  full?: boolean;
  /** Tiêu đề chuẩn của sheet (heading, lề 20); nằm trong vùng vuốt để đóng. */
  title?: React.ReactNode;
  /** Phần đầu tuỳ chỉnh thay cho `title` (ví dụ Sửa mốc: nút đóng + tab); cũng nằm trong vùng vuốt. */
  header?: React.ReactNode;
  /**
   * Vuốt xuống từ đầu sheet (thanh kéo, tiêu đề/header) để đóng; mặc định bật. Đang lưu thì màn
   * cha truyền onClose rỗng: kéo ra ngoài mà không đóng thì sheet tự bật về.
   */
  dragToClose?: boolean;
};

/** Kéo xuống quá tỉ lệ chiều cao sheet này mới đóng (vuốt nhanh mà ngắn không tính). */
const CLOSE_RATIO = 0.5;
const SLIDE_MS = 240;
const FADE_MS = 200;

/**
 * Hộp thoại dạng sheet bo 24 trượt từ đáy, phủ mờ phía sau; tự nâng lên khi có bàn phím.
 * Tự làm hoạt ảnh thay cho animationType của Modal (vốn trượt cả lớp phủ): mở thì lớp phủ hiện
 * dần cùng lúc sheet trượt lên; đóng thì sheet trượt xuống hẳn rồi lớp phủ mới mờ dần.
 */
export function Sheet({ visible, onClose, children, full, title, header, dragToClose = true }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const keyboard = useKeyboardHeight();
  const available = height - insets.top - 24 - keyboard;
  const spacer = { height: keyboard > 0 ? 0 : insets.bottom };

  // Modal còn hiện trong lúc chạy hoạt ảnh đóng, nên tách khỏi `visible`.
  const [mounted, setMounted] = useState(visible);
  // Vị trí sheet: 0 là đúng chỗ, `height` là khuất dưới đáy màn.
  const offset = useRef(new Animated.Value(height)).current;
  const scrim = useRef(new Animated.Value(0)).current;
  // Chiều cao thật của sheet, để tính ngưỡng kéo đóng.
  const sheetHeight = useRef(0);
  // Sheet đã khuất (vừa vuốt ra ngoài): lúc đóng chỉ còn mờ lớp phủ.
  const offscreen = useRef(true);
  const latest = useRef({ onClose, height, dragToClose, visible });
  latest.current = { onClose, height, dragToClose, visible };

  // Chỉ phản ứng khi `visible` đổi thật (không chạy lại khi height/mounted đổi).
  const wasVisible = useRef(false);
  const closing = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => () => closing.current?.stop(), []);

  useEffect(() => {
    if (visible === wasVisible.current) {
      return;
    }
    wasVisible.current = visible;
    if (visible) {
      closing.current?.stop();
      // Đặt sheet khuất dưới đáy, lớp phủ trong suốt; hoạt ảnh mở chạy ở onShow của Modal.
      offset.setValue(height);
      scrim.setValue(0);
      offscreen.current = true;
      setMounted(true);
      return;
    }
    if (!mounted) {
      return;
    }
    const fadeOut = Animated.timing(scrim, {
      toValue: 0,
      duration: FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    const steps = offscreen.current
      ? [fadeOut]
      : [
          Animated.timing(offset, {
            toValue: height,
            duration: SLIDE_MS,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          fadeOut,
        ];
    closing.current = Animated.sequence(steps);
    closing.current.start(({ finished }) => finished && setMounted(false));
  }, [visible, mounted, height, offset, scrim]);

  const open = () => {
    offscreen.current = false;
    Animated.parallel([
      Animated.timing(scrim, { toValue: 1, duration: FADE_MS, useNativeDriver: true }),
      Animated.timing(offset, {
        toValue: 0,
        duration: SLIDE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        // Nhận chạm ngay từ đầu (pha nổi bọt: phần tử sâu nhất thắng, nên nút Đóng/thanh tab
        // trong header vẫn tự nhận chạm của chúng). Nếu không nhận, Modal nằm trong cây React
        // của màn bên dưới nên một phần tử cha ở đó nhận mất, và khi responder là phần tử cha
        // thì React Native không hỏi vùng này nữa: vuốt không làm sheet nhúc nhích (đã thử trên máy).
        onStartShouldSetPanResponder: () => !!latest.current.dragToClose,
        // Bắt đầu trên nút Đóng/thanh tab rồi kéo xuống rõ ràng: giành lại từ nút đó.
        onMoveShouldSetPanResponderCapture: (_, g) =>
          !!latest.current.dragToClose && g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        // Đã giành thì không nhả cho phần tử khác giữa chừng.
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, g) => offset.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          const limit = (sheetHeight.current || latest.current.height) * CLOSE_RATIO;
          if (g.dy > limit) {
            Animated.timing(offset, {
              toValue: latest.current.height,
              duration: 180,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }).start(() => {
              // Sheet đã khuất: khi màn cha tắt `visible`, chỉ còn mờ dần lớp phủ.
              offscreen.current = true;
              latest.current.onClose();
              // Màn cha không đóng (ví dụ đang lưu, onClose rỗng): đưa sheet về chỗ cũ.
              setTimeout(() => {
                if (latest.current.visible) {
                  offscreen.current = false;
                  Animated.spring(offset, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
                }
              }, 50);
            });
          } else {
            Animated.spring(offset, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
          }
        },
        onPanResponderTerminate: () =>
          Animated.spring(offset, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start(),
      }),
    [offset],
  );

  const grab = <View style={[styles.grab, { backgroundColor: colors.inputBorder }]} />;
  const head =
    header ??
    (title !== undefined ? (
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
    ) : null);

  return (
    <Modal transparent visible={mounted} animationType="none" statusBarTranslucent onShow={open} onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Lớp phủ tối tách riêng để mờ dần, không trượt theo sheet. */}
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, opacity: scrim }]}>
          <Pressable accessibilityLabel="Đóng" style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          onLayout={e => {
            sheetHeight.current = e.nativeEvent.layout.height;
          }}
          style={[
            styles.sheet,
            { backgroundColor: colors.background, maxHeight: available, marginBottom: keyboard },
            full ? { height: available } : null,
            { transform: [{ translateY: offset }] },
          ]}>
          {dragToClose ? (
            <View {...responder.panHandlers}>
              {grab}
              {head}
            </View>
          ) : (
            <>
              {grab}
              {head}
            </>
          )}
          {children}
          <View style={spacer} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' },
  title: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  grab: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginTop: 8, marginBottom: 4 },
});

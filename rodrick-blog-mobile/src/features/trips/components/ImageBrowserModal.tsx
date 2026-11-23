import React, { useRef, useState } from 'react';
import { Image, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { X } from 'lucide-react-native';
import { Button, IconButton, Segmented, Text } from '../../../shared/ui';
import { iconSize, iconStroke, radius, useTheme } from '../../../theme';
import { hostOf, upgradePinterestUrl } from '../photoUpload';

type Source = 'pinterest' | 'google';

type Props = {
  visible: boolean;
  /** Từ khoá tìm mặc định (tên địa điểm của mốc). */
  query: string;
  onClose: () => void;
  /** Ảnh người dùng chọn: địa chỉ ảnh và trang đang xem. */
  onPick: (imageUrl: string, pageUrl: string) => void;
};

const searchUrl = (source: Source, q: string) =>
  source === 'pinterest'
    ? `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}`
    : `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;

/**
 * Chạm giữ một ảnh trong trang để chọn: bắt sự kiện chạm trên thẻ img, lấy bản lớn nhất trong srcset
 * rồi gửi về app. Người dùng tự duyệt như trong trình duyệt; app không gọi API hay cào dữ liệu.
 */
const PICK_SCRIPT = `
(function () {
  if (window.__rodrickPick) { return; }
  window.__rodrickPick = true;
  var timer = null;
  function findImg(el) {
    while (el && el !== document.body) {
      if (el.tagName === 'IMG') { return el; }
      var inner = el.querySelector && el.querySelector('img');
      if (inner) { return inner; }
      el = el.parentElement;
    }
    return null;
  }
  function best(img) {
    var src = img.currentSrc || img.src || '';
    var set = img.getAttribute('srcset');
    if (set) {
      var parts = set.split(',').map(function (p) {
        var a = p.trim().split(/\\s+/);
        return { u: a[0], w: parseFloat(a[1]) || 0 };
      }).sort(function (a, b) { return b.w - a.w; });
      if (parts[0] && parts[0].u) { src = parts[0].u; }
    }
    return src;
  }
  document.addEventListener('touchstart', function (e) {
    var img = findImg(e.target);
    if (!img) { return; }
    clearTimeout(timer);
    timer = setTimeout(function () {
      window.ReactNativeWebView.postMessage(JSON.stringify({ src: best(img), page: location.href }));
    }, 550);
  }, { passive: true });
  ['touchend', 'touchmove', 'touchcancel'].forEach(function (n) {
    document.addEventListener(n, function () { clearTimeout(timer); }, { passive: true });
  });
  document.addEventListener('contextmenu', function (e) { if (findImg(e.target)) { e.preventDefault(); } });
})();
true;
`;

const closeIcon = (c: string) => (
  <X color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />
);

const SOURCES = [
  { value: 'pinterest' as const, label: 'Pinterest' },
  { value: 'google' as const, label: 'Google' },
];

/** Trình duyệt toàn màn hình trong app để tìm ảnh minh họa trên Pinterest hoặc Google. */
export function ImageBrowserModal({ visible, query, onClose, onPick }: Props) {
  const { colors } = useTheme();
  const [source, setSource] = useState<Source>('pinterest');
  const [picked, setPicked] = useState<{ img: string; page: string } | null>(null);
  const [hint, setHint] = useState('Chạm giữ một ảnh để chọn');
  const lastPick = useRef('');

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data) as { src?: string; page?: string };
      if (!m.src || !/^https?:\/\//i.test(m.src)) {
        setHint('Ảnh này chưa có bản lớn. Mở ảnh ra rồi chạm giữ lại.');
        return;
      }
      const img = upgradePinterestUrl(m.src);
      lastPick.current = img;
      setPicked({ img, page: m.page ?? img });
    } catch {
      // Tin nhắn không phải của bộ bắt ảnh: bỏ qua.
    }
  };

  const close = () => {
    setPicked(null);
    setHint('Chạm giữ một ảnh để chọn');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.top}>
          <IconButton
            variant="ghost"
            accessibilityLabel="Đóng trình duyệt"
            onPress={close}
            icon={closeIcon}
          />
          <View style={styles.seg}>
            <Segmented options={SOURCES} value={source} onChange={s => { setSource(s); setPicked(null); }} />
          </View>
        </View>
        <View style={styles.web}>
          {visible ? (
            <WebView
              key={source}
              source={{ uri: searchUrl(source, query) }}
              injectedJavaScript={PICK_SCRIPT}
              onMessage={onMessage}
              originWhitelist={['https://*']}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              setSupportMultipleWindows={false}
            />
          ) : null}
        </View>
        <View style={[styles.bar, { backgroundColor: colors.surface }]}>
          {picked ? (
            <>
              <Image source={{ uri: picked.img }} style={[styles.thumb, { backgroundColor: colors.surfaceMuted }]} />
              <View style={styles.info}>
                <Text variant="label">Đã chọn 1 ảnh</Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {hostOf(picked.img)}
                </Text>
              </View>
              <View style={styles.use}>
                <Button
                  title="Dùng ảnh này"
                  size="md"
                  onPress={() => {
                    const p = picked;
                    setPicked(null);
                    onPick(p.img, p.page);
                  }}
                />
              </View>
            </>
          ) : (
            <Text variant="caption" tone="secondary" style={styles.hint}>
              {hint}
            </Text>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8, paddingRight: 20, paddingBottom: 8 },
  seg: { flex: 1 },
  web: { flex: 1 },
  bar: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  thumb: { width: 48, height: 48, borderRadius: radius.label + 2 },
  info: { flex: 1, minWidth: 0 },
  use: { width: 150 },
  hint: { flex: 1, textAlign: 'center' },
});

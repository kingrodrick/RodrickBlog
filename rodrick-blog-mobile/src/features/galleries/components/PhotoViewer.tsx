import React, { useEffect, useState } from 'react';
import {
  Modal,
  Share,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RotateCw, Share2, X } from 'lucide-react-native';
import { IconButton, Text } from '../../../shared/ui';
import { cloudinaryUrl } from '../../../shared/utils/cloudinary';
import { iconSize, iconStroke, layout } from '../../../theme';
import { Photo } from '../types';
import { PhotoPager } from './PhotoPager';

type Props = {
  photos: Photo[];
  /** Ảnh đang mở; null là đóng. */
  index: number | null;
  onClose: () => void;
  /** Vuốt gần tới ảnh cuối thì tải thêm trang ảnh của lưới. */
  onEndReached?: () => void;
  onShareError?: (message: string) => void;
};

// Màn xem ảnh luôn nền tối (ngoại lệ đã quy ước), nên màu cố định, không theo theme.
const LIGHT = '#f0efec';
const DIM = 'rgba(240,239,236,0.7)';
/** Dải thông tin đen mờ ở đáy và sau các nút trên cùng. */
const SHADE = 'rgba(0,0,0,0.6)';

const renderIcon = (Icon: typeof X) => () =>
  <Icon color={LIGHT} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />;
const renderClose = renderIcon(X);
const renderShare = renderIcon(Share2);
const renderRotate = renderIcon(RotateCw);

const pad = (n: number) => String(n).padStart(2, '0');

/** "2026-12-12T09:30:00" -> "12/12/2026"; ngày không đọc được thì bỏ. */
function formatDate(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Dòng phụ: loại ảnh (nếu là tham khảo) • thành phố • ngày chụp • máy ảnh. */
function metaLine(p: Photo): string {
  return [p.isReal ? null : 'Ảnh tham khảo', p.city, formatDate(p.takenAt), p.cameraGear]
    .filter(Boolean)
    .join(' • ');
}

/**
 * Xem ảnh toàn màn hình nền đen, vuốt ngang qua các ảnh của lưới.
 * Mặc định chỉ có ảnh; chạm để hiện dải thông tin (caption) ở đáy cùng nút đóng và chia sẻ,
 * chạm lần nữa để ẩn.
 */
export function PhotoViewer({ photos, index, onClose, onEndReached, onShareError }: Props) {
  const { width, height } = useWindowDimensions();
  // Nút và chú thích tránh tai thỏ / thanh hệ thống, nhất là khi xoay ngang.
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(index ?? 0);
  const [showInfo, setShowInfo] = useState(false);
  // Số độ xoay thêm theo từng ảnh (id), giữ khi vuốt qua lại.
  const [extra, setExtra] = useState<Record<number, number>>({});

  useEffect(() => {
    if (index !== null) {
      setCurrent(index);
      setShowInfo(false);
      setExtra({});
    }
  }, [index]);

  const shown = photos[current];

  // Vuốt gần tới ảnh cuối đã tải: tải thêm trang ảnh của lưới.
  useEffect(() => {
    if (index !== null && current >= photos.length - 3) {
      onEndReached?.();
    }
  }, [index, current, photos.length, onEndReached]);
  const meta = shown ? metaLine(shown) : '';

  const rotate = () =>
    shown && setExtra(e => ({ ...e, [shown.id]: ((e[shown.id] ?? 0) + 90) % 360 }));

  const share = async () => {
    if (!shown) {
      return;
    }
    const url = cloudinaryUrl(shown.url);
    try {
      // Android chỉ nhận `message`; iOS dùng thêm `url` để hiện ảnh xem trước.
      await Share.share({ message: shown.caption ? `${shown.caption}\n${url}` : url, url });
    } catch {
      onShareError?.('Không mở được bảng chia sẻ.');
    }
  };

  return (
    <Modal
      visible={index !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.root}>
        {index !== null ? (
          <PhotoPager
            photos={photos}
            current={current}
            onChange={setCurrent}
            width={width}
            height={height}
            rotation={extra}
            onTap={() => setShowInfo(v => !v)}
          />
        ) : null}

        {showInfo && shown ? (
          <>
            <View
              style={[
                styles.top,
                {
                  paddingTop: insets.top + 8,
                  paddingLeft: insets.left + 8,
                  paddingRight: insets.right + 8,
                },
              ]}
            >
              <IconButton accessibilityLabel="Đóng" variant="ghost" onPress={onClose} icon={renderClose} />
              <Text variant="label" style={[styles.light, styles.counter]} numberOfLines={1}>
                {current + 1}/{photos.length}
              </Text>
              <IconButton accessibilityLabel="Xoay ảnh" variant="ghost" onPress={rotate} icon={renderRotate} />
              <IconButton accessibilityLabel="Chia sẻ ảnh" variant="ghost" onPress={share} icon={renderShare} />
            </View>

            <View
              style={[
                styles.info,
                {
                  paddingBottom: insets.bottom + 20,
                  paddingLeft: insets.left + layout.screenMargin,
                  paddingRight: insets.right + layout.screenMargin,
                },
              ]}
              pointerEvents="none"
            >
              {shown.caption ? (
                <Text variant="body" style={styles.light}>
                  {shown.caption}
                </Text>
              ) : null}
              {meta ? (
                <Text variant="caption" style={styles.dim}>
                  {meta}
                </Text>
              ) : null}
              {!shown.caption && !meta ? (
                <Text variant="caption" style={styles.dim}>
                  Chưa có chú thích
                </Text>
              ) : null}
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    backgroundColor: SHADE,
  },
  counter: { flex: 1, textAlign: 'center' },
  info: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    gap: 4,
    backgroundColor: SHADE,
  },
  light: { color: LIGHT },
  dim: { color: DIM },
});

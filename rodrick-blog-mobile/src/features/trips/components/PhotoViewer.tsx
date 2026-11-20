import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RotateCw, X } from 'lucide-react-native';
import { IconButton, Text } from '../../../shared/ui';
import { cloudinaryUrl } from '../../../shared/utils/cloudinary';
import { iconSize, iconStroke, layout } from '../../../theme';
import { EventImage } from '../types';

type Props = {
  images: EventImage[];
  /** Ảnh đang mở; null là đóng. */
  index: number | null;
  onClose: () => void;
};

// Lightbox luôn nền tối (ngoại lệ đã quy ước), nên màu cố định, không theo theme.
const LIGHT = '#f0efec';

const renderIcon = (Icon: typeof X) => () =>
  <Icon color={LIGHT} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />;
const renderClose = renderIcon(X);
const renderRotate = renderIcon(RotateCw);

/**
 * Một ảnh: tự xoay 90° khi hướng ảnh khác hướng màn (ảnh ngang trên màn dọc và ngược lại)
 * để ảnh chiếm trọn màn; `extra` là số độ sir xoay thêm bằng nút.
 */
function ViewerImage({ uri, extra }: { uri: string; extra: number }) {
  const { width, height } = useWindowDimensions();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    Image.getSize(uri, (w, h) => setSize({ w, h }), () => setSize(null));
  }, [uri]);

  const auto =
    size && size.w !== size.h && size.w > size.h !== width > height ? 90 : 0;
  const deg = (auto + extra) % 360;
  const sideways = deg % 180 !== 0;

  return (
    <Image
      source={{ uri }}
      resizeMode="contain"
      // Xoay 90° thì đổi chỗ rộng/cao để khung ảnh khớp màn sau khi xoay.
      style={[
        sideways ? { width: height, height: width } : { width, height },
        { transform: [{ rotate: `${deg}deg` }] },
      ]}
    />
  );
}

/** Xem ảnh toàn màn hình nền tối, vuốt ngang qua các ảnh, có nút xoay. */
export function PhotoViewer({ images, index, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  // Nút và chú thích tránh tai thỏ / thanh hệ thống, nhất là khi xoay ngang.
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(index ?? 0);
  // Số độ xoay thêm theo từng ảnh (id), giữ khi vuốt qua lại.
  const [extra, setExtra] = useState<Record<number, number>>({});

  useEffect(() => {
    if (index !== null) {
      setCurrent(index);
      setExtra({});
    }
  }, [index]);

  const shown = images[current];
  const rotate = () =>
    shown && setExtra(e => ({ ...e, [shown.id]: ((e[shown.id] ?? 0) + 90) % 360 }));

  return (
    <Modal visible={index !== null} transparent animationType="fade" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={styles.root}>
        {index !== null ? (
          <FlatList
            key={`${width}x${height}`}
            data={images}
            horizontal
            pagingEnabled
            initialScrollIndex={current}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            keyExtractor={img => String(img.id)}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e =>
              setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={onClose}
                style={[styles.page, { width, height }]}
                accessibilityLabel="Đóng ảnh"
              >
                <ViewerImage uri={cloudinaryUrl(item.cloudinary_url)} extra={extra[item.id] ?? 0} />
              </Pressable>
            )}
          />
        ) : null}

        <View
          style={[
            styles.caption,
            {
              bottom: insets.bottom + 24,
              left: insets.left + layout.screenMargin,
              right: insets.right + layout.screenMargin,
            },
          ]}
          pointerEvents="none"
        >
          <Text variant="caption" style={styles.light} numberOfLines={2}>
            {shown?.caption ?? ''}
          </Text>
          <Text variant="caption" style={styles.light}>
            {current + 1}/{images.length}
          </Text>
        </View>

        <View style={[styles.actions, { top: Math.max(insets.top, 16) + 8, right: insets.right + 12 }]}>
          <IconButton accessibilityLabel="Xoay ảnh" variant="ghost" onPress={rotate} icon={renderRotate} />
          <IconButton accessibilityLabel="Đóng" variant="ghost" onPress={onClose} icon={renderClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  page: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  caption: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  light: { color: LIGHT, flexShrink: 1 },
  actions: { position: 'absolute', flexDirection: 'row', gap: 4 },
});

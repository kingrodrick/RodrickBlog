import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Check, Globe, ImageOff } from 'lucide-react-native';
import { EmptyState, ErrorState, Skeleton } from '../../../shared/ui';
import { iconSize, iconStroke, layout, radius, useTheme } from '../../../theme';
import { gridThumbUrl } from '../photoUrls';
import { Photo } from '../types';

/** Khe giữa các ô ảnh. */
const GAP = 2;

type Props = {
  photos: Photo[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  onRetry: () => void;
  onEndReached: () => void;
  onPhotoPress?: (index: number) => void;
  /** Nhấn giữ một ảnh (bắt đầu chọn ảnh); bỏ trống thì nhấn giữ không làm gì. */
  onPhotoLongPress?: (photo: Photo) => void;
  /** Đang ở chế độ chọn: hiện ô tick trên mọi ảnh. */
  selecting?: boolean;
  /** Các ảnh đang được chọn. */
  selectedIds?: ReadonlySet<number>;
  /** Câu hiện khi không có ảnh nào. */
  emptyMessage: string;
  /** Phần nằm trên lưới, cuộn cùng lưới (ví dụ tiêu đề bộ sưu tập). */
  header?: React.ReactElement;
  /** Đang xem lẫn cả hai loại: gắn nhãn web lên ảnh tham khảo để phân biệt. */
  tagReference?: boolean;
};

/**
 * Lần đầu xin ảnh thu nhỏ, Cloudinary phải dựng bản thu nhỏ từ ảnh gốc (PNG ~1MB); mở lưới là
 * hàng chục ảnh xin cùng lúc nên vài ảnh bị lỗi/quá giờ, và Image không tự tải lại.
 * Nên lỗi thì đợi rồi thử lại (lần sau Cloudinary đã có sẵn bản thu nhỏ, trả rất nhanh).
 */
const RETRY_DELAYS = [1500, 4000, 8000];

type CellProps = {
  photo: Photo;
  size: number;
  tagReference: boolean;
  selecting: boolean;
  selected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
};

/** Nền ô tick khi chưa chọn: đen trong để đọc được trên mọi ảnh (không dùng viền). */
const TICK_IDLE = 'rgba(0,0,0,0.35)';
/** Phủ tối ảnh đang chọn. */
const SELECTED_DIM = 'rgba(0,0,0,0.3)';

function GridCell({
  photo,
  size,
  tagReference,
  selecting,
  selected,
  onPress,
  onLongPress,
}: CellProps) {
  const { colors } = useTheme();
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const onError = () => {
    if (attempt < RETRY_DELAYS.length) {
      timer.current = setTimeout(() => setAttempt(a => a + 1), RETRY_DELAYS[attempt]);
    } else {
      setFailed(true);
    }
  };

  const reference = tagReference && !photo.isReal;
  const box = { width: size, height: size, backgroundColor: colors.surfaceMuted };

  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={`${reference ? 'Ảnh tham khảo' : 'Ảnh'}${photo.caption ? `, ${photo.caption}` : ''}`}
      accessibilityState={selecting ? { selected } : undefined}
      accessibilityHint={selecting ? 'Chạm để chọn hoặc bỏ chọn' : undefined}
      delayLongPress={400}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {failed ? (
        // Hết lượt thử: ảnh không còn trên Cloudinary (404) hoặc mạng hỏng hẳn.
        <View style={[box, styles.center]}>
          <ImageOff
            size={iconSize.control}
            color={colors.textMuted}
            strokeWidth={iconStroke.normal}
            strokeLinecap="round"
          />
        </View>
      ) : (
        <Image
          // Đổi key để dựng lại Image và xin ảnh lần nữa.
          key={attempt}
          // Ảnh giữ tỉ lệ, cắt vuông lúc hiển thị; màn xem ảnh dùng lại ảnh này làm ảnh tạm.
          source={{ uri: gridThumbUrl(photo.url) }}
          resizeMode="cover"
          onError={onError}
          style={box}
        />
      )}
      {reference ? (
        <View style={[styles.tag, { backgroundColor: colors.referenceBg }]}>
          <Globe size={14} color={colors.referenceLabel} strokeWidth={2} strokeLinecap="round" />
        </View>
      ) : null}
      {selecting ? (
        <>
          {selected ? <View style={[StyleSheet.absoluteFill, { backgroundColor: SELECTED_DIM }]} /> : null}
          <View style={[styles.tick, { backgroundColor: selected ? colors.accentFill : TICK_IDLE }]}>
            {selected ? (
              <Check size={16} color={colors.onAccent} strokeWidth={2.5} strokeLinecap="round" />
            ) : null}
          </View>
        </>
      ) : null}
    </Pressable>
  );
}

/** Màn dọc 3 cột; màn rộng (xoay ngang, máy tính bảng) thêm cột cho ô không quá to. */
const columnsFor = (width: number) => Math.max(3, Math.round(width / 160));

/** Lưới ảnh vuông sát mép màn, chỉ có ảnh, không chữ. */
export function PhotoGrid({
  photos,
  loading,
  loadingMore,
  error,
  onRetry,
  onEndReached,
  onPhotoPress,
  onPhotoLongPress,
  selecting = false,
  selectedIds,
  emptyMessage,
  header,
  tagReference = false,
}: Props) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const cols = columnsFor(width);
  // Làm tròn xuống theo điểm ảnh để tổng các ô không vượt bề ngang (ô cuối không bị đẩy xuống hàng).
  const size = width ? Math.floor((width - GAP * (cols - 1)) / cols) : 0;

  let body: React.ReactNode = null;
  if (!width) {
    body = null;
  } else if (loading) {
    body = (
      // Dựng từng hàng đủ số cột (không dùng flexWrap: cộng dồn số lẻ của cỡ ô làm ô cuối
      // tràn sang hàng dưới, lưới chờ chỉ còn 2 cột).
      <View style={styles.content}>
        {Array.from({ length: 5 }, (_, r) => (
          <View key={r} style={styles.skeletonRow}>
            {Array.from({ length: cols }, (__, c) => (
              <Skeleton key={c} width={size} height={size} borderRadius={0} />
            ))}
          </View>
        ))}
      </View>
    );
  } else if (error) {
    body = (
      <View style={styles.state}>
        <ErrorState message={error} onRetry={onRetry} />
      </View>
    );
  } else {
    body = (
      <FlatList
        key={cols}
        data={photos}
        // Đổi lựa chọn thì vẽ lại các ô (FlatList chỉ vẽ lại khi data hoặc extraData đổi).
        extraData={selectedIds}
        numColumns={cols}
        keyExtractor={p => String(p.id)}
        columnWrapperStyle={cols > 1 ? styles.row : undefined}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.state}>
            <EmptyState message={emptyMessage} />
          </View>
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={styles.more} color={colors.textSecondary} /> : undefined
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={1.5}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRetry} tintColor={colors.textSecondary} />
        }
        showsVerticalScrollIndicator={false}
        // Lưới dài: chỉ dựng các hàng gần màn hình.
        initialNumToRender={cols * 6}
        windowSize={7}
        renderItem={({ item, index }) => (
          <GridCell
            photo={item}
            size={size}
            tagReference={tagReference}
            selecting={selecting}
            selected={selectedIds?.has(item.id) ?? false}
            onPress={() => onPhotoPress?.(index)}
            onLongPress={onPhotoLongPress ? () => onPhotoLongPress(item) : undefined}
          />
        )}
      />
    );
  }

  return (
    <View style={styles.bleed} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  // Lưới tràn sát hai mép màn (bù lề 20 của Screen).
  bleed: { flex: 1, marginHorizontal: -layout.screenMargin },
  content: { gap: GAP, paddingBottom: 24 },
  row: { gap: GAP },
  // FlatList tự xếp ngang trong columnWrapperStyle; hàng của lưới chờ là View thường nên phải tự đặt row.
  skeletonRow: { flexDirection: 'row', gap: GAP },
  center: { alignItems: 'center', justifyContent: 'center' },
  tick: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: radius.label,
    alignItems: 'center',
    justifyContent: 'center',
  },
  state: { paddingHorizontal: layout.screenMargin, paddingTop: 24 },
  more: { paddingVertical: 16 },
});

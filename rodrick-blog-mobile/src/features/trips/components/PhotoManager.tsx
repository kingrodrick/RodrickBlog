import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Pencil, Plus } from 'lucide-react-native';
import { IconButton, Text } from '../../../shared/ui';
import { cloudinaryUrl } from '../../../shared/utils/cloudinary';
import { iconSize, iconStroke, radius, useTheme } from '../../../theme';
import { DetailEvent, EventImage } from '../types';
import { AddPhotosFlow } from './AddPhotosFlow';
import { PhotoEditSheet } from './PhotoEditSheet';

type Props = {
  event: DetailEvent;
  tripTitle: string;
  /** Có thay đổi đã ghi vào DB: màn cha tải lại dữ liệu và báo toast. */
  onChanged: (message: string) => void;
  onError: (message: string) => void;
};

const penIcon = (c: string) => (
  <Pencil color={c} size={iconSize.inline + 4} strokeWidth={iconStroke.normal} strokeLinecap="round" />
);
const plusIcon = (c: string) => (
  <Plus color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />
);

/**
 * Tab 2 của hộp thoại Sửa mốc: chỉ ảnh minh họa (thẻ giấy kraft xếp dọc), sửa từng ảnh và thêm ảnh.
 * Ảnh thực tế thêm ở trang Ảnh của chi tiết mốc, xoá/chuyển bộ sưu tập ở tab Ảnh.
 */
export function PhotoManager({ event, tripTitle, onChanged, onError }: Props) {
  const { colors } = useTheme();
  const [editing, setEditing] = useState<EventImage | null>(null);
  const [adding, setAdding] = useState(false);

  const list = event.images.filter(i => i.is_real_photo === false);

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text variant="overline" tone="muted" numberOfLines={1} style={styles.headLabel}>
          Ảnh minh họa{list.length ? ` • ${list.length}` : ''}
        </Text>
        {/* Nút thêm gọn ở đầu mục (thay ô lớn cuối danh sách), giống nút thao tác trên header. */}
        <IconButton
          accessibilityLabel="Thêm ảnh minh họa"
          // Trong suốt, chỉ còn dấu +: nhẹ nhất có thể, vùng chạm vẫn đủ 44.
          variant="ghost"
          onPress={() => setAdding(true)}
          icon={plusIcon}
        />
      </View>

      {list.length === 0 ? (
        <Text variant="caption" tone="secondary">
          Chưa có ảnh minh họa. Bấm + để thêm.
        </Text>
      ) : null}

      <View style={styles.stack}>
        {list.map((img, i) => (
          <View key={img.id} style={[styles.kraft, { backgroundColor: colors.referenceBg }]}>
            <Image
              source={{ uri: cloudinaryUrl(img.cloudinary_url, { w: 900, h: 720 }) }}
              style={[styles.refImg, { backgroundColor: colors.surfaceMuted }]}
            />
            <View style={styles.pen}>
              <IconButton accessibilityLabel={`Sửa ảnh ${i + 1}`} onPress={() => setEditing(img)} icon={penIcon} />
            </View>
            <View style={styles.cap}>
              <Text variant="caption" style={[styles.capText, { color: colors.referenceLabel }]}>
                {img.caption ?? ''}
              </Text>
              <Text variant="caption" style={{ color: colors.referenceLabel }}>
                {i + 1}/{list.length}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <AddPhotosFlow
        open={adding}
        kind="ref"
        event={event}
        tripTitle={tripTitle}
        onClose={() => setAdding(false)}
        onAdded={count => onChanged(`Đã thêm ${count} ảnh`)}
        onError={onError}
      />
      <PhotoEditSheet
        image={editing}
        event={event}
        tripTitle={tripTitle}
        onClose={() => setEditing(null)}
        onChanged={message => {
          setEditing(null);
          onChanged(message);
        }}
        onError={onError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  headLabel: { flex: 1 },
  stack: { gap: 12 },
  kraft: { borderRadius: radius.card, padding: 8 },
  refImg: { width: '100%', aspectRatio: 5 / 4, borderRadius: 10 },
  pen: { position: 'absolute', top: 12, right: 12 },
  cap: { flexDirection: 'row', gap: 12, paddingHorizontal: 6, paddingTop: 10, paddingBottom: 4 },
  capText: { flex: 1 },
});

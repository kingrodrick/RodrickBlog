import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Pencil, Plus } from 'lucide-react-native';
import { IconButton, Segmented, Text } from '../../../shared/ui';
import { cloudinaryUrl } from '../../../shared/utils/cloudinary';
import { iconSize, iconStroke, radius, useTheme } from '../../../theme';
import { DetailEvent, EventImage } from '../types';
import { AddPhotosFlow } from './AddPhotosFlow';
import { PhotoEditSheet } from './PhotoEditSheet';

type Kind = 'ref' | 'real';

type Props = {
  event: DetailEvent;
  tripTitle: string;
  /** Có thay đổi đã ghi vào DB: màn cha tải lại dữ liệu và báo toast. */
  onChanged: (message: string) => void;
  onError: (message: string) => void;
};

const KINDS = [
  { value: 'ref' as const, label: 'Minh họa' },
  { value: 'real' as const, label: 'Thực tế' },
];

const penIcon = (c: string) => (
  <Pencil color={c} size={iconSize.inline + 4} strokeWidth={iconStroke.normal} strokeLinecap="round" />
);

/** Tab 2 của hộp thoại Sửa mốc: danh sách ảnh minh họa / thực tế, sửa từng ảnh và thêm ảnh. */
export function PhotoManager({ event, tripTitle, onChanged, onError }: Props) {
  const { colors } = useTheme();
  const [kind, setKind] = useState<Kind>('ref');
  const [editing, setEditing] = useState<EventImage | null>(null);
  const [adding, setAdding] = useState(false);

  const list = event.images.filter(i => (kind === 'ref' ? i.is_real_photo === false : i.is_real_photo !== false));
  const addTile = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Thêm ảnh"
      onPress={() => setAdding(true)}
      style={[
        styles.add,
        kind === 'ref' ? styles.addRef : styles.addReal,
        { backgroundColor: kind === 'ref' ? colors.referenceBg : colors.surfaceMuted },
      ]}>
      <Plus
        color={kind === 'ref' ? colors.referenceLabel : colors.textSecondary}
        size={iconSize.empty}
        strokeWidth={iconStroke.normal}
        strokeLinecap="round"
      />
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <Segmented options={KINDS} value={kind} onChange={setKind} />
      <View style={styles.head}>
        <Text variant="overline" tone="muted">
          {kind === 'ref' ? 'Ảnh minh họa' : 'Ảnh thực tế'}
        </Text>
        <Text variant="overline" tone="muted">
          {list.length}
        </Text>
      </View>

      {kind === 'ref' ? (
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
          {addTile}
        </View>
      ) : (
        <View style={styles.grid}>
          {list.map((img, i) => (
            <View key={img.id} style={styles.cell}>
              <Image
                source={{ uri: cloudinaryUrl(img.cloudinary_url, { w: 480, h: 480 }) }}
                style={[styles.realImg, { backgroundColor: colors.surfaceMuted }]}
              />
              <View style={styles.pen}>
                <IconButton accessibilityLabel={`Sửa ảnh ${i + 1}`} onPress={() => setEditing(img)} icon={penIcon} />
              </View>
            </View>
          ))}
          <View style={styles.cell}>{addTile}</View>
        </View>
      )}

      <AddPhotosFlow
        open={adding}
        kind={kind}
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
  head: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 8 },
  stack: { gap: 12 },
  kraft: { borderRadius: radius.card, padding: 8 },
  refImg: { width: '100%', aspectRatio: 5 / 4, borderRadius: 10 },
  pen: { position: 'absolute', top: 12, right: 12 },
  cap: { flexDirection: 'row', gap: 12, paddingHorizontal: 6, paddingTop: 10, paddingBottom: 4 },
  capText: { flex: 1 },
  add: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.card },
  addRef: { height: 84 },
  addReal: { aspectRatio: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47.5%' },
  realImg: { width: '100%', aspectRatio: 1, borderRadius: radius.card },
});

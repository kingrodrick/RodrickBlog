import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { ArrowLeftRight, Trash2 } from 'lucide-react-native';
import { Button, Dialog, IconButton, Sheet, Text, TextField } from '../../../shared/ui';
import { cloudinaryUrl } from '../../../shared/utils/cloudinary';
import { iconSize, iconStroke, radius, useTheme } from '../../../theme';
import { discardCloudinaryFile, removeEventImage, updateEventImage } from '../api/imageApi';
import { hostOf, PendingPhoto, photoFolder, uploadPending } from '../photoUpload';
import { DetailEvent, EventImage } from '../types';
import { ImageSourceFlow } from './ImageSourceFlow';

type Props = {
  image: EventImage | null;
  event: DetailEvent;
  tripTitle: string;
  onClose: () => void;
  /** Đã sửa hoặc xoá xong; `message` để báo bằng toast. */
  onChanged: (message: string) => void;
  onError: (message: string) => void;
};

const swapIcon = (c: string) => (
  <ArrowLeftRight color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />
);
const trashIcon = (c: string) => (
  <Trash2 color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />
);

/** Sheet sửa một ảnh: đổi sang ảnh khác, sửa mô tả, hoặc xoá. */
export function PhotoEditSheet({ image, event, tripTitle, onClose, onChanged, onError }: Props) {
  const { colors } = useTheme();
  const [caption, setCaption] = useState('');
  const [replacement, setReplacement] = useState<PendingPhoto | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [askDelete, setAskDelete] = useState(false);

  useEffect(() => {
    setCaption(image?.caption ?? '');
    setReplacement(null);
    setSaving(false);
    setChoosing(false);
    setAskDelete(false);
  }, [image]);

  if (!image) {
    return null;
  }
  const isReal = image.is_real_photo !== false;

  const save = async () => {
    setSaving(true);
    try {
      let url: string | undefined;
      if (replacement) {
        url = await uploadPending(replacement, photoFolder(tripTitle, event, isReal));
      }
      await updateEventImage(image.id, {
        caption: caption.trim() || null,
        ...(url ? { cloudinary_url: url, source_url: replacement?.sourceUrl ?? null } : {}),
      });
      if (url) {
        // Dòng DB đã trỏ sang ảnh mới; file cũ xoá được thì tốt, không thì bỏ qua.
        discardCloudinaryFile(image.cloudinary_url).catch(() => false);
      }
      onChanged(url ? 'Đã đổi ảnh' : 'Đã lưu mô tả');
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Không lưu được ảnh.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setAskDelete(false);
    setSaving(true);
    try {
      const { cdnDeleted } = await removeEventImage(image);
      onChanged(cdnDeleted ? 'Đã xoá ảnh' : 'Đã xoá ảnh, file trên Cloudinary chưa xoá được');
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Không xoá được ảnh.');
    } finally {
      setSaving(false);
    }
  };

  const preview = replacement?.previewUri ?? cloudinaryUrl(image.cloudinary_url, { w: 900, h: 600 });

  return (
    <>
      <Sheet visible onClose={saving ? () => {} : onClose}>
        <Text variant="heading" style={styles.title}>
          Sửa ảnh
        </Text>
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.frame, { backgroundColor: isReal ? colors.surface : colors.referenceBg }]}>
            <Image source={{ uri: preview }} style={[styles.image, { backgroundColor: colors.surfaceMuted }]} />
            <View style={styles.swap}>
              <IconButton accessibilityLabel="Chọn ảnh khác" onPress={() => setChoosing(true)} icon={swapIcon} />
            </View>
          </View>
          {replacement?.remoteUrl ? (
            <Text variant="caption" tone="muted">
              Nguồn mới: {hostOf(replacement.sourceUrl ?? replacement.remoteUrl)}
            </Text>
          ) : null}
          <TextField
            label="Mô tả ảnh"
            value={caption}
            onChangeText={setCaption}
            editable={!saving}
            placeholder="Không bắt buộc"
          />
        </ScrollView>
        <View style={styles.footer}>
          <IconButton variant="danger" accessibilityLabel="Xoá ảnh" disabled={saving} onPress={() => setAskDelete(true)} icon={trashIcon} />
          <View style={styles.save}>
            <Button title="Lưu" loading={saving} onPress={save} />
          </View>
        </View>
      </Sheet>

      <ImageSourceFlow
        open={choosing}
        kind={isReal ? 'real' : 'ref'}
        limit={1}
        query={event.location_name}
        onClose={() => setChoosing(false)}
        onPicked={photos => setReplacement(photos[0] ?? null)}
        onError={onError}
      />

      <Dialog
        visible={askDelete}
        title="Xoá ảnh này?"
        description="Ảnh sẽ bị xoá khỏi mốc và không khôi phục được."
        confirmLabel="Xoá"
        destructive
        onCancel={() => setAskDelete(false)}
        onConfirm={remove}
      />
    </>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  body: { paddingHorizontal: 20, gap: 12, paddingBottom: 8 },
  frame: { borderRadius: radius.card, padding: 6 },
  image: { width: '100%', aspectRatio: 16 / 10, borderRadius: 10 },
  swap: { position: 'absolute', top: 14, right: 14 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  save: { flex: 1 },
});

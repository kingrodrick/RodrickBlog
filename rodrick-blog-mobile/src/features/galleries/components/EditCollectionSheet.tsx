import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, LayoutChangeEvent, ScrollView, ScrollViewInstance, StyleSheet, View } from 'react-native';
import { LocalImage, uploadToCloudinary } from '../../../shared/api/cloudinary';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useKeyboardHeight } from '../../../shared/hooks/useKeyboardHeight';
import { Button, Chip, Sheet, Text, TextField } from '../../../shared/ui';
import { cloudinaryUrl } from '../../../shared/utils/cloudinary';
import { pickImages } from '../../../shared/utils/pickImages';
import { radius, useTheme } from '../../../theme';
import {
  COVER_FOLDER,
  CollectionInfo,
  fetchTripOptions,
  normalizeSlug,
  updateCollectionInfo,
} from '../api/collections';

type Props = {
  visible: boolean;
  collectionId: number;
  /** Thông tin hiện tại; null khi chưa tải xong. */
  info: CollectionInfo | null;
  onClose: () => void;
  onSaved: (info: CollectionInfo) => void;
};

/** Bìa 16:9; tải cỡ gấp đôi khung cho màn mật độ cao. */
const COVER = { w: 800, h: 450 };

/** Khoảng chừa phía trên ô đang nhập khi cuộn tới (để thấy cả nhãn của ô). */
const REVEAL_MARGIN = 12;

/**
 * Cuộn ô đang nhập lên đầu vùng nhìn thấy của sheet. Sheet co lại phía trên bàn phím nhưng
 * ScrollView không tự cuộn tới ô vừa chạm, nên các ô phía dưới bị bàn phím che.
 * Mỗi ô bọc trong View có onLayout (vị trí tính theo nội dung ScrollView) và báo onFocus.
 */
function useRevealFocused() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const positions = useRef<Record<string, number>>({});
  const focused = useRef<string | null>(null);
  const keyboard = useKeyboardHeight();

  const reveal = useCallback(() => {
    const key = focused.current;
    const y = key ? positions.current[key] : undefined;
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - REVEAL_MARGIN), animated: true });
    }
  }, []);

  // Bàn phím vừa hiện (hoặc đổi cao): chờ sheet co lại xong rồi mới cuộn.
  useEffect(() => {
    if (keyboard > 0) {
      const t = setTimeout(reveal, 50);
      return () => clearTimeout(t);
    }
  }, [keyboard, reveal]);

  const field = (key: string) => ({
    onLayout: (e: LayoutChangeEvent) => {
      positions.current[key] = e.nativeEvent.layout.y;
    },
    onFocus: () => {
      focused.current = key;
      // Bàn phím đang mở sẵn (chuyển từ ô này sang ô khác): cuộn luôn.
      if (keyboard > 0) {
        reveal();
      }
    },
  });

  return { scrollRef, field };
}

/** Chọn chuyến đi gán cho bộ sưu tập (cột trip_id); "Chưa gán" là null. */
function TripPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (tripId: number | null) => void;
}) {
  const trips = useAsync(fetchTripOptions);
  return (
    <View style={styles.field}>
      <Text variant="label">Chuyến đi</Text>
      {trips.error ? (
        <Text variant="caption" tone="error">
          {trips.error}
        </Text>
      ) : (
        <View style={styles.chips}>
          <Chip label="Chưa gán" selected={value === null} onPress={() => onChange(null)} />
          {(trips.data ?? []).map(t => (
            <Chip key={t.id} label={t.title} selected={value === t.id} onPress={() => onChange(t.id)} />
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Sửa thông tin bộ sưu tập: ảnh bìa, tên, slug, mô tả, địa điểm, chuyến đi.
 * Ảnh bìa mới chỉ tải lên khi bấm Lưu. Thứ tự hiển thị sắp bằng kéo thả ở danh sách bộ sưu tập.
 */
export function EditCollectionSheet({ visible, collectionId, info, onClose, onSaved }: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [tripId, setTripId] = useState<number | null>(null);
  const [newCover, setNewCover] = useState<LocalImage | null>(null);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [slugError, setSlugError] = useState<string | undefined>();
  // Lỗi hiện ngay trong sheet (toast của màn nằm dưới lớp phủ của sheet nên không thấy).
  const [error, setError] = useState<string | null>(null);
  const { scrollRef, field } = useRevealFocused();
  const titleField = field('title');
  const slugField = field('slug');
  const descriptionField = field('description');
  const locationField = field('location');

  // Mỗi lần mở: điền lại từ thông tin hiện tại, bỏ ảnh bìa chọn dở.
  useEffect(() => {
    if (visible && info) {
      setTitle(info.title);
      setSlug(info.slug);
      setDescription(info.description ?? '');
      setLocationTag(info.locationTag ?? '');
      setTripId(info.tripId);
      setNewCover(null);
      setTitleError(undefined);
      setSlugError(undefined);
      setError(null);
    }
  }, [visible, info]);

  const pickCover = async () => {
    try {
      const [img] = await pickImages(1);
      if (img) {
        setNewCover(img);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không mở được thư viện ảnh.');
    }
  };

  const save = async () => {
    if (!info) {
      return;
    }
    const cleanSlug = normalizeSlug(slug);
    const missingTitle = !title.trim();
    setTitleError(missingTitle ? 'Nhập tên bộ sưu tập.' : undefined);
    setSlugError(cleanSlug ? undefined : 'Nhập slug (chữ không dấu, số, gạch nối).');
    if (missingTitle || !cleanSlug) {
      return;
    }
    setSlug(cleanSlug);
    setError(null);
    setSaving(true);
    try {
      const coverImage = newCover ? await uploadToCloudinary(newCover, COVER_FOLDER) : info.coverImage;
      const next: CollectionInfo = {
        title: title.trim(),
        slug: cleanSlug,
        description: description.trim() || null,
        locationTag: locationTag.trim() || null,
        coverImage,
        tripId,
      };
      await updateCollectionInfo(collectionId, next);
      onSaved(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không lưu được bộ sưu tập.');
    } finally {
      setSaving(false);
    }
  };

  const previewUri = newCover
    ? newCover.uri
    : info?.coverImage
    ? cloudinaryUrl(info.coverImage, COVER)
    : null;

  return (
    <Sheet visible={visible} onClose={saving ? () => {} : onClose} full title="Sửa bộ sưu tập">
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {previewUri ? (
          <Image
            accessibilityLabel="Ảnh bìa"
            source={{ uri: previewUri }}
            style={[styles.cover, { backgroundColor: colors.surfaceMuted }]}
          />
        ) : (
          <View style={[styles.cover, { backgroundColor: colors.surfaceMuted }]} />
        )}
        <Button
          title={newCover ? 'Chọn ảnh khác' : 'Tải ảnh bìa mới'}
          variant="secondary"
          size="md"
          disabled={saving || !info}
          onPress={pickCover}
        />
        <View onLayout={titleField.onLayout}>
          <TextField
            label="Tên bộ sưu tập"
            value={title}
            onChangeText={t => {
              setTitle(t);
              setTitleError(undefined);
            }}
            onFocus={titleField.onFocus}
            error={titleError}
            editable={!saving}
          />
        </View>
        <View onLayout={slugField.onLayout}>
          <TextField
            label="Slug (đường dẫn trên web)"
            value={slug}
            onChangeText={t => {
              setSlug(t);
              setSlugError(undefined);
            }}
            onFocus={slugField.onFocus}
            // Gõ xong thì chuẩn hoá ngay để thấy đúng slug sẽ lưu.
            onBlur={() => setSlug(s => normalizeSlug(s))}
            autoCapitalize="none"
            autoCorrect={false}
            error={slugError}
            editable={!saving}
          />
        </View>
        <View onLayout={descriptionField.onLayout}>
          <TextField
            label="Mô tả"
            value={description}
            onChangeText={setDescription}
            onFocus={descriptionField.onFocus}
            editable={!saving}
          />
        </View>
        <View onLayout={locationField.onLayout}>
          <TextField
            label="Địa điểm (ví dụ Kyoto, JP)"
            value={locationTag}
            onChangeText={setLocationTag}
            onFocus={locationField.onFocus}
            editable={!saving}
          />
        </View>
        <TripPicker value={tripId} onChange={setTripId} />
        {error ? (
          <Text variant="caption" tone="error" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
        <Button title="Lưu" loading={saving} disabled={!info} onPress={save} />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroll: { flexShrink: 1 },
  body: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.card },
  field: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

import React, { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useRetained } from '../../../shared/hooks/useRetained';
import { Button, Chip, Sheet, Text, TextField } from '../../../shared/ui';
import { radius, useTheme } from '../../../theme';
import { fetchCollectionChoices } from '../api/collectionApi';
import { addEventImage } from '../api/imageApi';
import { hostOf, PendingPhoto, photoFolder, uploadPending } from '../photoUpload';
import { DetailEvent } from '../types';

type Status = { state: 'idle' | 'uploading' | 'done' | 'error'; message?: string };

type Props = {
  /** Rỗng thì sheet đóng. */
  items: PendingPhoto[];
  isReal: boolean;
  event: DetailEvent;
  tripTitle: string;
  onClose: () => void;
  /** Gọi khi mọi ảnh đã được thêm. */
  onDone: (count: number) => void;
};

/**
 * Chọn bộ sưu tập cho các ảnh sắp thêm. Chỉ dựng khi sheet mở nên chỉ tải danh sách lúc cần.
 * `value` undefined: chưa chọn gì, tải xong thì nhận gợi ý (bộ duy nhất của chuyến đi này).
 */
function CollectionPicker({
  eventId,
  value,
  onChange,
  disabled,
}: {
  eventId: number;
  value: number | null | undefined;
  onChange: (id: number | null) => void;
  disabled: boolean;
}) {
  const load = useCallback(() => fetchCollectionChoices(eventId), [eventId]);
  const choices = useAsync(load);
  const suggested = choices.data?.suggestedId;
  const failed = choices.error !== null;

  useEffect(() => {
    if (value !== undefined) {
      return;
    }
    if (suggested !== undefined) {
      onChange(suggested);
    } else if (failed) {
      // Không tải được danh sách: coi như không gán, để vẫn thêm ảnh được.
      onChange(null);
    }
  }, [value, suggested, failed, onChange]);

  const pick = (id: number | null) => {
    if (!disabled) {
      onChange(id);
    }
  };

  return (
    <View style={styles.picker}>
      <Text variant="label">Bộ sưu tập</Text>
      {choices.error ? (
        <Text variant="caption" tone="error">
          {choices.error}
        </Text>
      ) : choices.loading ? (
        <Text variant="caption" tone="muted">
          Đang tải bộ sưu tập...
        </Text>
      ) : (
        <View style={styles.chips}>
          <Chip label="Không gán" selected={(value ?? null) === null} onPress={() => pick(null)} />
          {(choices.data?.options ?? []).map(c => (
            <Chip key={c.id} label={c.title} selected={value === c.id} onPress={() => pick(c.id)} />
          ))}
        </View>
      )}
    </View>
  );
}

/** Xem trước, nhập mô tả rồi tải lên Cloudinary và ghi vào bảng images. Ảnh chỉ vào app sau khi bấm xác nhận. */
export function PhotoUploadSheet({ items, isReal, event, tripTitle, onClose, onDone }: Props) {
  const { colors } = useTheme();
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [busy, setBusy] = useState(false);
  // Bộ sưu tập gán cho mọi ảnh của lượt này; undefined là chưa có lựa chọn (chờ gợi ý).
  const [collectionId, setCollectionId] = useState<number | null | undefined>(undefined);

  // Lượt chọn ảnh mới thì làm lại từ đầu; đóng sheet (items rỗng) thì giữ nguyên để vẽ lúc trượt xuống.
  useEffect(() => {
    if (items.length > 0) {
      setCaptions({});
      setStatus({});
      setBusy(false);
      setCollectionId(undefined);
    }
  }, [items]);
  // Nội dung vẽ: danh sách cuối cùng khác rỗng (sheet còn trượt xuống sau khi màn cha xoá items).
  const shown = useRetained(items.length > 0 ? items : null) ?? [];

  const confirm = async () => {
    setBusy(true);
    const folder = photoFolder(tripTitle, event, isReal);
    let failed = 0;
    for (const p of items) {
      if (status[p.key]?.state === 'done') {
        continue;
      }
      setStatus(s => ({ ...s, [p.key]: { state: 'uploading' } }));
      try {
        const url = await uploadPending(p, folder);
        await addEventImage(event, {
          url,
          caption: captions[p.key] ?? null,
          isReal,
          sourceUrl: p.sourceUrl,
          collectionId: collectionId ?? null,
        });
        setStatus(s => ({ ...s, [p.key]: { state: 'done' } }));
      } catch (e) {
        failed += 1;
        setStatus(s => ({
          ...s,
          [p.key]: { state: 'error', message: e instanceof Error ? e.message : 'Không tải được ảnh.' },
        }));
      }
    }
    setBusy(false);
    if (failed === 0) {
      onDone(items.length);
    }
  };

  const hasError = items.some(p => status[p.key]?.state === 'error');
  const title = isReal ? `Thêm ${shown.length} ảnh thực tế` : 'Thêm ảnh minh họa';
  const action = hasError ? 'Thử lại' : shown.length > 1 ? `Thêm ${shown.length} ảnh` : 'Xác nhận thêm ảnh';

  return (
    <Sheet visible={items.length > 0} onClose={busy ? () => {} : onClose} full={shown.length > 2} title={title}>
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listBody}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {shown.length > 0 ? (
          <CollectionPicker
            eventId={event.id}
            value={collectionId}
            onChange={setCollectionId}
            disabled={busy}
          />
        ) : null}
        {shown.map(p => {
          const st = status[p.key];
          return (
            <View key={p.key} style={[styles.tile, { backgroundColor: colors.surface }]}>
              <Image source={{ uri: p.previewUri }} style={[styles.thumb, { backgroundColor: colors.surfaceMuted }]} />
              <View style={styles.fields}>
                <TextField
                  label="Mô tả"
                  value={captions[p.key] ?? ''}
                  onChangeText={t => setCaptions(c => ({ ...c, [p.key]: t }))}
                  editable={!busy && st?.state !== 'done'}
                  placeholder="Không bắt buộc"
                />
                {p.remoteUrl ? (
                  <Text variant="caption" tone="muted">
                    Nguồn: {hostOf(p.sourceUrl ?? p.remoteUrl)}
                  </Text>
                ) : null}
                {st ? (
                  <Text variant="caption" tone={st.state === 'error' ? 'error' : 'secondary'}>
                    {st.state === 'uploading' ? 'Đang tải...' : st.state === 'done' ? 'Đã thêm' : st.message}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        {/* Chờ danh sách bộ sưu tập tải xong (để không lỡ gợi ý) rồi mới cho thêm. */}
        <Button title={action} loading={busy} disabled={collectionId === undefined} onPress={confirm} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { flexShrink: 1 },
  listBody: { paddingHorizontal: 20, gap: 12, paddingBottom: 8 },
  tile: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: radius.card, alignItems: 'flex-start' },
  thumb: { width: 72, height: 72, borderRadius: 10 },
  fields: { flex: 1, gap: 6 },
  picker: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
});

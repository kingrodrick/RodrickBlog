import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Sheet, Text, TextField } from '../../../shared/ui';
import { radius, useTheme } from '../../../theme';
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

/** Xem trước, nhập mô tả rồi tải lên Cloudinary và ghi vào bảng images. Ảnh chỉ vào app sau khi bấm xác nhận. */
export function PhotoUploadSheet({ items, isReal, event, tripTitle, onClose, onDone }: Props) {
  const { colors } = useTheme();
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCaptions({});
    setStatus({});
    setBusy(false);
  }, [items]);

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
        await addEventImage(event, { url, caption: captions[p.key] ?? null, isReal, sourceUrl: p.sourceUrl });
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
  const title = isReal ? `Thêm ${items.length} ảnh thực tế` : 'Thêm ảnh minh họa';
  const action = hasError ? 'Thử lại' : items.length > 1 ? `Thêm ${items.length} ảnh` : 'Xác nhận thêm ảnh';

  return (
    <Sheet visible={items.length > 0} onClose={busy ? () => {} : onClose} full={items.length > 2}>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listBody}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {items.map(p => {
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
        <Button title={action} loading={busy} onPress={confirm} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  list: { flexShrink: 1 },
  listBody: { paddingHorizontal: 20, gap: 12, paddingBottom: 8 },
  tile: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: radius.card, alignItems: 'flex-start' },
  thumb: { width: 72, height: 72, borderRadius: 10 },
  fields: { flex: 1, gap: 6 },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
});

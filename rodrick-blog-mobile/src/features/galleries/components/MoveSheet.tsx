import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ErrorState, Sheet, Skeleton, Text } from '../../../shared/ui';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useRetained } from '../../../shared/hooks/useRetained';
import { layout, radius, useTheme } from '../../../theme';
import { fetchCollections } from '../api/collections';
import { Collection } from '../types';

type Props = {
  visible: boolean;
  /** Số ảnh đang chọn, hiện ở tiêu đề. */
  count: number;
  /** Bộ sưu tập đang xem (ẩn khỏi danh sách vì ảnh đã ở đó). */
  currentId?: number;
  onPick: (collection: Collection) => void;
  onClose: () => void;
};

/** Danh sách bộ sưu tập để chọn nơi chuyển ảnh tới; chỉ tải khi sheet mở. */
function CollectionChoices({ currentId, onPick }: Pick<Props, 'currentId' | 'onPick'>) {
  const { colors } = useTheme();
  const collections = useAsync(fetchCollections);

  if (collections.loading) {
    return (
      <View style={styles.list}>
        <Skeleton height={64} borderRadius={radius.card} />
        <Skeleton height={64} borderRadius={radius.card} />
      </View>
    );
  }
  if (collections.error) {
    return <ErrorState message={collections.error} onRetry={collections.reload} />;
  }
  const choices = (collections.data ?? []).filter(c => c.id !== currentId);
  if (!choices.length) {
    return (
      <Text variant="body" tone="secondary" style={styles.empty}>
        Chưa có bộ sưu tập nào khác.
      </Text>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {choices.map(c => (
        <Pressable
          key={c.id}
          accessibilityRole="button"
          accessibilityLabel={`Chuyển sang ${c.title}`}
          onPress={() => onPick(c)}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: pressed ? colors.surfaceMuted : colors.surface },
          ]}
        >
          {c.tripTitle ? (
            <Text variant="overline" tone="muted" numberOfLines={1}>
              {c.tripTitle}
            </Text>
          ) : null}
          <Text variant="heading" numberOfLines={1}>
            {c.title}
          </Text>
          <Text variant="caption" tone="muted">
            {c.photoCount ? `${c.photoCount} ảnh` : 'Chưa có ảnh'}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** Chọn bộ sưu tập để chuyển các ảnh đang chọn sang; chạm một bộ là chuyển luôn. */
export function MoveSheet({ visible, count, currentId, onPick, onClose }: Props) {
  // Mỗi lần mở là một lượt: danh sách dựng lại (tải số ảnh mới), còn lúc đóng vẫn giữ để
  // sheet trượt xuống với nội dung cũ thay vì co lại.
  const [session, setSession] = useState(0);
  useEffect(() => {
    if (visible) {
      setSession(s => s + 1);
    }
  }, [visible]);
  // Chuyển xong thì lựa chọn về 0 ngay; tiêu đề giữ số lúc mở.
  const shownCount = useRetained(visible ? count : null) ?? count;
  return (
    <Sheet visible={visible} onClose={onClose} title={`Chuyển ${shownCount} ảnh sang bộ sưu tập`}>
      {session > 0 ? <CollectionChoices key={session} currentId={currentId} onPick={onPick} /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  row: { borderRadius: radius.card, padding: layout.cardPadding, gap: 2, minHeight: layout.minTouch },
  empty: { paddingHorizontal: 20, paddingBottom: 16 },
});

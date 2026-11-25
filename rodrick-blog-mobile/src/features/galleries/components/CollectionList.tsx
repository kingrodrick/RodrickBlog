import React from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { EmptyState, ErrorState, Skeleton, Text } from '../../../shared/ui';
import { cloudinaryUrl } from '../../../shared/utils/cloudinary';
import { layout, radius, useTheme } from '../../../theme';
import { Collection } from '../types';

type Props = {
  collections: Collection[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpen: (collection: Collection) => void;
};

/** Bìa 16:9; tải về cỡ gấp đôi khung cho màn mật độ cao. */
const COVER = { w: 800, h: 450 };

function CollectionCard({ item, onPress }: { item: Collection; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.photoCount} ảnh`}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface }]}
    >
      {item.coverUrl ? (
        <Image
          source={{ uri: cloudinaryUrl(item.coverUrl, COVER) }}
          style={[styles.cover, { backgroundColor: colors.surfaceMuted }]}
        />
      ) : (
        <View style={[styles.cover, { backgroundColor: colors.surfaceMuted }]} />
      )}
      <View style={styles.body}>
        {item.tripTitle ? (
          <Text variant="overline" tone="muted" numberOfLines={1}>
            {item.tripTitle}
          </Text>
        ) : null}
        <Text variant="heading" numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text variant="caption" tone="secondary" numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <Text variant="caption" tone="muted">
          {item.photoCount ? `${item.photoCount} ảnh` : 'Chưa có ảnh'}
        </Text>
      </View>
    </Pressable>
  );
}

/** Danh sách bộ sưu tập: thẻ bìa ngang, tên, chuyến đi đã gán, số ảnh. */
export function CollectionList({ collections, loading, error, onRetry, onOpen }: Props) {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={styles.list}>
        <Skeleton height={300} borderRadius={radius.card} />
        <Skeleton height={300} borderRadius={radius.card} />
      </View>
    );
  }
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
  return (
    <FlatList
      data={collections ?? []}
      keyExtractor={c => String(c.id)}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={onRetry} tintColor={colors.textSecondary} />
      }
      ListEmptyComponent={<EmptyState message="Chưa có bộ sưu tập nào." />}
      renderItem={({ item }) => <CollectionCard item={item} onPress={() => onOpen(item)} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: layout.cardGap, paddingBottom: 24 },
  card: { borderRadius: radius.card, overflow: 'hidden' },
  cover: { width: '100%', aspectRatio: 16 / 9 },
  body: { padding: layout.cardPadding, gap: 4 },
});

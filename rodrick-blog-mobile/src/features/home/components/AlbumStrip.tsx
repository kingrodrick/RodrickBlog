import React from 'react';
import {
  FlatList,
  Image as RNImage,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { EmptyState, Text } from '../../../shared/ui';
import { layout, radius, useTheme } from '../../../theme';
import { Album } from '../types';

const COVER_W = 150;
const COVER_H = 190;

type Props = {
  albums: Album[];
  onAlbumPress?: (album: Album) => void;
};

/** Dải bìa bộ sưu tập cuộn ngang; nút "Xem tất cả" nằm ở dòng tiêu đề mục của Trang chủ. */
export function AlbumStrip({ albums, onAlbumPress }: Props) {
  const { colors } = useTheme();

  if (albums.length === 0) {
    return <EmptyState message="Chưa có bộ sưu tập ảnh nào." />;
  }

  return (
    <FlatList
      horizontal
      data={albums}
      keyExtractor={item => item.id}
      showsHorizontalScrollIndicator={false}
      style={styles.list}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => {
        const reference = item.kind === 'reference';
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() => onAlbumPress?.(item)}
            style={styles.item}
          >
            <View
              style={[
                styles.cover,
                styles.center,
                {
                  backgroundColor: reference
                    ? colors.referenceBg
                    : colors.surfaceMuted,
                },
              ]}
            >
              {item.coverUrl ? (
                <RNImage
                  source={{ uri: item.coverUrl }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : (
                <Text
                  variant="caption"
                  style={{
                    color: reference
                      ? colors.referenceLabel
                      : colors.textSecondary,
                  }}
                >
                  {reference ? 'Ảnh tham khảo' : 'Ảnh bìa'}
                </Text>
              )}
            </View>
            <Text variant="label" numberOfLines={1}>
              {item.title}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  // Trải ra tới mép màn, rồi đệm lại 20 cho khớp lề.
  list: { marginHorizontal: -layout.screenMargin, flexGrow: 0 },
  content: { paddingHorizontal: layout.screenMargin, gap: layout.cardGap },
  item: { width: COVER_W, gap: 8 },
  cover: {
    width: COVER_W,
    height: COVER_H,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  center: { alignItems: 'center', justifyContent: 'center' },
});

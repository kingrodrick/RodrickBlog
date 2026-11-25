import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Pencil } from 'lucide-react-native';
import { PhotosStackParamList } from '../../../navigation/type';
import { useAsync } from '../../../shared/hooks/useAsync';
import { IconButton, Screen } from '../../../shared/ui';
import { iconSize, iconStroke } from '../../../theme';
import { CollectionInfo, fetchCollectionInfo } from '../api/collections';
import { EditCollectionSheet } from '../components/EditCollectionSheet';
import { markCollectionsStale } from '../hooks/collectionsStale';
import { usePhotoBrowser } from '../hooks/usePhotoBrowser';
import { PhotoFilter } from '../types';

type Nav = NativeStackNavigationProp<PhotosStackParamList, 'CollectionPhotos'>;
type Route = RouteProp<PhotosStackParamList, 'CollectionPhotos'>;

const icon = (Icon: typeof Pencil) => (c: string) =>
  <Icon color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />;
const renderBack = icon(ChevronLeft);
const renderEdit = icon(Pencil);

/** Lưới ảnh của một bộ sưu tập: cùng lưới, lọc, chọn và xoá như tab Ảnh; sửa tên, mô tả, ảnh bìa. */
export function CollectionPhotosScreen() {
  const navigation = useNavigation<Nav>();
  const { collectionId, title } = useRoute<Route>().params;
  // Bộ lọc riêng của màn này, mở lại luôn là cả hai loại.
  const [filter, setFilter] = useState<PhotoFilter>('all');
  const [editOpen, setEditOpen] = useState(false);
  // Thông tin vừa lưu; có thì dùng thay bản tải về (không cần tải lại).
  const [saved, setSaved] = useState<CollectionInfo | null>(null);
  const loadInfo = useCallback(() => fetchCollectionInfo(collectionId), [collectionId]);
  const remote = useAsync(loadInfo);
  const info = saved ?? remote.data;

  const browser = usePhotoBrowser({
    collectionId,
    filter,
    onFilterChange: setFilter,
    emptyMessage: 'Bộ sưu tập này chưa có ảnh.',
    // Số ảnh trên thẻ bộ sưu tập ở tab Ảnh đã đổi: tab Ảnh tải lại khi quay về.
    onChanged: markCollectionsStale,
  });

  return (
    <View style={styles.root}>
      <Screen
        title={browser.selectionTitle ?? info?.title ?? title}
        scroll={false}
        banner={browser.banner}
        headerLeft={
          browser.clearButton ?? (
            <IconButton
              accessibilityLabel="Quay lại"
              variant="ghost"
              onPress={() => navigation.goBack()}
              icon={renderBack}
            />
          )
        }
        headerRight={
          browser.selecting ? (
            browser.headerRight
          ) : (
            <View style={styles.actions}>
              <IconButton
                accessibilityLabel="Sửa thông tin bộ sưu tập"
                variant="ghost"
                // Chưa tải được thông tin (mất mạng lần đầu) thì chưa sửa được.
                disabled={!info}
                onPress={() => setEditOpen(true)}
                icon={renderEdit}
              />
              {browser.headerRight}
            </View>
          )
        }
      >
        <View style={styles.body}>{browser.grid}</View>
        {browser.overlays}
        <EditCollectionSheet
          visible={editOpen}
          collectionId={collectionId}
          info={info}
          onClose={() => setEditOpen(false)}
          onSaved={next => {
            setSaved(next);
            setEditOpen(false);
            // Tên, mô tả, bìa trên thẻ ở tab Ảnh đã đổi.
            markCollectionsStale();
            browser.notify({ kind: 'success', message: 'Đã lưu bộ sưu tập' });
          }}
        />
      </Screen>
      {browser.toast}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
  actions: { flexDirection: 'row', gap: 4 },
});

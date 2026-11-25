import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PhotosStackParamList } from '../../../navigation/type';
import { offlineBanner, Screen, Segmented } from '../../../shared/ui';
import { useAsync } from '../../../shared/hooks/useAsync';
import { fetchCollections } from '../api/collections';
import { CollectionList } from '../components/CollectionList';
import { takeCollectionsStale } from '../hooks/collectionsStale';
import { useCollectionOrder } from '../hooks/useCollectionOrder';
import { usePhotoBrowser } from '../hooks/usePhotoBrowser';
import { GalleryMode, PhotoFilter } from '../types';

type Nav = NativeStackNavigationProp<PhotosStackParamList, 'PhotosMain'>;
type Route = RouteProp<PhotosStackParamList, 'PhotosMain'>;

const MODE_KEY = 'galleries.mode';
const FILTER_KEY = 'galleries.filter';

const MODES: { value: GalleryMode; label: string }[] = [
  { value: 'photos', label: 'Ảnh' },
  { value: 'collections', label: 'Bộ sưu tập' },
];

// Hằng ngoài component để useSaved không đọc lại kho mỗi lần dựng màn.
const MODE_VALUES: GalleryMode[] = ['photos', 'collections'];
const FILTER_VALUES: PhotoFilter[] = ['all', 'real', 'reference'];

/** Một lựa chọn lưu ở máy: mở lại app vẫn như lần trước. */
function useSaved<T extends string>(key: string, initial: T, allowed: readonly T[]) {
  const [value, setValue] = useState<T>(initial);
  // Đã đổi trước khi đọc xong kho (ví dụ mở từ Trang chủ kèm chế độ): không để giá trị cũ đè lên.
  const changed = useRef(false);
  useEffect(() => {
    AsyncStorage.getItem(key)
      .then(v => {
        const found = allowed.find(a => a === v);
        if (found && !changed.current) {
          setValue(found);
        }
      })
      .catch(() => undefined);
  }, [key, allowed]);
  const change = useCallback(
    (v: T) => {
      changed.current = true;
      setValue(v);
      AsyncStorage.setItem(key, v).catch(() => undefined);
    },
    [key],
  );
  return [value, change] as const;
}

/** Tab Ảnh: chọn xem lưới tất cả ảnh (mới nhất trước) hoặc danh sách bộ sưu tập. */
export function PhotosScreen() {
  const navigation = useNavigation<Nav>();
  const requestedMode = useRoute<Route>().params?.mode;
  const [mode, setModeRaw] = useSaved(MODE_KEY, 'photos', MODE_VALUES);
  const [filter, setFilter] = useSaved(FILTER_KEY, 'all', FILTER_VALUES);
  const collections = useAsync(fetchCollections);
  const browser = usePhotoBrowser({
    filter,
    onFilterChange: setFilter,
    active: mode === 'photos',
    emptyMessage: 'Chưa có ảnh nào. Ảnh thêm vào các mốc sẽ hiện ở đây.',
    // Xoá hay chuyển ảnh làm đổi số ảnh của các bộ sưu tập.
    onChanged: collections.refresh,
  });

  // Quay về từ màn bộ sưu tập vừa xoá/chuyển ảnh: cập nhật ngầm số ảnh trên các thẻ.
  const { refresh: refreshCollections } = collections;
  useFocusEffect(
    useCallback(() => {
      if (takeCollectionsStale()) {
        refreshCollections();
      }
    }, [refreshCollections]),
  );

  const order = useCollectionOrder({
    collections: collections.data,
    canEdit: collections.cachedAt === null,
    onSaved: collections.refresh,
    notify: browser.notify,
  });

  const { clearSelection } = browser;
  const setMode = useCallback(
    (m: GalleryMode) => {
      clearSelection();
      setModeRaw(m);
    },
    [clearSelection, setModeRaw],
  );

  // Mở từ nơi khác kèm chế độ: chuyển sang chế độ đó rồi xoá tham số, để lần sau
  // bấm cùng nút (tham số giống hệt) vẫn chuyển được.
  useEffect(() => {
    if (requestedMode) {
      setMode(requestedMode);
      navigation.setParams({ mode: undefined });
    }
  }, [requestedMode, setMode, navigation]);

  return (
    <View style={styles.root}>
      <Screen
        title={browser.selectionTitle ?? (order.ordering ? 'Sắp xếp' : 'Ảnh')}
        scroll={false}
        banner={mode === 'photos' ? browser.banner : offlineBanner(collections.cachedAt)}
        headerLeft={mode === 'photos' ? browser.clearButton : order.headerLeft}
        headerRight={mode === 'photos' ? browser.headerRight : order.headerRight}
      >
        {/* Đang sắp xếp thì ẩn thanh chọn chế độ để không rời màn giữa chừng. */}
        {order.ordering ? null : <Segmented options={MODES} value={mode} onChange={setMode} />}
        <View style={styles.body}>
          {mode === 'photos' ? (
            browser.grid
          ) : order.list ? (
            order.list
          ) : (
            <CollectionList
              collections={order.shown}
              loading={collections.loading}
              error={collections.error}
              onRetry={collections.reload}
              onOpen={c =>
                navigation.navigate('CollectionPhotos', { collectionId: c.id, title: c.title })
              }
            />
          )}
        </View>
        {browser.overlays}
      </Screen>
      {browser.toast}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
});

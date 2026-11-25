import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import { PhotosStackParamList } from '../../../navigation/type';
import { IconButton, Screen } from '../../../shared/ui';
import { iconSize, iconStroke } from '../../../theme';
import { usePhotoBrowser } from '../hooks/usePhotoBrowser';
import { PhotoFilter } from '../types';

type Nav = NativeStackNavigationProp<PhotosStackParamList, 'CollectionPhotos'>;
type Route = RouteProp<PhotosStackParamList, 'CollectionPhotos'>;

const renderBack = (c: string) => (
  <ChevronLeft color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />
);

/** Lưới ảnh của một bộ sưu tập: cùng lưới, lọc, chọn và xoá như tab Ảnh. */
export function CollectionPhotosScreen() {
  const navigation = useNavigation<Nav>();
  const { collectionId, title } = useRoute<Route>().params;
  // Bộ lọc riêng của màn này, mở lại luôn là cả hai loại.
  const [filter, setFilter] = useState<PhotoFilter>('all');
  const browser = usePhotoBrowser({
    collectionId,
    filter,
    onFilterChange: setFilter,
    emptyMessage: 'Bộ sưu tập này chưa có ảnh.',
  });

  return (
    <View style={styles.root}>
      <Screen
        title={browser.selectionTitle ?? title}
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
        headerRight={browser.headerRight}
      >
        <View style={styles.body}>{browser.grid}</View>
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

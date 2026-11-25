import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  Card,
  EmptyState,
  ErrorState,
  offlineBanner,
  Screen,
  Skeleton,
  Text,
} from '../../../shared/ui';
import { fetchTrips } from '../../../shared/api/trips';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useNow } from '../../../shared/hooks/useNow';
import { formatWeekdayDateTime } from '../../../shared/utils/format';
import { layout, radius } from '../../../theme';
import { HomeStackParamList, MainTabParamList } from '../../../navigation/type';
import { fetchAlbums } from '../api/albums';
import { pickNearestTrip } from '../pickNearestTrip';
import { Album } from '../types';
import { NearestTripCard, NearestTripStatus } from '../components/NearestTrip';
import { AlbumStrip } from '../components/AlbumStrip';
import { ChevronButton } from '../components/ChevronButton';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

function Greeting() {
  const now = useNow(60000);
  return (
    <View style={styles.greeting}>
      <Text variant="display" accessibilityRole="header">
        Welcome, Sir
      </Text>
      <Text variant="caption" tone="secondary">
        {formatWeekdayDateTime(now)}
      </Text>
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const now = useNow(60000);
  const trips = useAsync(fetchTrips);
  const albums = useAsync(fetchAlbums);
  const trip = trips.data ? pickNearestTrip(trips.data, now) : null;

  const tabs = () => navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();

  /** "Danh sách chuyến đi": sang tab Chuyến đi, về đúng màn danh sách. */
  const openTripsList = () => tabs()?.navigate('Trips', { screen: 'TripsList' });

  /** "Xem tất cả": tab Ảnh ở chế độ Bộ sưu tập. */
  const openCollections = () =>
    tabs()?.navigate('Photos', { screen: 'PhotosMain', params: { mode: 'collections' } });

  /** Một album: mở thẳng lưới ảnh của bộ sưu tập đó; Back về danh sách bộ sưu tập. */
  const openAlbum = (album: Album) =>
    tabs()?.navigate('Photos', {
      screen: 'CollectionPhotos',
      params: { collectionId: Number(album.id), title: album.title },
      // Dựng màn chính của tab Ảnh bên dưới, để Back không thoát khỏi tab.
      initial: false,
    });

  let tripSection: React.ReactNode;
  if (trips.loading) {
    tripSection = (
      <>
        <Skeleton width={120} height={16} />
        <Skeleton height={290} borderRadius={radius.card} />
      </>
    );
  } else if (trips.error) {
    tripSection = (
      <ErrorState message="Không tải được chuyến đi." onRetry={trips.reload} />
    );
  } else if (trip) {
    tripSection = (
      <>
        <NearestTripStatus trip={trip} />
        <NearestTripCard
          trip={trip}
          onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
          onEventPress={event =>
            navigation.navigate('EventDetail', { tripId: trip.id, eventId: event.id })
          }
        />
      </>
    );
  } else {
    tripSection = <EmptyState message="Chưa có chuyến đi nào sắp tới." />;
  }

  let albumSection: React.ReactNode;
  if (albums.loading) {
    albumSection = (
      <View style={styles.albumSkeleton}>
        <Skeleton width={150} height={190} borderRadius={radius.card} />
        <Skeleton width={150} height={190} borderRadius={radius.card} />
      </View>
    );
  } else if (albums.error) {
    albumSection = (
      <ErrorState
        message="Không tải được bộ sưu tập ảnh."
        onRetry={albums.reload}
      />
    );
  } else {
    albumSection = (
      <AlbumStrip
        albums={albums.data ?? []}
        onAlbumPress={openAlbum}
      />
    );
  }

  return (
    <Screen banner={offlineBanner(trips.cachedAt ?? albums.cachedAt)}>
      <Greeting />

      {tripSection}

      <Card
        onPress={openTripsList}
        accessibilityLabel="Danh sách chuyến đi"
        style={styles.row}
      >
        <View style={styles.rowText}>
          <Text variant="heading">Danh sách chuyến đi</Text>
          <Text variant="caption" tone="secondary">
            {trips.data ? `Tổng ${trips.data.length} chuyến` : 'Đang tải...'}
          </Text>
        </View>
        <ChevronButton
          accessibilityLabel="Mở danh sách chuyến đi"
          onPress={openTripsList}
        />
      </Card>

      <View style={styles.sectionHead}>
        <Text variant="overline" tone="secondary" numberOfLines={1} style={styles.sectionTitle}>
          Bộ sưu tập ảnh
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem tất cả bộ sưu tập"
          onPress={openCollections}
          style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
        >
          <Text variant="label" tone="accent" numberOfLines={1} style={styles.seeAllText}>
            Xem tất cả
          </Text>
        </Pressable>
      </View>
      {albumSection}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { paddingTop: 16, paddingBottom: 8, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, gap: 2 },
  // Tiêu đề mục bên trái, nút "Xem tất cả" bên phải trên cùng một dòng.
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  sectionTitle: { flex: 1 },
  // Nút chiếm nửa phải, chữ giãn kín bề ngang rồi căn phải: không ôm đúng bề rộng đo được,
  // vì font hệ thống tuỳ chỉnh (Samsung) đo thiếu làm chữ "cả" rơi xuống dòng 2 rồi bị cắt.
  // Vùng chạm cao tối thiểu 44.
  seeAll: { flex: 1, minHeight: layout.minTouch, justifyContent: 'center' },
  seeAllText: { textAlign: 'right' },
  pressed: { opacity: 0.6 },
  albumSkeleton: { flexDirection: 'row', gap: 12 },
});

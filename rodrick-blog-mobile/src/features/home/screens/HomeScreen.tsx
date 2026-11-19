import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  Card,
  EmptyState,
  ErrorState,
  Screen,
  Skeleton,
  Text,
} from '../../../shared/ui';
import { fetchTrips } from '../../../shared/api/trips';
import { useAsync } from '../../../shared/hooks/useAsync';
import { useNow } from '../../../shared/hooks/useNow';
import { formatWeekdayDateTime } from '../../../shared/utils/format';
import { radius } from '../../../theme';
import { HomeStackParamList, MainTabParamList } from '../../../navigation/type';
import { fetchAlbums } from '../api/albums';
import { pickNearestTrip } from '../pickNearestTrip';
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

  const openTripsList = () => navigation.navigate('TripsList');

  const openPhotosTab = () => {
    const tabs =
      navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();
    // Tab Ảnh đang tắt trong MainTabs; chỉ điều hướng khi tab đã được đăng ký.
    if (tabs?.getState().routeNames.includes('Photos')) {
      tabs.navigate('Photos');
    }
  };

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
          // TODO: điều hướng tới TripDetailScreen khi màn này được dựng.
          onPress={() => {}}
          // TODO: điều hướng tới EventDetailScreen khi màn này được dựng.
          onEventPress={() => {}}
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
      <AlbumStrip albums={albums.data ?? []} onSeeAll={openPhotosTab} />
    );
  }

  return (
    <Screen>
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

      <Text variant="overline" tone="secondary" style={styles.sectionTitle}>
        Bộ sưu tập ảnh
      </Text>
      {albumSection}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { paddingTop: 16, paddingBottom: 8, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, gap: 2 },
  sectionTitle: { marginTop: 8 },
  albumSkeleton: { flexDirection: 'row', gap: 12 },
});

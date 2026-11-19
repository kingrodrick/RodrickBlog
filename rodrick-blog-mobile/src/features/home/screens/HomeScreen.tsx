import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Card, EmptyState, Screen, Text } from '../../../shared/ui';
import { useNow } from '../../../shared/hooks/useNow';
import { formatWeekdayDateTime } from '../../../shared/utils/format';
import { HomeStackParamList, MainTabParamList } from '../../../navigation/type';
import { MOCK_TRIPS } from '../mockTrips';
import { MOCK_ALBUMS } from '../mockAlbums';
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
  const trip = pickNearestTrip(MOCK_TRIPS, now);

  const openTripsList = () => navigation.navigate('TripsList');

  const openPhotosTab = () => {
    const tabs =
      navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();
    // Tab Ảnh đang tắt trong MainTabs; chỉ điều hướng khi tab đã được đăng ký.
    if (tabs?.getState().routeNames.includes('Photos')) {
      tabs.navigate('Photos');
    }
  };

  return (
    <Screen>
      <Greeting />

      {trip ? (
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
      ) : (
        <EmptyState message="Chưa có chuyến đi nào sắp tới." />
      )}

      <Card
        onPress={openTripsList}
        accessibilityLabel="Danh sách chuyến đi"
        style={styles.row}
      >
        <View style={styles.rowText}>
          <Text variant="heading">Danh sách chuyến đi</Text>
          <Text variant="caption" tone="secondary">
            Tổng {MOCK_TRIPS.length} chuyến
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
      <AlbumStrip albums={MOCK_ALBUMS} onSeeAll={openPhotosTab} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { paddingTop: 16, paddingBottom: 8, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, gap: 2 },
  sectionTitle: { marginTop: 8 },
});

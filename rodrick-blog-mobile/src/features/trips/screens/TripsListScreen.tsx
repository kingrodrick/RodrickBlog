import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TripsStackParamList } from '../../../navigation/type';
import { ChevronLeft } from 'lucide-react-native';
import {
  EmptyState,
  ErrorState,
  IconButton,
  offlineBanner,
  Screen,
  Skeleton,
  Text,
} from '../../../shared/ui';
import { fetchTrips, Trip } from '../../../shared/api/trips';
import { useAsync } from '../../../shared/hooks/useAsync';
import { iconSize, iconStroke, radius } from '../../../theme';
import { TripCard } from '../components/TripCard';

const renderBack = (c: string) => (
  <ChevronLeft
    color={c}
    size={iconSize.control}
    strokeWidth={iconStroke.normal}
    strokeLinecap="round"
  />
);

function TripSections({
  trips,
  onOpen,
}: {
  trips: Trip[];
  onOpen: (trip: Trip) => void;
}) {
  const upcoming = trips
    .filter(t => t.status !== 'completed')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = trips
    .filter(t => t.status === 'completed')
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <>
      <Text variant="overline" tone="secondary">
        Sắp tới
      </Text>
      {upcoming.length > 0 ? (
        upcoming.map(trip => (
          <TripCard key={trip.id} trip={trip} onPress={() => onOpen(trip)} />
        ))
      ) : (
        <EmptyState message="Chưa có chuyến đi nào sắp tới." />
      )}

      <View style={styles.gap} />
      <Text variant="overline" tone="secondary">
        Đã đi
      </Text>
      {past.length > 0 ? (
        past.map(trip => (
          <TripCard key={trip.id} trip={trip} onPress={() => onOpen(trip)} />
        ))
      ) : (
        <Text tone="muted">
          Chuyến đã hoàn thành sẽ xếp ở đây, mới nhất lên trước.
        </Text>
      )}
    </>
  );
}

type Nav = NativeStackNavigationProp<TripsStackParamList, 'TripsList'>;

export function TripsListScreen() {
  const navigation = useNavigation<Nav>();
  const { data, loading, error, reload, cachedAt } = useAsync(fetchTrips);

  return (
    <Screen
      title="Danh sách chuyến đi"
      banner={offlineBanner(cachedAt)}
      // Là gốc của tab Chuyến đi: chỉ có nút Quay lại khi có màn để quay về.
      headerLeft={
        navigation.canGoBack() ? (
          <IconButton
            variant="ghost"
            accessibilityLabel="Quay lại"
            onPress={() => navigation.goBack()}
            icon={renderBack}
          />
        ) : undefined
      }
    >
      {loading ? (
        <Skeleton height={340} borderRadius={radius.card} />
      ) : error ? (
        <ErrorState message="Không tải được chuyến đi." onRetry={reload} />
      ) : (
        <TripSections
          trips={data ?? []}
          onOpen={trip => navigation.navigate('TripDetail', { tripId: trip.id })}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ gap: { height: 4 } });

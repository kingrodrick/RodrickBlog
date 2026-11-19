import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { EmptyState, IconButton, Screen, Text } from '../../../shared/ui';
import { iconSize, iconStroke } from '../../../theme';
import { MOCK_TRIPS } from '../../home';
import { TripCard } from '../components/TripCard';

const upcoming = MOCK_TRIPS.filter(t => t.status !== 'completed').sort((a, b) =>
  a.startDate.localeCompare(b.startDate),
);
const past = MOCK_TRIPS.filter(t => t.status === 'completed').sort((a, b) =>
  b.startDate.localeCompare(a.startDate),
);

const renderBack = (c: string) => (
  <ChevronLeft
    color={c}
    size={iconSize.control}
    strokeWidth={iconStroke.normal}
    strokeLinecap="round"
  />
);

export function TripsListScreen() {
  const navigation = useNavigation();
  return (
    <Screen
      title="Danh sách chuyến đi"
      headerLeft={
        <IconButton
          variant="ghost"
          accessibilityLabel="Quay lại"
          onPress={() => navigation.goBack()}
          icon={renderBack}
        />
      }
    >
      <Text variant="overline" tone="secondary">
        Sắp tới
      </Text>
      {upcoming.length > 0 ? (
        upcoming.map(trip => <TripCard key={trip.id} trip={trip} />)
      ) : (
        <EmptyState message="Chưa có chuyến đi nào sắp tới." />
      )}

      <View style={styles.gap} />
      <Text variant="overline" tone="secondary">
        Đã đi
      </Text>
      {past.length > 0 ? (
        past.map(trip => <TripCard key={trip.id} trip={trip} />)
      ) : (
        <Text tone="muted">
          Chuyến đã hoàn thành sẽ xếp ở đây, mới nhất lên trước.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ gap: { height: 4 } });

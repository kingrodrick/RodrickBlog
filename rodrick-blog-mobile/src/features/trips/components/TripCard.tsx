import React from 'react';
import { Image as RNImage, StyleSheet, View } from 'react-native';
import { Badge, Card, Text } from '../../../shared/ui';
import {
  daysUntil,
  formatDateRange,
  formatTimeDate,
  tripLength,
} from '../../../shared/utils/format';
import { radius, useTheme } from '../../../theme';
import { Trip, TripStatus } from '../../home';

const STATUS_LABEL: Record<TripStatus, string> = {
  planning: 'Đang lên kế hoạch',
  ongoing: 'Đang đi',
  completed: 'Đã hoàn thành',
};

function countdown(trip: Trip): string | null {
  if (trip.status === 'ongoing') {
    return 'Đang diễn ra';
  }
  if (trip.status === 'completed') {
    return null;
  }
  const days = daysUntil(trip.startDate);
  return days > 0 ? `Còn ${days} ngày` : 'Khởi hành hôm nay';
}

type Props = { trip: Trip; onPress?: () => void };

export function TripCard({ trip, onPress }: Props) {
  const { colors } = useTheme();
  const meta = [
    formatDateRange(trip.startDate, trip.endDate),
    trip.places.join(' • '),
    tripLength(trip.startDate, trip.endDate),
  ].join(' · ');
  const left = countdown(trip);

  return (
    <Card onPress={onPress} accessibilityLabel={trip.title} style={styles.card}>
      <View style={[styles.cover, { backgroundColor: colors.surfaceMuted }]}>
        {trip.coverUrl ? (
          <RNImage
            source={{ uri: trip.coverUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <Text variant="overline" tone="secondary" style={styles.coverHint}>
            Ảnh bìa chuyến đi
          </Text>
        )}
      </View>
      <View style={styles.body}>
        <Badge status={trip.status} label={STATUS_LABEL[trip.status]} />
        <Text variant="heading">{trip.title}</Text>
        <Text variant="caption" tone="secondary">
          {meta}
        </Text>
        {left ? (
          <View
            style={[styles.countdown, { backgroundColor: colors.background }]}
          >
            <Text variant="label" tone="accent" style={styles.countdownText}>
              {left}
            </Text>
            {trip.events[0] ? (
              <Text variant="caption" tone="secondary">
                Mốc đầu tiên {formatTimeDate(trip.events[0].at)} ·{' '}
                {trip.events[0].title}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden' },
  cover: { height: 210, justifyContent: 'flex-end', padding: 12 },
  coverHint: { textTransform: 'none', letterSpacing: 0, fontWeight: '400' },
  body: { padding: 16, gap: 8 },
  countdown: {
    marginTop: 4,
    padding: 12,
    borderRadius: radius.control,
    gap: 2,
  },
  countdownText: { fontSize: 16, lineHeight: 22 },
});

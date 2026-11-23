import React from 'react';
import { Image as RNImage, Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from '../../../shared/ui';
import { useNow } from '../../../shared/hooks/useNow';
import {
  formatCountdownDays,
  formatCountdownHms,
  formatDateRange,
  formatTimeDate,
  parseDateTime,
} from '../../../shared/utils/format';
import { useTheme } from '../../../theme';
import { nextEvent, tripDayProgress, tripStartTime } from '../pickNearestTrip';
import { Trip, TripEvent } from '../types';
import { ChevronButton } from './ChevronButton';

/** Hàng "Sắp tới / Đang diễn ra" + đếm ngược hoặc "Ngày x/y". Tự cập nhật mỗi giây. */
export function NearestTripStatus({ trip }: { trip: Trip }) {
  const now = useNow(1000);
  const ongoing = trip.status === 'ongoing';
  let right: string;
  if (ongoing) {
    const { day, total } = tripDayProgress(trip, now);
    right = `Ngày ${day}/${total}`;
  } else {
    right = formatCountdownDays(tripStartTime(trip).getTime() - now.getTime());
  }
  return (
    <View style={styles.statusRow}>
      <Text variant="overline" tone={ongoing ? 'accent' : 'secondary'} numberOfLines={1} style={styles.rowLabel}>
        {ongoing ? 'Đang diễn ra' : 'Sắp tới'}
      </Text>
      <Text variant="caption" tone="accent" style={styles.tabular}>
        {right}
      </Text>
    </View>
  );
}

function EventCountdown({ event }: { event: TripEvent }) {
  const now = useNow(1000);
  return (
    <Text tone="accent" style={[styles.eventCountdown, styles.tabular]}>
      {formatCountdownHms(parseDateTime(event.at).getTime() - now.getTime())}
    </Text>
  );
}

type Props = {
  trip: Trip;
  onPress?: () => void;
  onEventPress?: (event: TripEvent) => void;
};

export function NearestTripCard({ trip, onPress, onEventPress }: Props) {
  const { colors } = useTheme();
  // Cập nhật mỗi phút là đủ để chuyển sang sự kiện kế tiếp; đếm ngược tự chạy từng giây.
  const now = useNow(60000);
  const upcomingEvent = trip.status === 'ongoing' ? nextEvent(trip, now) : null;

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
          <Text variant="caption" tone="secondary">
            Ảnh bìa chuyến đi
          </Text>
        )}
      </View>

      <View style={styles.body}>
        <Text variant="heading">{trip.title}</Text>
        <Text variant="caption" tone="secondary">
          {formatDateRange(trip.startDate, trip.endDate)}
        </Text>
      </View>

      {upcomingEvent ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sự kiện sắp tới: ${upcomingEvent.title}`}
          onPress={() => onEventPress?.(upcomingEvent)}
          style={[styles.event, { backgroundColor: colors.surfaceMuted }]}
        >
          <View style={styles.eventText}>
            <Text variant="caption" tone="secondary">
              Sự kiện sắp tới
            </Text>
            <Text variant="heading" style={styles.eventTitle}>
              {upcomingEvent.title}
            </Text>
            <Text variant="caption" tone="secondary">
              Dự kiến {formatTimeDate(upcomingEvent.at)}
            </Text>
            <EventCountdown event={upcomingEvent} />
          </View>
          <ChevronButton
            accessibilityLabel={`Xem sự kiện ${upcomingEvent.title}`}
            onPress={() => onEventPress?.(upcomingEvent)}
          />
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  card: { padding: 0, overflow: 'hidden' },
  cover: { height: 210, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, gap: 8 },
  event: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  eventText: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 16, lineHeight: 22 },
  eventCountdown: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    marginTop: 4,
  },
});

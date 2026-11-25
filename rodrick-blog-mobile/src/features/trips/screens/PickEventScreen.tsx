import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  offlineBanner,
  Screen,
  Skeleton,
  Text,
} from '../../../shared/ui';
import { fetchTrips } from '../../../shared/api/trips';
import { useAsync } from '../../../shared/hooks/useAsync';
import { pickNearestTrip } from '../../../shared/utils/nearestTrip';
import { iconSize, iconStroke, radius, useTheme } from '../../../theme';
import { HomeStackParamList } from '../../../navigation/type';
import { fetchTripDetail, tripDays } from '../api/tripDetail';
import { DayStrip } from '../components/DayStrip';
import { dayTitle, toIsoDay } from '../dayFormat';
import { eventTimes, hhmm } from '../eventCategory';
import { TRAVEL_MODE_LABEL } from '../maps';
import { ParsedRoute } from '../parseMapsLink';
import { DetailEvent, TripDetail } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'PickEvent'>;
type Route = RouteProp<HomeStackParamList, 'PickEvent'>;

const renderClose = (c: string) => (
  <X color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />
);

/** Chuyến gần nhất (đang đi hoặc sắp tới) kèm chi tiết event. */
async function loadNearestTrip(): Promise<TripDetail | null> {
  const trip = pickNearestTrip(await fetchTrips(), new Date());
  return trip ? fetchTripDetail(Number(trip.id)) : null;
}

/** Event mặc định: đang diễn ra hoặc sắp tới gần nhất trong ngày; không có thì event đầu. */
function defaultEvent(events: DetailEvent[], isToday: boolean): number | null {
  if (!events.length) {
    return null;
  }
  if (isToday) {
    const nowHM = toHM(new Date());
    const next = events.find(e => (hhmm(e.end_time) ?? hhmm(e.start_time) ?? '') >= nowHM);
    if (next) {
      return next.id;
    }
  }
  return events[0].id;
}
const toHM = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

function RouteSummary({ route }: { route: ParsedRoute }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.summary}>
      <Text variant="overline" style={{ color: colors.eventType.transit }}>
        {route.mode ? TRAVEL_MODE_LABEL[route.mode] : 'Lộ trình'}
      </Text>
      <Text variant="heading" style={styles.summaryTitle}>
        {route.origin ?? 'Vị trí hiện tại'} - {route.destination}
      </Text>
      {route.waypoints.length ? (
        <Text variant="caption" tone="secondary">
          Điểm dừng: {route.waypoints.join(', ')}
        </Text>
      ) : null}
    </Card>
  );
}

/** `readOnly`: mất mạng, vẫn xem được event nhưng không cho tiếp tục gán. */
function Picker({ trip, route, readOnly }: { trip: TripDetail; route: ParsedRoute; readOnly: boolean }) {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const days = useMemo(() => tripDays(trip), [trip]);
  const today = toIsoDay(new Date());
  const [day, setDayState] = useState(days.includes(today) ? today : days[0]);
  const events = trip.timeline_events.filter(e => e.trip_date === day);
  const [picked, setPicked] = useState<number | null>(() => defaultEvent(events, day === today));

  const setDay = (d: string) => {
    setDayState(d);
    setPicked(defaultEvent(trip.timeline_events.filter(e => e.trip_date === d), d === today));
  };

  return (
    <>
      <View style={styles.sec}>
        <Text variant="overline" tone="muted" numberOfLines={1} style={styles.rowLabel}>
          Chọn event
        </Text>
        <Text variant="overline" tone="muted">
          {dayTitle(day)}
        </Text>
      </View>
      <View style={styles.bleed}>
        <DayStrip days={days} selected={day} onSelect={setDay} />
      </View>
      <View style={styles.list}>
        {events.map(e => {
          const on = e.id === picked;
          const { start, end } = eventTimes(e);
          const fg = on ? colors.onPrimary : colors.text;
          return (
            <Pressable
              key={e.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={e.location_name}
              onPress={() => setPicked(e.id)}
              style={[styles.pick, { backgroundColor: on ? colors.primary : colors.surface }]}
            >
              <Text variant="label" style={[styles.tabular, { color: fg }]}>
                {end ? `${start} - ${end}` : start}
              </Text>
              <Text variant="heading" style={[styles.pickName, { color: fg }]}>
                {e.location_name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Button
        title="Tiếp tục"
        disabled={picked === null || readOnly}
        onPress={() =>
          picked !== null &&
          navigation.replace('RouteEdit', { tripId: String(trip.id), eventId: String(picked), route })
        }
      />
    </>
  );
}

/** Màn chọn event để gán lộ trình nhận từ nút Chia sẻ của Google Maps (bước 6 mục F.5). */
export function PickEventScreen() {
  const navigation = useNavigation<Nav>();
  const { route } = useRoute<Route>().params;
  const load = useCallback(loadNearestTrip, []);
  const { data, loading, error, reload, cachedAt } = useAsync(load);

  return (
    <Screen
      banner={offlineBanner(cachedAt)}
      headerLeft={
        <IconButton accessibilityLabel="Đóng" onPress={() => navigation.goBack()} icon={renderClose} />
      }
    >
      <View style={styles.head}>
        <Text variant="title" accessibilityRole="header">
          Gán lộ trình vào event
        </Text>
        <Text variant="body" tone="secondary">
          Liên kết vừa nhận từ Google Maps
        </Text>
      </View>
      <RouteSummary route={route} />

      {loading ? (
        <Skeleton height={280} borderRadius={radius.card} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data ? (
        <>
          {cachedAt ? (
            <Alert
              kind="warning"
              title="Không có mạng"
              description="Cần có mạng để gán lộ trình vào event. Thử lại khi có mạng."
            />
          ) : null}
          <Picker trip={data} route={route} readOnly={cachedAt !== null} />
        </>
      ) : (
        <EmptyState message="Chưa có chuyến đi nào đang diễn ra hoặc sắp tới." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 4 },
  summary: { gap: 2 },
  summaryTitle: { fontSize: 16, lineHeight: 22 },
  sec: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rowLabel: { flex: 1 },
  bleed: { marginHorizontal: -20 },
  list: { gap: 8 },
  pick: { borderRadius: radius.card, paddingHorizontal: 16, paddingVertical: 14, gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
  pickName: { fontSize: 15, lineHeight: 22 },
});

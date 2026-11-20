import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import { ErrorState, IconButton, Screen, Skeleton, Text } from '../../../shared/ui';
import { useAsync } from '../../../shared/hooks/useAsync';
import { tripLength } from '../../../shared/utils/format';
import { iconSize, iconStroke, layout, radius } from '../../../theme';
import { HomeStackParamList } from '../../../navigation/type';
import { fetchTripDetail, tripDays } from '../api/tripDetail';
import { compactRange, dayTitle, toIsoDay } from '../dayFormat';
import { DayStrip } from '../components/DayStrip';
import { TimelineRow } from '../components/TimelineRow';
import { TripDetail } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'TripDetail'>;
type Route = RouteProp<HomeStackParamList, 'TripDetail'>;

const icon = (Icon: typeof ChevronLeft) => (c: string) =>
  <Icon color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />;
const renderBack = icon(ChevronLeft);

// Ngưỡng ẩn/hiện header theo đặc tả: ẩn khi y > 60 và đã cuộn xuống quá 6; hiện khi cuộn ngược quá 8 hoặc về đầu.
const HIDE_AFTER_Y = 60;
const HIDE_DELTA = 6;
const SHOW_DELTA = 8;
const COLLAPSE_MS = 400;

/** Header thu nhỏ rồi trượt mất khi cuộn xuống, hiện lại khi cuộn ngược. */
function useCollapsingHeader() {
  const progress = useRef(new Animated.Value(0)).current;
  const [height, setHeight] = useState(0);
  const hidden = useRef(false);
  const lastY = useRef(0);
  const run = useRef(0); // quãng cuộn tích luỹ theo một chiều
  const lockUntil = useRef(0);

  const setHidden = useCallback(
    (h: boolean) => {
      if (hidden.current === h) {
        return;
      }
      hidden.current = h;
      run.current = 0;
      // Header đổi cao làm vùng cuộn đổi theo; khoá ngắn để không bật lại ngay.
      lockUntil.current = Date.now() + COLLAPSE_MS;
      Animated.timing(progress, {
        toValue: h ? 1 : 0,
        duration: COLLAPSE_MS,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        // Chiều cao không chạy được native driver; cả ba thuộc tính dùng chung một giá trị nên cùng JS.
        useNativeDriver: false,
      }).start();
    },
    [progress],
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const d = y - lastY.current;
      lastY.current = y;
      run.current = Math.sign(d) === Math.sign(run.current) ? run.current + d : d;
      if (y <= 0) {
        setHidden(false);
        return;
      }
      if (Date.now() < lockUntil.current) {
        return;
      }
      if (run.current > HIDE_DELTA && y > HIDE_AFTER_Y) {
        setHidden(true);
      } else if (run.current < -SHOW_DELTA) {
        setHidden(false);
      }
    },
    [setHidden],
  );

  const style = {
    height: height
      ? progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] })
      : undefined,
    opacity: progress.interpolate({ inputRange: [0, 0.6], outputRange: [1, 0], extrapolate: 'clamp' }),
    transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }) },
    ],
  };

  return {
    style,
    onScroll,
    show: () => setHidden(false),
    onContentLayout: (h: number) => setHeight(prev => prev || h),
  };
}

function Timeline({ trip, onOpen }: { trip: TripDetail; onOpen: (eventId: number) => void }) {
  const days = useMemo(() => tripDays(trip), [trip]);
  const today = toIsoDay(new Date());
  const [day, setDay] = useState(days.includes(today) ? today : days[0]);
  const header = useCollapsingHeader();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const events = trip.timeline_events.filter(e => e.trip_date === day);
  const navigation = useNavigation<Nav>();

  // Đổi ngày: về đầu danh sách và hiện lại header.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    header.show();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  return (
    <View style={styles.fill}>
      <Animated.View style={[styles.headerClip, header.style]}>
        <View
          style={styles.header}
          onLayout={e => header.onContentLayout(e.nativeEvent.layout.height)}
        >
          <IconButton variant="ghost" accessibilityLabel="Quay lại" onPress={() => navigation.goBack()} icon={renderBack} />
          <View style={styles.headerText}>
            <Text variant="title" numberOfLines={1} accessibilityRole="header" style={styles.title}>
              {trip.title}
            </Text>
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {compactRange(trip.start_date, trip.end_date)} · {tripLength(trip.start_date, trip.end_date)}
            </Text>
          </View>
        </View>
      </Animated.View>

      <DayStrip days={days} selected={day} onSelect={setDay} />

      <ScrollView
        ref={scrollRef}
        style={styles.fill}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        onScroll={header.onScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.dayHead}>
          <Text variant="heading">{dayTitle(day)}</Text>
          <Text variant="caption" tone="secondary">
            {events.length} mốc
          </Text>
        </View>
        {events.map((e, i) => (
          <TimelineRow
            key={e.id}
            event={e}
            first={i === 0}
            last={i === events.length - 1}
            onPress={() => onOpen(e.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export function TripDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { tripId } = useRoute<Route>().params;
  const load = useCallback(() => fetchTripDetail(Number(tripId)), [tripId]);
  const { data, loading, error, reload } = useAsync(load);

  if (data) {
    return (
      <Screen scroll={false}>
        <View style={styles.bleed}>
          <Timeline
            trip={data}
            onOpen={eventId =>
              navigation.navigate('EventDetail', { tripId, eventId: String(eventId) })
            }
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title="Chuyến đi"
      headerLeft={
        <IconButton
          variant="ghost"
          accessibilityLabel="Quay lại"
          onPress={() => navigation.goBack()}
          icon={renderBack}
        />
      }
    >
      {loading ? (
        <Skeleton height={340} borderRadius={radius.card} />
      ) : (
        <ErrorState message={error ?? 'Không tải được chuyến đi.'} onRetry={reload} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // Screen có lề 20 và đệm đáy 24; màn này tự quản lề để dải ngày chạy sát mép.
  bleed: { flex: 1, marginHorizontal: -layout.screenMargin, marginBottom: -24 },
  headerClip: { overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: layout.screenMargin,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontSize: 22, lineHeight: 28 },
  body: { paddingHorizontal: layout.screenMargin, paddingTop: 4, paddingBottom: 24 },
  dayHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
    marginBottom: 14,
  },
});

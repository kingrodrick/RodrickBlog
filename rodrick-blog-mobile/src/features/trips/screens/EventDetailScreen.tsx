import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, EllipsisVertical } from 'lucide-react-native';
import { ErrorState, IconButton, Screen, Skeleton, Text, Toast } from '../../../shared/ui';
import { useAsync } from '../../../shared/hooks/useAsync';
import { iconSize, iconStroke, layout, radius, useTheme } from '../../../theme';
import { HomeStackParamList } from '../../../navigation/type';
import { fetchTripDetail } from '../api/tripDetail';
import { DocsPage, InfoPage, PhotosPage } from '../components/EventPages';
import { PhotoViewer } from '../components/PhotoViewer';
import { hhmm } from '../eventCategory';
import { DetailEvent, EventImage } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'EventDetail'>;
type Route = RouteProp<HomeStackParamList, 'EventDetail'>;

const icon = (Icon: typeof ChevronLeft) => (c: string) =>
  <Icon color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />;
const renderBack = icon(ChevronLeft);
const renderMore = icon(EllipsisVertical);

const CHAPTERS = ['Thông tin', 'Giấy tờ', 'Ảnh thực tế'];

/** Nội suy theo d = p - i, giới hạn trong [-1, 1] quanh trang i. */
function around(x: Animated.Value, w: number, i: number, out: [number, number, number]) {
  return x.interpolate({
    inputRange: [(i - 1) * w, i * w, (i + 1) * w],
    outputRange: out,
    extrapolate: 'clamp',
  });
}

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

type PagerProps = {
  event: DetailEvent;
  onBack: () => void;
  onEditRoute: () => void;
};

function Pager({ event, onBack, onEditRoute }: PagerProps) {
  const { colors } = useTheme();
  const reduce = useReduceMotion();
  const [width, setWidth] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [viewer, setViewer] = useState<{ images: EventImage[]; index: number } | null>(null);
  const openPhoto = useCallback((images: EventImage[], index: number) => setViewer({ images, index }), []);

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: true,
  });

  const ghosts = [hhmm(event.start_time)?.slice(0, 2) ?? '01', '02', '03'];
  const pages = [
    <InfoPage key="info" event={event} onOpenPhoto={openPhoto} onEditRoute={onEditRoute} />,
    <DocsPage key="docs" event={event} />,
    <PhotosPage key="photos" event={event} onOpenPhoto={openPhoto} />,
  ];

  return (
    <View style={styles.fill}>
      <View style={styles.top}>
        <IconButton accessibilityLabel="Quay lại" onPress={onBack} icon={renderBack} />
        <View style={styles.chapters} accessibilityRole="header">
          {CHAPTERS.map((label, i) => (
            <Animated.View
              key={label}
              style={[
                styles.chapter,
                width
                  ? {
                      opacity: around(scrollX, width, i, [0, 1, 0]),
                      transform: [{ translateX: around(scrollX, width, i, [28, 0, -28]) }],
                    }
                  : i === 0 ? null : styles.hidden,
              ]}
            >
              <Text variant="overline" tone="secondary">
                <Text variant="overline" tone="accent">
                  {i + 1}/3{'  '}
                </Text>
                {label}
              </Text>
            </Animated.View>
          ))}
        </View>
        {/* Chưa có hành động; giữ chỗ theo mockup. */}
        <IconButton accessibilityLabel="Tuỳ chọn" onPress={() => {}} icon={renderMore} />
      </View>

      <View style={styles.progress}>
        {CHAPTERS.map((label, i) => (
          <View key={label} style={[styles.bar, { backgroundColor: colors.surfaceMuted }]}>
            <Animated.View
              style={[
                styles.barFill,
                { backgroundColor: colors.accent },
                {
                  transform: [
                    {
                      scaleX: width
                        ? scrollX.interpolate({
                            inputRange: [(i - 1) * width, i * width],
                            outputRange: [0, 1],
                            extrapolate: 'clamp',
                          })
                        : i === 0
                        ? 1
                        : 0,
                    },
                  ],
                },
              ]}
            />
          </View>
        ))}
      </View>

      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.fill}
      >
        {pages.map((page, i) => (
          <ScrollView
            key={i}
            style={{ width: width || undefined }}
            contentContainerStyle={styles.pageBody}
            showsVerticalScrollIndicator={false}
          >
            <Animated.Text
              style={[
                styles.ghost,
                { color: colors.surfaceMuted },
                width && !reduce
                  ? { transform: [{ translateX: around(scrollX, width, i, [120, 0, -120]) }] }
                  : null,
              ]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {ghosts[i]}
            </Animated.Text>
            <Animated.View
              style={
                width && !reduce
                  ? {
                      opacity: around(scrollX, width, i, [0.15, 1, 0.15]),
                      transform: [
                        { translateX: around(scrollX, width, i, [22, 0, -22]) },
                        { scale: around(scrollX, width, i, [0.95, 1, 0.95]) },
                      ],
                    }
                  : null
              }
            >
              {page}
            </Animated.View>
          </ScrollView>
        ))}
      </Animated.ScrollView>

      <PhotoViewer
        images={viewer?.images ?? []}
        index={viewer?.index ?? null}
        onClose={() => setViewer(null)}
      />
    </View>
  );
}

export function EventDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { tripId, eventId, notice } = useRoute<Route>().params;
  const load = useCallback(() => fetchTripDetail(Number(tripId)), [tripId]);
  const { data, loading, error, reload } = useAsync(load);
  const event = data?.timeline_events.find(e => e.id === Number(eventId));
  const [toast, setToast] = useState<string | null>(null);

  // Quay về từ màn Sửa lộ trình: tải lại dữ liệu và báo kết quả bằng toast.
  useEffect(() => {
    if (notice) {
      setToast(notice);
      reload();
      navigation.setParams({ notice: undefined });
    }
  }, [notice, reload, navigation]);

  if (!event) {
    return (
      <Screen
        title="Mốc"
        headerLeft={
          <IconButton variant="ghost" accessibilityLabel="Quay lại" onPress={() => navigation.goBack()} icon={renderBack} />
        }
      >
        {loading ? (
          <Skeleton height={240} borderRadius={radius.card} />
        ) : (
          <ErrorState message={error ?? 'Không tìm thấy mốc này.'} onRetry={reload} />
        )}
      </Screen>
    );
  }

  return (
    // Cả ba trang theo giao diện của máy/Cài đặt (sir chốt 20/11: trang Ảnh thực tế không ép tối).
    <Screen scroll={false}>
      <View style={styles.bleed}>
        <Pager
          event={event}
          onBack={() => navigation.goBack()}
          onEditRoute={() => navigation.navigate('RouteEdit', { tripId, eventId })}
        />
        <Toast
          message={toast ?? ''}
          visible={toast !== null}
          kind="success"
          onDismiss={() => setToast(null)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bleed: { flex: 1, marginHorizontal: -layout.screenMargin, marginBottom: -24 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: layout.screenMargin,
    paddingTop: 8,
  },
  chapters: { flex: 1, height: 44 },
  chapter: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center' },
  hidden: { opacity: 0 },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: layout.screenMargin, paddingTop: 12, paddingBottom: 4 },
  bar: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  barFill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, transformOrigin: 'left' },
  pageBody: { paddingHorizontal: layout.screenMargin, paddingTop: 20, paddingBottom: 28 },
  ghost: {
    position: 'absolute',
    right: -6,
    top: 8,
    fontSize: 150,
    lineHeight: 160,
    fontWeight: '800',
    letterSpacing: -6,
    opacity: 0.7,
  },
});

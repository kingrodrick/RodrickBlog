import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Pencil, Plus } from 'lucide-react-native';
import { Dialog, ErrorState, IconButton, Screen, Skeleton, Text, Toast } from '../../../shared/ui';
import { useAsync } from '../../../shared/hooks/useAsync';
import { iconSize, iconStroke, layout, radius, useTheme } from '../../../theme';
import { HomeStackParamList } from '../../../navigation/type';
import { fetchTripDetail } from '../api/tripDetail';
import { deleteEventRouteById } from '../api/routeApi';
import { LocalDocument, removeLocalDocument } from '../../../shared/api/localDocuments';
import { AddDocumentSheet } from '../components/AddDocumentSheet';
import { AddPhotosFlow } from '../components/AddPhotosFlow';
import { EditEventModal } from '../components/EditEventModal';
import { DocsPage, InfoPage, PhotosPage } from '../components/EventPages';
import { PickedDocument, pickDocument } from '../documentFile';
import { useLocalDocuments } from '../useLocalDocuments';
import { PhotoViewer } from '../components/PhotoViewer';
import { DetailEvent, EventImage, EventMap } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'EventDetail'>;
type Route = RouteProp<HomeStackParamList, 'EventDetail'>;

const icon = (Icon: typeof ChevronLeft) => (c: string) =>
  <Icon color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />;
const renderBack = icon(ChevronLeft);
const renderPencil = icon(Pencil);
const renderPlus = icon(Plus);

/** Nút thao tác của từng trang: bút chì sửa mốc, dấu cộng thêm giấy tờ, dấu cộng thêm ảnh thực tế. */
const PAGE_ACTIONS = [
  { label: 'Sửa mốc', render: renderPencil },
  { label: 'Thêm giấy tờ', render: renderPlus },
  { label: 'Thêm ảnh thực tế', render: renderPlus },
];

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

/** Trang ngang trang Thông tin tự chia cột và tự cuộn; các trang còn lại cuộn dọc một cột. */
function PageShell({ width, full, children }: { width: number; full: boolean; children: React.ReactNode }) {
  if (full) {
    return <View style={[styles.pageFull, { width: width || undefined }]}>{children}</View>;
  }
  return (
    <ScrollView
      style={{ width: width || undefined }}
      contentContainerStyle={styles.pageBody}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

type PagerProps = {
  event: DetailEvent;
  docs: LocalDocument[];
  onBack: () => void;
  /** Bấm nút thao tác của trang hiện tại (0: sửa mốc, 1: thêm giấy tờ, 2: thêm ảnh thực tế). */
  onAction: (page: number) => void;
  onDeleteDoc: (doc: LocalDocument) => void;
  onError: (message: string) => void;
  onAddRoute: () => void;
  onViewRoute: (m: EventMap) => void;
  onDeleteRoute: (m: EventMap) => void;
};

function Pager({ event, docs, onBack, onAction, onDeleteDoc, onError, onAddRoute, onViewRoute, onDeleteRoute }: PagerProps) {
  const { colors } = useTheme();
  const reduce = useReduceMotion();
  const { width: winW, height: winH } = useWindowDimensions();
  const landscape = winW > winH;
  const [width, setWidth] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [viewer, setViewer] = useState<{ images: EventImage[]; index: number } | null>(null);
  const openPhoto = useCallback((images: EventImage[], index: number) => setViewer({ images, index }), []);

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: true,
  });

  // Xoay màn làm đổi bề ngang trang: cuộn lại đúng trang đang xem, tránh lệch giữa hai trang.
  const pagerRef = useRef<ScrollViewInstance>(null);
  const currentPage = useRef(0);
  const [pageIndex, setPageIndex] = useState(0);
  useEffect(() => {
    if (width) {
      pagerRef.current?.scrollTo({ x: currentPage.current * width, animated: false });
    }
  }, [width]);

  const pages = [
    <InfoPage
      key="info"
      event={event}
      landscape={landscape}
      onOpenPhoto={openPhoto}
      onAddRoute={onAddRoute}
      onViewRoute={onViewRoute}
      onDeleteRoute={onDeleteRoute}
    />,
    <DocsPage key="docs" docs={docs} landscape={landscape} onDelete={onDeleteDoc} onError={onError} />,
    <PhotosPage key="photos" event={event} onOpenPhoto={openPhoto} landscape={landscape} />,
  ];

  const progress = (
    <View style={[styles.progress, landscape && styles.progressLand]}>
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
  );

  return (
    <View style={styles.fill}>
      <View style={[styles.top, landscape ? styles.topLand : styles.topPort]}>
        <IconButton variant="ghost" accessibilityLabel="Quay lại" onPress={onBack} icon={renderBack} />
        <View style={[styles.chapters, landscape && styles.chaptersLand]} accessibilityRole="header">
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
              <Text variant="heading">
                <Text variant="heading" tone="accent">
                  {i + 1}/3{'  '}
                </Text>
                {label}
              </Text>
            </Animated.View>
          ))}
        </View>
        {landscape ? progress : null}
        <IconButton
          variant="ghost"
          accessibilityLabel={PAGE_ACTIONS[pageIndex].label}
          onPress={() => onAction(pageIndex)}
          icon={PAGE_ACTIONS[pageIndex].render}
        />
      </View>

      {landscape ? null : progress}

      <Animated.ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
        onMomentumScrollEnd={e => {
          if (width) {
            currentPage.current = Math.round(e.nativeEvent.contentOffset.x / width);
            setPageIndex(currentPage.current);
          }
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.fill}
      >
        {pages.map((page, i) => (
          <PageShell key={i} width={width} full={landscape && i === 0}>
            <Animated.View
              style={[
                landscape && i === 0 ? styles.fill : null,
                width && !reduce
                  ? {
                      opacity: around(scrollX, width, i, [0.15, 1, 0.15]),
                      transform: [
                        { translateX: around(scrollX, width, i, [22, 0, -22]) },
                        { scale: around(scrollX, width, i, [0.95, 1, 0.95]) },
                      ],
                    }
                  : null,
              ]}
            >
              {page}
            </Animated.View>
          </PageShell>
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
  const [toastKind, setToastKind] = useState<'success' | 'error'>('success');
  const [askDelete, setAskDelete] = useState<EventMap | null>(null);
  const [editing, setEditing] = useState(false);
  const [addingPhotos, setAddingPhotos] = useState(false);
  const [pickedDoc, setPickedDoc] = useState<PickedDocument | null>(null);
  const [askDeleteDoc, setAskDeleteDoc] = useState<LocalDocument | null>(null);
  const { docs, reload: reloadDocs } = useLocalDocuments(Number(eventId));

  const notify = useCallback((text: string, kind: 'success' | 'error' = 'success') => {
    setToastKind(kind);
    setToast(text);
  }, []);

  const onAction = async (page: number) => {
    if (page === 0) {
      setEditing(true);
    } else if (page === 1) {
      try {
        const doc = await pickDocument();
        if (doc) {
          setPickedDoc(doc);
        }
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Không mở được bộ chọn tệp.', 'error');
      }
    } else {
      setAddingPhotos(true);
    }
  };

  const confirmDeleteDoc = async () => {
    const d = askDeleteDoc;
    setAskDeleteDoc(null);
    if (!d) {
      return;
    }
    try {
      await removeLocalDocument(d.id);
      notify('Đã xoá giấy tờ');
      reloadDocs();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Không xoá được giấy tờ.', 'error');
    }
  };

  const confirmDelete = async () => {
    const m = askDelete;
    setAskDelete(null);
    if (!m) {
      return;
    }
    try {
      await deleteEventRouteById(m.id);
      setToastKind('success');
      setToast('Đã xoá lộ trình');
      reload();
    } catch (e) {
      setToastKind('error');
      setToast(e instanceof Error ? e.message : 'Không xoá được lộ trình.');
    }
  };

  // Quay về từ màn Sửa lộ trình: tải lại dữ liệu và báo kết quả bằng toast.
  useEffect(() => {
    if (notice) {
      setToastKind('success');
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
          docs={docs}
          onBack={() => navigation.goBack()}
          onAction={onAction}
          onDeleteDoc={setAskDeleteDoc}
          onError={text => notify(text, 'error')}
          onAddRoute={() => navigation.navigate('RouteEdit', { tripId, eventId })}
          onViewRoute={m => navigation.navigate('RouteEdit', { tripId, eventId, mapId: m.id, view: true })}
          onDeleteRoute={setAskDelete}
        />
        <Toast
          message={toast ?? ''}
          visible={toast !== null}
          kind={toastKind}
          onDismiss={() => setToast(null)}
        />
        <Dialog
          visible={askDelete !== null}
          title="Xoá lộ trình?"
          description={askDelete ? `${askDelete.origin_name || 'Vị trí hiện tại'} đến ${askDelete.destination_name}` : undefined}
          cancelLabel="Huỷ"
          confirmLabel="Xoá"
          destructive
          onCancel={() => setAskDelete(null)}
          onConfirm={confirmDelete}
        />
        <Dialog
          visible={askDeleteDoc !== null}
          title="Xoá giấy tờ?"
          description={askDeleteDoc ? `${askDeleteDoc.name} sẽ bị xoá khỏi điện thoại này.` : undefined}
          cancelLabel="Huỷ"
          confirmLabel="Xoá"
          destructive
          onCancel={() => setAskDeleteDoc(null)}
          onConfirm={confirmDeleteDoc}
        />
        <AddDocumentSheet
          picked={pickedDoc}
          eventId={event.id}
          onClose={() => setPickedDoc(null)}
          onError={text => notify(text, 'error')}
          onSaved={() => {
            setPickedDoc(null);
            notify('Đã thêm giấy tờ');
            reloadDocs();
          }}
        />
        <AddPhotosFlow
          open={addingPhotos}
          kind="real"
          event={event}
          tripTitle={data?.title ?? ''}
          onClose={() => setAddingPhotos(false)}
          onError={text => notify(text, 'error')}
          onAdded={count => {
            notify(`Đã thêm ${count} ảnh`);
            reload();
          }}
        />
        <EditEventModal
          event={event}
          siblings={data?.timeline_events ?? []}
          tripTitle={data?.title ?? ''}
          visible={editing}
          onClose={() => setEditing(false)}
          onDataChanged={message => {
            notify(message);
            reload();
          }}
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
  topLand: { paddingTop: 2 },
  // Dọc: nút quay lại sát cạnh trái hơn (đệm trái 20 xuống 8).
  topPort: { paddingLeft: 8, paddingRight: 8 },
  chapters: { flex: 1, height: 44 },
  chaptersLand: { flex: 0, width: 190 },
  chapter: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center' },
  hidden: { opacity: 0 },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: layout.screenMargin, paddingTop: 12, paddingBottom: 4 },
  progressLand: { flex: 1, paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0 },
  bar: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  barFill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, transformOrigin: 'left' },
  pageFull: { paddingHorizontal: layout.screenMargin, paddingTop: 12, paddingBottom: 12 },
  pageBody: { paddingHorizontal: layout.screenMargin, paddingTop: 20, paddingBottom: 28 },
});

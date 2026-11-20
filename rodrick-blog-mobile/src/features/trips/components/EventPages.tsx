import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Card, EmptyState, Text } from '../../../shared/ui';
import { cloudinaryUrl } from '../../../shared/utils/cloudinary';
import { radius, useTheme } from '../../../theme';
import { shortDate } from '../dayFormat';
import { EVENT_TYPE_LABEL, eventTimes, eventType, isFlight } from '../eventCategory';
import { DetailEvent, EventImage, EventMap } from '../types';
import { DocumentTicket } from './DocumentTicket';
import { RouteList } from './RouteList';

const tabular = { fontVariant: ['tabular-nums' as const] };

/** Đầu trang chung của trang 2 và 3: overline màu nhấn, tiêu đề lớn, dòng dẫn. */
function PageHead({
  kicker,
  title,
  lead,
  landscape,
}: {
  kicker: string;
  title: string;
  lead: string;
  landscape?: boolean;
}) {
  return (
    <View style={[styles.head, landscape && styles.headLand]}>
      <Text variant="overline" tone="accent">
        {kicker}
      </Text>
      <Text variant="display" style={landscape ? styles.pageTitleLand : styles.pageTitle}>
        {title}
      </Text>
      <Text variant="body" tone="secondary">
        {lead}
      </Text>
    </View>
  );
}

type InfoProps = {
  event: DetailEvent;
  landscape: boolean;
  onOpenPhoto: (images: EventImage[], index: number) => void;
  onAddRoute: () => void;
  onViewRoute: (m: EventMap) => void;
  onDeleteRoute: (m: EventMap) => void;
};

/** Trang 1: Thông tin. Dọc một cột; ngang hai cột (trái: thông tin chung cố định + lộ trình, phải: mô tả + ảnh minh họa). */
export function InfoPage({ event, landscape, onOpenPhoto, onAddRoute, onViewRoute, onDeleteRoute }: InfoProps) {
  const { colors } = useTheme();
  const type = eventType(event.category_tag);
  const { start, end } = eventTimes(event);
  const refs = event.images.filter(i => i.is_real_photo === false);

  const header = (
    <View>
      <View style={styles.hline1}>
        <Text variant="overline" numberOfLines={1} style={[styles.flexShrink, { color: colors.eventType[type] }]}>
          {EVENT_TYPE_LABEL[type]} • {shortDate(event.trip_date)}
        </Text>
        <View style={styles.timeRow}>
          <Text style={[styles.time, tabular]}>{start}</Text>
          {end ? (
            <>
              <ArrowRight size={16} color={colors.textMuted} strokeWidth={2} strokeLinecap="round" />
              <Text style={[styles.time, tabular]}>{end}</Text>
            </>
          ) : null}
        </View>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {event.location_name}
      </Text>
    </View>
  );

  const notes = event.notes ? (
    <Card style={landscape ? undefined : styles.block}>
      <Text tone="secondary" style={styles.note}>
        {event.notes}
      </Text>
    </Card>
  ) : null;

  const routes = (
    <RouteList
      event={event}
      presetDestination={!isFlight(event)}
      onAdd={onAddRoute}
      onView={onViewRoute}
      onDelete={onDeleteRoute}
    />
  );

  const refHead = (
    <View style={styles.sec}>
      <Text variant="overline" tone="muted">
        Ảnh minh họa
      </Text>
      <Text variant="overline" tone="muted">
        {refs.length}
      </Text>
    </View>
  );

  const hint = (
    <Text variant="caption" tone="muted" style={styles.hint}>
      Vuốt sang trái để xem giấy tờ
    </Text>
  );

  if (landscape) {
    return (
      <View style={styles.cols}>
        <View style={styles.col2}>
          {header}
          <ScrollView
            style={styles.colScroll}
            contentContainerStyle={styles.colBody}
            showsVerticalScrollIndicator={false}
          >
            {routes}
          </ScrollView>
        </View>
        <ScrollView style={styles.col2} contentContainerStyle={styles.colBody} showsVerticalScrollIndicator={false}>
          {notes}
          {refs.length ? (
            <>
              {refHead}
              <View style={styles.refGrid}>
                {refs.map((img, i) => (
                  <Pressable
                    key={img.id}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={img.caption ?? `Ảnh minh họa ${i + 1}`}
                    onPress={() => onOpenPhoto(refs, i)}
                    style={[styles.refCell, { backgroundColor: colors.referenceBg }]}
                  >
                    <Image
                      source={{ uri: cloudinaryUrl(img.cloudinary_url, { w: 400, h: 400 }) }}
                      style={[styles.refSquare, { backgroundColor: colors.surfaceMuted }]}
                    />
                    <Text
                      variant="caption"
                      numberOfLines={2}
                      style={[styles.refCap, { color: colors.referenceLabel }]}
                    >
                      {img.caption ?? `${i + 1}/${refs.length}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
          {hint}
        </ScrollView>
      </View>
    );
  }

  return (
    <>
      {header}
      {notes}
      <View style={styles.block}>{routes}</View>

      {refs.length ? (
        <>
          <View style={[styles.sec, styles.secBig]}>
            <Text variant="overline" tone="muted">
              Ảnh minh họa
            </Text>
            <Text variant="overline" tone="muted">
              {refs.length}
            </Text>
          </View>
          <View style={styles.stack}>
            {refs.map((img, i) => (
              <Pressable
                key={img.id}
                accessibilityRole="imagebutton"
                accessibilityLabel={img.caption ?? `Ảnh minh họa ${i + 1}`}
                onPress={() => onOpenPhoto(refs, i)}
                style={[styles.kraft, { backgroundColor: colors.referenceBg }]}
              >
                <Image
                  source={{ uri: cloudinaryUrl(img.cloudinary_url, { w: 1000, h: 800 }) }}
                  style={[styles.refImg, { backgroundColor: colors.surfaceMuted }]}
                />
                <View style={styles.kraftCap}>
                  <Text variant="caption" style={[styles.flex, { color: colors.referenceLabel }]}>
                    {img.caption ?? ''}
                  </Text>
                  <Text variant="caption" style={{ color: colors.referenceLabel }}>
                    {i + 1}/{refs.length}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {hint}
    </>
  );
}

/** Trang 2: Giấy tờ. */
export function DocsPage({ event, landscape }: { event: DetailEvent; landscape?: boolean }) {
  const docs = event.documents;
  return (
    <>
      <PageHead
        landscape={landscape}
        kicker="Giấy tờ"
        title="Xuất trình tại quầy"
        lead={docs.length ? `${docs.length} giấy tờ cho mốc này.` : 'Chưa có giấy tờ.'}
      />
      {docs.length ? (
        <View style={styles.stack}>
          {docs.map(d => (
            <DocumentTicket key={d.id} doc={d} />
          ))}
        </View>
      ) : (
        <EmptyState message="Mốc này chưa có giấy tờ" />
      )}
    </>
  );
}

// Tỉ lệ cao/rộng xoay vòng cho lưới xếp gạch (ảnh cắt cover, chưa có kích thước thật).
const BRICKS = [1.3, 0.85, 1.05, 1.4, 0.9, 1.15];

/** Trang 3: Ảnh thực tế, lưới xếp gạch: dọc 3 cột, ngang 5 cột. */
export function PhotosPage({
  event,
  onOpenPhoto,
  landscape,
}: {
  event: DetailEvent;
  onOpenPhoto: (images: EventImage[], index: number) => void;
  landscape?: boolean;
}) {
  const { colors } = useTheme();
  const real = event.images.filter(i => i.is_real_photo !== false);
  // Chia cột theo chiều cao tích luỹ để các cột dài gần bằng nhau.
  const n = landscape ? 5 : 3;
  const cols: { img: EventImage; i: number; r: number }[][] = Array.from({ length: n }, () => []);
  const h: number[] = Array(n).fill(0);
  real.forEach((img, i) => {
    const r = BRICKS[i % BRICKS.length];
    const c = h.indexOf(Math.min(...h));
    cols[c].push({ img, i, r });
    h[c] += r;
  });

  return (
    <>
      <PageHead
        landscape={landscape}
        kicker="Ảnh thực tế • Sony A6400"
        title="Khoảnh khắc đã chụp"
        lead={real.length ? `${real.length} ảnh từ chuyến đi.` : 'Chưa có ảnh.'}
      />
      {real.length ? (
        <View style={[styles.grid, landscape && styles.gridTight]}>
          {cols.map((col, ci) => (
            <View key={ci} style={[styles.col, landscape && styles.colTight]}>
              {col.map(({ img, i, r }) => (
                <Pressable
                  key={img.id}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={img.caption ?? `Ảnh ${i + 1}`}
                  onPress={() => onOpenPhoto(real, i)}
                >
                  <Image
                    source={{ uri: cloudinaryUrl(img.cloudinary_url, { w: 360, h: Math.round(360 * r) }) }}
                    style={[
                      styles.brick,
                      landscape && styles.brickSmall,
                      { aspectRatio: 1 / r, backgroundColor: colors.surfaceMuted },
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      ) : (
        <EmptyState message="Mốc này chưa có ảnh thực tế" />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  head: { gap: 4, marginBottom: 8 },
  headLand: { gap: 2, marginBottom: 0 },
  pageTitle: { fontSize: 40, lineHeight: 44, marginTop: 4 },
  pageTitleLand: { fontSize: 28, lineHeight: 32, marginTop: 0 },
  hline1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  time: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.5 },
  name: { fontSize: 22, lineHeight: 28, fontWeight: '700', marginTop: 10 },
  note: { fontSize: 15, lineHeight: 22 },
  block: { marginTop: 20 },
  sec: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  secBig: { marginTop: 28, marginBottom: 12 },
  stack: { gap: 16, marginTop: 12 },
  kraft: { borderRadius: radius.card, padding: 8 },
  refImg: { width: '100%', aspectRatio: 5 / 4, borderRadius: 10 },
  kraftCap: { flexDirection: 'row', gap: 12, paddingHorizontal: 6, paddingTop: 10, paddingBottom: 4 },
  hint: { textAlign: 'center', marginTop: 20 },
  cols: { flex: 1, flexDirection: 'row', gap: 28 },
  col2: { flex: 1 },
  colScroll: { flex: 1, marginTop: 12 },
  colBody: { paddingBottom: 16 },
  refGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  refCell: { width: '31.5%', padding: 6, borderRadius: radius.control },
  refSquare: { width: '100%', aspectRatio: 1, borderRadius: 8 },
  refCap: { fontSize: 11, lineHeight: 14, paddingTop: 6, paddingHorizontal: 2 },
  grid: { flexDirection: 'row', gap: 10, marginTop: 12 },
  col: { flex: 1, gap: 10 },
  gridTight: { gap: 8 },
  colTight: { gap: 8 },
  brick: { width: '100%', borderRadius: 14 },
  brickSmall: { borderRadius: 10 },
});

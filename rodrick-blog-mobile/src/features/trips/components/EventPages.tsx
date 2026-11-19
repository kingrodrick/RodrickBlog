import React from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Button, Card, EmptyState, Text } from '../../../shared/ui';
import { cloudinaryUrl } from '../../../shared/utils/cloudinary';
import { radius, useTheme } from '../../../theme';
import { shortDate } from '../dayFormat';
import { EVENT_TYPE_LABEL, eventTimes, eventType, isFlight } from '../eventCategory';
import { buildDirectionsUrl, buildSearchUrl, TRAVEL_MODE_LABEL } from '../maps';
import { DetailEvent, EventImage, EventMap } from '../types';
import { DocumentTicket } from './DocumentTicket';

const tabular = { fontVariant: ['tabular-nums' as const] };

/** Đầu trang chung của trang 2 và 3: overline màu nhấn, tiêu đề lớn, dòng dẫn. */
function PageHead({ kicker, title, lead }: { kicker: string; title: string; lead: string }) {
  return (
    <View style={styles.head}>
      <Text variant="overline" tone="accent">
        {kicker}
      </Text>
      <Text variant="display" style={styles.pageTitle}>
        {title}
      </Text>
      <Text variant="body" tone="secondary">
        {lead}
      </Text>
    </View>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.kv}>
      <Text variant="label" tone="secondary" style={styles.kvKey}>
        {k}
      </Text>
      <Text variant="label" style={styles.kvVal}>
        {v}
      </Text>
    </View>
  );
}

function EditLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.editLink} hitSlop={8}>
      <Text variant="label" tone="accent" style={styles.underline}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Khối lộ trình (nền trầm, bo 16): Xuất phát, Điểm dừng, Phương tiện; chưa có thì mời thêm. */
function RouteBlock({ m, onEdit }: { m?: EventMap; onEdit: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.route, { backgroundColor: colors.surfaceMuted }]}>
      {m ? (
        <>
          <KV k="Xuất phát" v={m.origin_name || 'Vị trí hiện tại'} />
          {m.waypoints.length ? <KV k="Điểm dừng" v={m.waypoints.join(', ')} /> : null}
          <KV k="Điểm đến" v={m.destination_name} />
          {m.travel_mode ? <KV k="Phương tiện" v={TRAVEL_MODE_LABEL[m.travel_mode]} /> : null}
          <EditLink label="Sửa lộ trình" onPress={onEdit} />
        </>
      ) : (
        <>
          <Text variant="label" tone="secondary" style={styles.noRoute}>
            Chưa có lộ trình
          </Text>
          <EditLink label="Thêm lộ trình" onPress={onEdit} />
        </>
      )}
    </View>
  );
}

/** Trang 1: Thông tin. */
export function InfoPage({
  event,
  onOpenPhoto,
  onEditRoute,
}: {
  event: DetailEvent;
  onOpenPhoto: (images: EventImage[], index: number) => void;
  onEditRoute: () => void;
}) {
  const { colors } = useTheme();
  const type = eventType(event.category_tag);
  const { start, end } = eventTimes(event);
  const maps = event.event_maps;
  const refs = event.images.filter(i => i.is_real_photo === false);
  const fallbackUrl = !maps.length && !isFlight(event) ? buildSearchUrl(event.location_name, event.city) : null;

  return (
    <>
      <Text variant="overline" style={{ color: colors.eventType[type] }}>
        {EVENT_TYPE_LABEL[type]} • {shortDate(event.trip_date)}
      </Text>
      <View style={styles.bigTimeRow}>
        <Text style={[styles.bigTime, tabular]} numberOfLines={1} adjustsFontSizeToFit>
          {start}
        </Text>
        {end ? (
          <>
            <ArrowRight size={28} color={colors.textMuted} strokeWidth={2} strokeLinecap="round" />
            <Text style={[styles.bigTime, tabular]}>{end}</Text>
          </>
        ) : null}
      </View>
      <Text style={styles.name}>{event.location_name}</Text>
      {event.city ? (
        <Text variant="body" tone="secondary">
          {event.city}
        </Text>
      ) : null}

      {event.notes ? (
        <Card style={styles.block}>
          <Text tone="secondary" style={styles.note}>
            {event.notes}
          </Text>
        </Card>
      ) : null}

      {maps.length ? (
        <>
          <View style={styles.block}>
            <Button
              size="md"
              title="Chỉ đường"
              onPress={() => Linking.openURL(buildDirectionsUrl(maps[0], event.city))}
            />
          </View>
          <RouteBlock m={maps[0]} onEdit={onEditRoute} />
          {maps.length > 1 ? (
            <View style={styles.legs}>
              <Text variant="overline" tone="muted">
                Các chặng
              </Text>
              {maps.map((m, i) => (
                <Card
                  key={m.id}
                  onPress={() => Linking.openURL(buildDirectionsUrl(m, event.city))}
                  accessibilityLabel={`Chỉ đường chặng ${i + 1}`}
                >
                  <Text variant="label" tone="muted">
                    Chặng {i + 1}
                  </Text>
                  <Text variant="label">
                    {m.origin_name || 'Vị trí hiện tại'} - {m.destination_name}
                  </Text>
                </Card>
              ))}
            </View>
          ) : null}
        </>
      ) : fallbackUrl ? (
        <>
          <View style={styles.block}>
            <Button size="md" title="Chỉ đường" onPress={() => Linking.openURL(fallbackUrl)} />
          </View>
          <RouteBlock onEdit={onEditRoute} />
        </>
      ) : null}

      {refs.length ? (
        <>
          <View style={styles.sec}>
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

      <Text variant="caption" tone="muted" style={styles.hint}>
        Vuốt sang trái để xem giấy tờ
      </Text>
    </>
  );
}

/** Trang 2: Giấy tờ. */
export function DocsPage({ event }: { event: DetailEvent }) {
  const docs = event.documents;
  return (
    <>
      <PageHead
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

/** Trang 3: Ảnh thực tế, lưới 2 cột xếp gạch. */
export function PhotosPage({
  event,
  onOpenPhoto,
}: {
  event: DetailEvent;
  onOpenPhoto: (images: EventImage[], index: number) => void;
}) {
  const { colors } = useTheme();
  const real = event.images.filter(i => i.is_real_photo !== false);
  // Chia hai cột theo chiều cao tích luỹ để hai cột dài gần bằng nhau.
  const cols: { img: EventImage; i: number; r: number }[][] = [[], []];
  const h = [0, 0];
  real.forEach((img, i) => {
    const r = BRICKS[i % BRICKS.length];
    const c = h[0] <= h[1] ? 0 : 1;
    cols[c].push({ img, i, r });
    h[c] += r;
  });

  return (
    <>
      <PageHead
        kicker="Ảnh thực tế • Sony A6400"
        title="Khoảnh khắc đã chụp"
        lead={real.length ? `${real.length} ảnh từ chuyến đi.` : 'Chưa có ảnh.'}
      />
      {real.length ? (
        <View style={styles.grid}>
          {cols.map((col, ci) => (
            <View key={ci} style={styles.col}>
              {col.map(({ img, i, r }) => (
                <Pressable
                  key={img.id}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={img.caption ?? `Ảnh ${i + 1}`}
                  onPress={() => onOpenPhoto(real, i)}
                >
                  <Image
                    source={{ uri: cloudinaryUrl(img.cloudinary_url, { w: 540, h: Math.round(540 * r) }) }}
                    style={[styles.brick, { aspectRatio: 1 / r, backgroundColor: colors.surfaceMuted }]}
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
  head: { gap: 4, marginBottom: 8 },
  pageTitle: { fontSize: 40, lineHeight: 44, marginTop: 4 },
  bigTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  bigTime: { fontSize: 44, lineHeight: 52, fontWeight: '700', letterSpacing: -2, flexShrink: 1 },
  name: { fontSize: 30, lineHeight: 36, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  note: { fontSize: 15, lineHeight: 22 },
  block: { marginTop: 20 },
  route: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 4, borderRadius: radius.card },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 12 },
  kvKey: { fontWeight: '400' },
  kvVal: { flexShrink: 1, textAlign: 'right' },
  legs: { marginTop: 16, gap: 8 },
  editLink: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
  noRoute: { fontWeight: '400', paddingTop: 12 },
  sec: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  stack: { gap: 16, marginTop: 12 },
  kraft: { borderRadius: radius.card, padding: 8 },
  refImg: { width: '100%', aspectRatio: 5 / 4, borderRadius: 10 },
  kraftCap: { flexDirection: 'row', gap: 12, paddingHorizontal: 6, paddingTop: 10, paddingBottom: 4 },
  hint: { textAlign: 'center', marginTop: 20 },
  grid: { flexDirection: 'row', gap: 10, marginTop: 12 },
  col: { flex: 1, gap: 10 },
  brick: { width: '100%', borderRadius: 14 },
});

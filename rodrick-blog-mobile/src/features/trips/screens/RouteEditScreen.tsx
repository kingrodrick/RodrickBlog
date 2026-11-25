import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Alert, Button, Dialog, ErrorState, IconButton, Skeleton, Text, TextField } from '../../../shared/ui';
import { useAsync } from '../../../shared/hooks/useAsync';
import { iconSize, iconStroke, radius, useTheme } from '../../../theme';
import { HomeStackParamList } from '../../../navigation/type';
import { fetchTripDetail } from '../api/tripDetail';
import { addEventRoute, deleteEventRouteById, replaceEventRoute, RouteInput } from '../api/routeApi';
import { MODE_ICON } from '../components/RouteList';
import { buildDirectionsUrl, buildPickRouteUrl, TRAVEL_MODE_LABEL } from '../maps';
import { ParsedRoute, parseMapsLink, resolveMapsLink } from '../parseMapsLink';
import { DetailEvent, EventMap, TravelMode } from '../types';
import { markRouteEdit } from '../pendingRouteEdit';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'RouteEdit'>;
type Route = RouteProp<HomeStackParamList, 'RouteEdit'>;

const renderClose = (c: string) => (
  <X color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />
);

const GUTTER = 20;
const DOT = 12;

/** Liên kết chữ gạch chân màu nhấn, vùng chạm tối thiểu 44. */
function TextLink({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.link} hitSlop={8}>
      <Text variant="label" tone={danger ? 'error' : 'accent'} style={styles.underline}>
        {label}
      </Text>
    </Pressable>
  );
}

const MODE_ORDER: TravelMode[] = ['driving', 'bicycling', 'transit', 'walking'];

/** 'YYYY-MM-DDTHH:MM:SS' thành '08:15 15/12' (giờ địa phương nơi đi, không đổi múi giờ). */
function formatDepart(s: string): string {
  const m = s.match(/^\d{4}-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? `${m[3]}:${m[4]} ${m[2]}/${m[1]}` : s;
}

// Sai số khi so toạ độ (khoảng 10 m).
const COORD_EPS = 1e-4;

/** "34.99,135.75" thành { lat, lng }; không phải toạ độ thì null. */
function parseCoord(s: string): { lat: number; lng: number } | null {
  const m = s.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
}

/** Các điểm có tên và toạ độ trong những lộ trình đã lưu của mốc. */
function knownPoints(maps: EventMap[]): { name: string; lat: number; lng: number }[] {
  const out: { name: string; lat: number; lng: number }[] = [];
  maps.forEach(m => {
    if (m.origin_name && m.origin_lat != null && m.origin_lng != null) {
      out.push({ name: m.origin_name, lat: m.origin_lat, lng: m.origin_lng });
    }
    if (m.destination_lat != null && m.destination_lng != null) {
      out.push({ name: m.destination_name, lat: m.destination_lat, lng: m.destination_lng });
    }
  });
  return out;
}

type Stop = { key: string; label: string; name: string; tone: 'origin' | 'via' | 'end' };

/** Thông tin lộ trình chỉ đọc: phương tiện (icon) + chuỗi điểm đi, điểm dừng, điểm đến. */
function RouteDetails({
  origin,
  waypoints,
  destination,
  mode,
  departAt,
}: {
  origin: string;
  waypoints: string[];
  destination: string;
  mode: TravelMode | null;
  departAt: string | null;
}) {
  const { colors } = useTheme();
  if (!destination.trim()) {
    return (
      <Text variant="label" tone="secondary" style={styles.plain}>
        Chưa có lộ trình
      </Text>
    );
  }
  const stops: Stop[] = [
    {
      key: 'o',
      label: departAt ? `Xuất phát • ${formatDepart(departAt)}` : 'Xuất phát',
      name: origin.trim() || 'Vị trí hiện tại',
      tone: 'origin',
    },
    ...waypoints.map((w, i) => ({
      key: `w${i}`,
      label: `Điểm dừng ${i + 1}`,
      name: w,
      tone: 'via' as const,
    })),
    { key: 'd', label: 'Điểm đến', name: destination.trim(), tone: 'end' },
  ];
  const dotColor = (t: Stop['tone']) =>
    t === 'end' ? colors.accent : t === 'origin' ? colors.text : colors.textMuted;

  return (
    <View style={styles.details}>
      <View
        accessible
        accessibilityLabel={mode ? `Phương tiện: ${TRAVEL_MODE_LABEL[mode]}` : 'Chưa chọn phương tiện'}
        style={styles.modeRow}
      >
        {MODE_ORDER.map((m) => {
          const Icon = MODE_ICON[m];
          const active = m === mode;
          return (
            <View key={m} style={[styles.modeItem, active && { backgroundColor: colors.primary }]}>
              <Icon
                size={iconSize.control}
                color={active ? colors.onPrimary : colors.textSecondary}
                strokeWidth={iconStroke.normal}
                strokeLinecap="round"
              />
            </View>
          );
        })}
      </View>
      <View>
        {stops.map((s, i) => (
          <View key={s.key} style={styles.stop}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: dotColor(s.tone) }]} />
              {i < stops.length - 1 ? <View style={[styles.stem, { backgroundColor: colors.surfaceMuted }]} /> : null}
            </View>
            <View style={styles.stopText}>
              <Text variant="overline" tone="muted">
                {s.label}
              </Text>
              <Text variant="body" style={styles.stopName}>
                {s.name}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function RouteForm({
  event,
  initial,
  landscape,
  availableHeight,
  readOnly,
}: {
  event: DetailEvent;
  initial?: ParsedRoute;
  landscape: boolean;
  availableHeight: number;
  /** Mất mạng, đang xem bản lưu: chỉ xem, không lưu/xoá. */
  readOnly: boolean;
}) {
  const navigation = useNavigation<Nav>();
  const params = useRoute<Route>().params;
  const { tripId, mapId } = params;
  const view = params.view || readOnly;
  // Có mapId: lộ trình đó. Không có: thêm mới. `view`: chỉ xem, không lưu/xoá.
  const existing = mapId !== undefined ? event.event_maps.find(m => m.id === mapId) : undefined;
  const seq = existing?.seq ?? event.event_maps.reduce((max, m) => Math.max(max, m.seq), 0) + 1;

  const [link, setLink] = useState(initial?.link ?? '');
  const [origin, setOrigin] = useState(initial?.origin ?? existing?.origin_name ?? '');
  const [waypoints, setWaypoints] = useState<string[]>(initial?.waypoints ?? existing?.waypoints ?? []);
  const [destination, setDestination] = useState(initial?.destination ?? existing?.destination_name ?? '');
  const [mode, setMode] = useState<TravelMode | null>(initial?.mode ?? existing?.travel_mode ?? null);
  const [departAt, setDepartAt] = useState<string | null>(
    initial ? initial.departAt ?? null : existing?.depart_at ?? null,
  );
  const [reading, setReading] = useState(false);
  const [readFailed, setReadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [askDelete, setAskDelete] = useState(false);

  // App mở Google Maps bằng toạ độ đã lưu nên Google gửi lại "lat,lng"; đổi về tên đã lưu
  // nếu toạ độ trùng một điểm của các lộ trình trong mốc này.
  const nameOf = (s: string) => {
    const c = parseCoord(s);
    if (!c) {
      return s;
    }
    const hit = knownPoints(event.event_maps).find(
      k => Math.abs(k.lat - c.lat) < COORD_EPS && Math.abs(k.lng - c.lng) < COORD_EPS,
    );
    return hit ? hit.name : s;
  };

  const fill = (r: ParsedRoute) => {
    if (r.link) {
      setLink(r.link);
    }
    setOrigin(r.origin ? nameOf(r.origin) : '');
    setWaypoints(r.waypoints.map(nameOf));
    setDestination(nameOf(r.destination));
    setMode(r.mode);
    // Lộ trình gửi từ Google Maps phản ánh đúng thiết lập trong Maps: không có giờ = đi ngay.
    setDepartAt(r.departAt ?? null);
  };

  // Chỉ điền lại khi nhận lộ trình mới (initial đổi), không điền lại khi dữ liệu mốc tải lại.
  const fillRef = useRef(fill);
  fillRef.current = fill;
  useEffect(() => {
    if (initial) {
      fillRef.current(initial);
    }
  }, [initial]);

  // iOS chưa nhận được nút Chia sẻ: dán liên kết rồi đọc.
  const read = async () => {
    setReading(true);
    setReadFailed(false);
    try {
      const r = parseMapsLink(await resolveMapsLink(link));
      if (r) {
        fill(r);
      } else {
        setReadFailed(true);
      }
    } catch {
      setReadFailed(true);
    } finally {
      setReading(false);
    }
  };

  /**
   * Lộ trình hiện có. Toạ độ của mỗi điểm: tên là "lat,lng" thì lấy luôn; tên trùng một điểm
   * đã lưu (trong mốc) thì giữ toạ độ của điểm đó; còn lại để trống.
   */
  const coordOf = (name: string | null) => {
    if (!name) {
      return { lat: null, lng: null };
    }
    const c = parseCoord(name) ?? knownPoints(event.event_maps).find(k => k.name === name);
    return c ? { lat: c.lat, lng: c.lng } : { lat: null, lng: null };
  };

  const current = (): RouteInput => {
    const o = origin.trim() || null;
    const d = destination.trim();
    const oc = coordOf(o);
    const dc = coordOf(d);
    return {
      origin_name: o,
      origin_lat: oc.lat,
      origin_lng: oc.lng,
      destination_name: d,
      destination_lat: dc.lat,
      destination_lng: dc.lng,
      waypoints: waypoints.map(w => w.trim()).filter(Boolean),
      travel_mode: mode,
      depart_at: departAt,
    };
  };

  const backWith = (notice: string) =>
    navigation.popTo('EventDetail', { tripId, eventId: String(event.id), notice });

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (existing) {
        await replaceEventRoute(event.id, existing, current());
      } else {
        await addEventRoute(event.id, event.event_maps, current());
      }
      backWith('Đã lưu lộ trình');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Không lưu được lộ trình.');
      setSaving(false);
    }
  };

  const remove = async () => {
    setAskDelete(false);
    if (!existing) {
      return;
    }
    setSaving(true);
    try {
      await deleteEventRouteById(existing.id);
      backWith('Đã xoá lộ trình');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Không xoá được lộ trình.');
      setSaving(false);
    }
  };

  const hasDestination = destination.trim().length > 0;
  const showPaste = !view && Platform.OS === 'ios';

  const header = (
    <View style={styles.head}>
      <View style={styles.flex}>
        <Text variant="heading" accessibilityRole="header" style={styles.dialogTitle}>
          Lộ trình {String(seq).padStart(2, '0')}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {event.location_name}
        </Text>
      </View>
      <IconButton variant="ghost" accessibilityLabel="Đóng" onPress={() => navigation.goBack()} icon={renderClose} />
    </View>
  );

  const details = (
    <RouteDetails
      origin={origin}
      waypoints={waypoints}
      destination={destination}
      mode={mode}
      departAt={departAt}
    />
  );

  const controls = (
    <View style={styles.controls}>
      {view ? (
        <Button
          variant="secondary"
          size="md"
          title="Mở trong Google Maps"
          disabled={!hasDestination}
          onPress={() => {
            // Ghi nhớ lộ trình này: sửa trong Google Maps xong bấm Chia sẻ về app thì
            // ShareReceiver mở lại hộp thoại của chính lộ trình này để lưu đè.
            if (existing) {
              markRouteEdit(event.id, existing.id);
            }
            Linking.openURL(buildDirectionsUrl({ id: 0, seq, ...current() }, event.city));
          }}
        />
      ) : (
        <Button
          variant="secondary"
          size="md"
          title="Chọn trong Google Map"
          onPress={() => Linking.openURL(buildPickRouteUrl(event.location_name, event.city))}
        />
      )}
      {showPaste ? (
        <>
          <TextField
            label="Dán liên kết"
            value={link}
            onChangeText={setLink}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="https://maps.app.goo.gl/..."
          />
          <Button size="md" title="Đọc liên kết" onPress={read} loading={reading} disabled={!link.trim()} />
        </>
      ) : link ? (
        <Text
          variant="caption"
          tone="accent"
          numberOfLines={landscape ? 4 : 1}
          ellipsizeMode="middle"
          style={styles.underline}
          onPress={() => Linking.openURL(link)}
        >
          {link}
        </Text>
      ) : null}
      {readFailed ? <Alert kind="error" title="Không đọc được liên kết này." /> : null}
      {saveError ? <Alert kind="error" title={saveError} /> : null}
      {view ? null : (
        <>
          <Button title="Lưu lộ trình" onPress={save} loading={saving} disabled={!hasDestination} />
          {existing ? <TextLink label="Xoá lộ trình" danger onPress={() => setAskDelete(true)} /> : null}
        </>
      )}
    </View>
  );

  const dialog = (
    <Dialog
      visible={askDelete}
      title="Xoá lộ trình?"
      description="Nút Chỉ đường sẽ quay về tìm theo tên địa điểm."
      cancelLabel="Huỷ"
      confirmLabel="Xoá"
      destructive
      onCancel={() => setAskDelete(false)}
      onConfirm={remove}
    />
  );

  if (landscape) {
    // Hộp cao cố định theo vùng an toàn; hai cột tỉ lệ 1/2, mỗi cột tự cuộn.
    return (
      <View style={[styles.box, { height: availableHeight }]}>
        {header}
        <View style={styles.cols}>
          <ScrollView
            style={styles.colA}
            contentContainerStyle={styles.colBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {controls}
          </ScrollView>
          <ScrollView style={styles.colB} contentContainerStyle={styles.colBody} showsVerticalScrollIndicator={false}>
            {details}
          </ScrollView>
        </View>
        {dialog}
      </View>
    );
  }

  // Dọc: thông tin chi tiết cuộn ở trên; nút Google Maps + liên kết cố định (sticky) ở dưới.
  return (
    <View style={[styles.box, { maxHeight: availableHeight }]}>
      {header}
      <ScrollView style={styles.shrink} contentContainerStyle={styles.colBody} showsVerticalScrollIndicator={false}>
        {details}
      </ScrollView>
      <ScrollView
        style={styles.sticky}
        contentContainerStyle={styles.stickyBody}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {controls}
      </ScrollView>
      {dialog}
    </View>
  );
}

/**
 * Xem / Thêm / Sửa lộ trình dạng hộp thoại: màn được khai báo `transparentModal` trong HomeStack
 * nên màn chi tiết mốc vẫn hiện mờ phía sau. Hộp nằm trong vùng an toàn, không đè thanh trạng
 * thái (giờ, pin, thông báo). Chạm vùng phủ mờ hoặc nút X để đóng.
 */
export function RouteEditScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const { tripId, eventId, route } = useRoute<Route>().params;
  const load = useCallback(() => fetchTripDetail(Number(tripId)), [tripId]);
  const { data, loading, error, reload, cachedAt } = useAsync(load);
  const event = data?.timeline_events.find(e => e.id === Number(eventId));
  const availableHeight = Math.max(240, height - insets.top - insets.bottom - 24);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.scrim,
        {
          backgroundColor: colors.overlay,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 12,
          paddingLeft: insets.left + GUTTER,
          paddingRight: insets.right + GUTTER,
        },
      ]}
    >
      <Pressable accessibilityLabel="Đóng hộp thoại" style={StyleSheet.absoluteFill} onPress={() => navigation.goBack()} />
      <View
        accessibilityViewIsModal
        style={[styles.shell, { backgroundColor: colors.surface, maxHeight: availableHeight }]}
      >
        {event ? (
          <RouteForm
            event={event}
            initial={route}
            landscape={landscape}
            availableHeight={availableHeight}
            readOnly={cachedAt !== null}
          />
        ) : (
          <View style={styles.colBody}>
            {loading ? (
              <Skeleton height={240} borderRadius={radius.card} />
            ) : (
              <ErrorState message={error ?? 'Không tìm thấy mốc này.'} onRetry={reload} />
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shrink: { flexGrow: 0, flexShrink: 1 },
  scrim: { flex: 1, justifyContent: 'center' },
  shell: { borderRadius: radius.sheet, overflow: 'hidden' },
  box: { overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: GUTTER, paddingRight: 12, paddingTop: 16 },
  dialogTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  cols: { flex: 1, flexDirection: 'row' },
  colA: { flex: 1 },
  colB: { flex: 2 },
  colBody: { padding: GUTTER, gap: 12 },
  sticky: { flexGrow: 0, flexShrink: 0, maxHeight: 280 },
  stickyBody: { paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: GUTTER },
  controls: { gap: 12 },
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
  plain: { fontWeight: '400' },
  details: { gap: 16 },
  modeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modeItem: { width: 72, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  stop: { flexDirection: 'row', gap: 12, minHeight: 52 },
  rail: { width: DOT, alignItems: 'center', paddingTop: 4 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  stem: { width: 2, flex: 1, marginVertical: 4 },
  stopText: { flex: 1, paddingBottom: 12 },
  stopName: { fontWeight: '600' },
});

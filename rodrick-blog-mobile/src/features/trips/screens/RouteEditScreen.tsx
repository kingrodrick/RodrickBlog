import React, { useCallback, useEffect, useState } from 'react';
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
import { X } from 'lucide-react-native';
import {
  Alert,
  Button,
  Dialog,
  ErrorState,
  IconButton,
  Segmented,
  Skeleton,
  Text,
  TextField,
} from '../../../shared/ui';
import { useAsync } from '../../../shared/hooks/useAsync';
import { iconSize, iconStroke, radius, useTheme } from '../../../theme';
import { HomeStackParamList } from '../../../navigation/type';
import { fetchTripDetail } from '../api/tripDetail';
import { addEventRoute, deleteEventRouteById, replaceEventRoute, RouteInput } from '../api/routeApi';
import { buildDirectionsUrl, buildPickRouteUrl } from '../maps';
import { ParsedRoute, parseMapsLink, resolveMapsLink } from '../parseMapsLink';
import { DetailEvent, TravelMode } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'RouteEdit'>;
type Route = RouteProp<HomeStackParamList, 'RouteEdit'>;

const renderClose = (c: string) => (
  <X color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />
);

type ModeValue = TravelMode | '';
const MODE_OPTIONS: { value: ModeValue; label: string }[] = [
  { value: 'driving', label: 'Ô tô' },
  { value: 'walking', label: 'Đi bộ' },
  { value: 'bicycling', label: 'Xe đạp' },
  { value: 'transit', label: 'Công cộng' },
];

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

function Section({ title, meta }: { title: string; meta?: string }) {
  return (
    <View style={styles.sec}>
      <Text variant="overline" tone="muted">
        {title}
      </Text>
      {meta ? (
        <Text variant="overline" tone="muted">
          {meta}
        </Text>
      ) : null}
    </View>
  );
}

function RouteForm({ event, initial }: { event: DetailEvent; initial?: ParsedRoute }) {
  const navigation = useNavigation<Nav>();
  const { tripId, mapId } = useRoute<Route>().params;
  // Có mapId: sửa lộ trình đó. Không có: thêm mới.
  const existing = mapId !== undefined ? event.event_maps.find(m => m.id === mapId) : undefined;

  const [link, setLink] = useState(initial?.link ?? '');
  const [origin, setOrigin] = useState(initial?.origin ?? existing?.origin_name ?? '');
  const [waypoints, setWaypoints] = useState<string[]>(initial?.waypoints ?? existing?.waypoints ?? []);
  const [destination, setDestination] = useState(initial?.destination ?? existing?.destination_name ?? '');
  const [mode, setMode] = useState<ModeValue>(initial?.mode ?? existing?.travel_mode ?? '');
  const [readCount, setReadCount] = useState<number | null>(null);
  const [reading, setReading] = useState(false);
  const [readFailed, setReadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [askDelete, setAskDelete] = useState(false);

  const fill = (r: ParsedRoute) => {
    if (r.link) {
      setLink(r.link);
    }
    setOrigin(r.origin ?? '');
    setWaypoints(r.waypoints);
    setDestination(r.destination);
    setMode(r.mode ?? '');
    setReadCount((r.origin ? 1 : 0) + r.waypoints.length + 1);
  };

  useEffect(() => {
    if (initial) {
      fill(initial);
    }
  }, [initial]);

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

  /** Lộ trình từ các ô; điểm giữ nguyên tên so với bản cũ thì giữ luôn toạ độ của nó. */
  const current = (): RouteInput => {
    const o = origin.trim() || null;
    const d = destination.trim();
    const sameO = !!o && o === existing?.origin_name;
    const sameD = d === existing?.destination_name;
    return {
      origin_name: o,
      origin_lat: sameO ? existing.origin_lat : null,
      origin_lng: sameO ? existing.origin_lng : null,
      destination_name: d,
      destination_lat: sameD ? existing.destination_lat : null,
      destination_lng: sameD ? existing.destination_lng : null,
      waypoints: waypoints.map(w => w.trim()).filter(Boolean),
      travel_mode: mode || null,
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

  const tryInMaps = () =>
    Linking.openURL(buildDirectionsUrl({ id: 0, seq: 1, ...current() }, event.city));

  const hasDestination = destination.trim().length > 0;

  return (
    <>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text variant="heading" accessibilityRole="header" style={styles.dialogTitle}>
            {existing ? 'Sửa lộ trình' : 'Thêm lộ trình'}
          </Text>
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {event.location_name}
          </Text>
        </View>
        <IconButton variant="ghost" accessibilityLabel="Đóng" onPress={() => navigation.goBack()} icon={renderClose} />
      </View>

      <Section title="Lấy lộ trình từ Google Maps" />
      <View style={styles.steps}>
        {(Platform.OS === 'android'
          ? [
              'Mở Google Maps, chọn điểm đi, điểm đến và phương tiện.',
              'Bấm Chia sẻ, chọn ứng dụng này. Các ô sẽ tự điền.',
            ]
          : [
              'Mở Google Maps, chọn điểm đi, điểm đến và phương tiện.',
              'Bấm Chia sẻ, chọn Sao chép liên kết.',
              'Quay lại đây, dán vào ô bên dưới.',
            ]
        ).map((s, i) => (
          <Text key={s} tone="secondary">
            {i + 1}. {s}
          </Text>
        ))}
      </View>
      <Button
        variant="secondary"
        size="md"
        title="Mở Google Maps"
        onPress={() => Linking.openURL(buildPickRouteUrl(event.location_name, event.city))}
      />

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
      {readFailed ? (
        <Alert kind="error" title="Không đọc được liên kết này." description="Hãy nhập tay các ô bên dưới." />
      ) : null}

      <Section title="Lộ trình đọc được" meta={readCount ? `${readCount} điểm` : 'chưa có'} />
      <TextField label="Xuất phát" value={origin} onChangeText={setOrigin} placeholder="Để trống: vị trí hiện tại" />
      {waypoints.map((w, i) => (
        <View key={i} style={styles.waypoint}>
          <View style={styles.flex}>
            <TextField
              label={`Điểm dừng ${i + 1}`}
              value={w}
              onChangeText={t => setWaypoints(ws => ws.map((x, j) => (j === i ? t : x)))}
            />
          </View>
          <TextLink label="Bỏ" danger onPress={() => setWaypoints(ws => ws.filter((_, j) => j !== i))} />
        </View>
      ))}
      <TextLink label="Thêm điểm dừng" onPress={() => setWaypoints(ws => [...ws, ''])} />
      <TextField label="Điểm đến" value={destination} onChangeText={setDestination} />

      <View style={styles.field}>
        <Text variant="label">Phương tiện</Text>
        {/* Bấm lại mục đang chọn để bỏ chọn (lưu null). */}
        <Segmented<ModeValue>
          options={MODE_OPTIONS}
          value={mode}
          onChange={v => setMode(cur => (cur === v ? '' : v))}
        />
      </View>

      {saveError ? <Alert kind="error" title={saveError} /> : null}

      <View style={styles.actions}>
        <Button variant="secondary" size="md" title="Mở thử trong Google Maps" onPress={tryInMaps} disabled={!hasDestination} />
        <Button title="Lưu lộ trình" onPress={save} loading={saving} disabled={!hasDestination} />
        {existing ? <TextLink label="Xoá lộ trình" danger onPress={() => setAskDelete(true)} /> : null}
      </View>
      <Text variant="caption" tone="muted" style={styles.hint}>
        Link không đọc được thì nhập tay các ô trên.
      </Text>

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
    </>
  );
}

/**
 * Thêm/Sửa lộ trình dạng hộp thoại: màn được khai báo `transparentModal` trong HomeStack nên
 * màn chi tiết mốc vẫn hiện mờ phía sau. Chạm vùng phủ mờ hoặc nút X để đóng.
 */
export function RouteEditScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const { tripId, eventId, route } = useRoute<Route>().params;
  const load = useCallback(() => fetchTripDetail(Number(tripId)), [tripId]);
  const { data, loading, error, reload } = useAsync(load);
  const event = data?.timeline_events.find(e => e.id === Number(eventId));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.scrim, { backgroundColor: colors.overlay }]}
    >
      <Pressable accessibilityLabel="Đóng hộp thoại" style={StyleSheet.absoluteFill} onPress={() => navigation.goBack()} />
      <View accessibilityViewIsModal style={[styles.box, { backgroundColor: colors.surface, maxHeight: height * 0.88 }]}>
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {event ? (
            <RouteForm event={event} initial={route} />
          ) : loading ? (
            <Skeleton height={320} borderRadius={radius.card} />
          ) : (
            <ErrorState message={error ?? 'Không tìm thấy mốc này.'} onRetry={reload} />
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrim: { flex: 1, justifyContent: 'center', padding: 20 },
  box: { borderRadius: radius.sheet, overflow: 'hidden' },
  body: { padding: 20, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: -8 },
  dialogTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  sec: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  steps: { gap: 4 },
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
  waypoint: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  field: { gap: 6 },
  actions: { gap: 12, marginTop: 8 },
  hint: { textAlign: 'center' },
});

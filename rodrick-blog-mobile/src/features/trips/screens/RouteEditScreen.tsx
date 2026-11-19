import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import {
  Alert,
  Button,
  Dialog,
  ErrorState,
  IconButton,
  Screen,
  Segmented,
  Skeleton,
  Text,
  TextField,
} from '../../../shared/ui';
import { useAsync } from '../../../shared/hooks/useAsync';
import { iconSize, iconStroke, radius } from '../../../theme';
import { HomeStackParamList } from '../../../navigation/type';
import { fetchTripDetail } from '../api/tripDetail';
import { deleteEventRoute, RouteInput, saveEventRoute } from '../api/routeApi';
import { buildDirectionsUrl } from '../maps';
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
  const { tripId } = useRoute<Route>().params;
  const existing = event.event_maps[0];

  const [link, setLink] = useState('');
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
      await saveEventRoute(event.id, current());
      backWith('Đã lưu lộ trình');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Không lưu được lộ trình.');
      setSaving(false);
    }
  };

  const remove = async () => {
    setAskDelete(false);
    setSaving(true);
    try {
      await deleteEventRoute(event.id);
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
        <Text variant="title" accessibilityRole="header">
          Sửa lộ trình
        </Text>
        <Text variant="body" tone="secondary">
          {event.location_name}
        </Text>
      </View>

      <Section title="Lấy lộ trình từ Google Maps" />
      <View style={styles.steps}>
        {[
          'Mở Google Maps, chọn điểm đi, điểm đến và phương tiện.',
          'Bấm Chia sẻ, chọn Sao chép liên kết.',
          'Quay lại đây, dán vào ô bên dưới.',
        ].map((s, i) => (
          <Text key={s} tone="secondary">
            {i + 1}. {s}
          </Text>
        ))}
      </View>
      <Button
        variant="secondary"
        size="md"
        title="Mở Google Maps"
        onPress={() => Linking.openURL('https://www.google.com/maps')}
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

export function RouteEditScreen() {
  const navigation = useNavigation<Nav>();
  const { tripId, eventId, route } = useRoute<Route>().params;
  const load = useCallback(() => fetchTripDetail(Number(tripId)), [tripId]);
  const { data, loading, error, reload } = useAsync(load);
  const event = data?.timeline_events.find(e => e.id === Number(eventId));

  return (
    <Screen
      headerLeft={
        <IconButton accessibilityLabel="Đóng" onPress={() => navigation.goBack()} icon={renderClose} />
      }
    >
      {event ? (
        <RouteForm event={event} initial={route} />
      ) : loading ? (
        <Skeleton height={320} borderRadius={radius.card} />
      ) : (
        <ErrorState message={error ?? 'Không tìm thấy mốc này.'} onRetry={reload} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { gap: 4 },
  sec: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  steps: { gap: 4 },
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
  waypoint: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  field: { gap: 6 },
  actions: { gap: 12, marginTop: 8 },
  hint: { textAlign: 'center' },
});

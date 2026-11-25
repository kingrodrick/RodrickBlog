import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  ArrowRight,
  Bike,
  Car,
  PersonStanding,
  Route as RouteIcon,
  Trash2,
  TrainFront,
} from 'lucide-react-native';
import { Text } from '../../../shared/ui';
import { iconSize, iconStroke, layout, radius, useTheme } from '../../../theme';
import { buildPickRouteUrl, TRAVEL_MODE_LABEL } from '../maps';
import { DetailEvent, EventMap, TravelMode } from '../types';
import { clearRouteEdit } from '../pendingRouteEdit';

export const MODE_ICON = {
  walking: PersonStanding,
  driving: Car,
  bicycling: Bike,
  transit: TrainFront,
} as const;

const ACTION = 44;
const GAP = 6;
const PANEL = ACTION;
const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
const DANGER_BG = '#a3161f';

type RowProps = {
  map: EventMap;
  open: boolean;
  onToggle: () => void;
  /** Mở hộp thoại chi tiết lộ trình. */
  onOpen: () => void;
  onDelete: () => void;
};

/** Một lộ trình: thẻ thấp một dòng; chạm để xem chi tiết, nhấn giữ thì trượt ra nút xoá. */
function RouteRow({ map, open, onToggle, onOpen, onDelete }: RowProps) {
  const { colors } = useTheme();
  const p = useRef(new Animated.Value(0)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    Animated.timing(p, {
      toValue: open ? 1 : 0,
      duration: 280,
      easing: EASE,
      useNativeDriver: false,
    }).start();
  }, [open, p]);

  const mode: TravelMode | null = map.travel_mode;
  const Mode = mode ? MODE_ICON[mode] : RouteIcon;
  const origin = map.origin_name || 'Vị trí hiện tại';
  const label = `${origin} đến ${map.destination_name}${
    mode ? `, ${TRAVEL_MODE_LABEL[mode]}` : ''
  }`;

  return (
    // Cụm nút ghim tuyệt đối ở mép phải hàng; thẻ chừa lề phải bằng đúng cụm nút nên cụm nút
    // không bao giờ bị đẩy ra ngoài màn (tên địa điểm dài, màn dọc hẹp).
    <View style={styles.row}>
      <Animated.View
        style={[
          styles.cardWrap,
          {
            marginRight: p.interpolate({
              inputRange: [0, 1],
              outputRange: [0, PANEL + 8],
            }),
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={
            open
              ? 'Chạm để đóng nút xoá'
              : 'Chạm để xem chi tiết, nhấn giữ để xoá'
          }
          delayLongPress={450}
          onLongPress={onToggle}
          onPress={open ? onToggle : onOpen}
          style={[styles.card, { backgroundColor: colors.surface }]}
        >
          <Mode
            size={iconSize.control}
            color={colors.textSecondary}
            strokeWidth={iconStroke.normal}
            strokeLinecap="round"
          />
          <View style={styles.line}>
            <Text
              variant="label"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.end}
            >
              {origin}
            </Text>
            <ArrowRight
              size={14}
              color={colors.textMuted}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Text
              variant="label"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.end}
            >
              {map.destination_name}
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.panel,
          {
            opacity: p,
            transform: [
              {
                translateX: p.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xoá lộ trình"
          onPress={onDelete}
          style={[styles.action, { backgroundColor: DANGER_BG }]}
        >
          <Trash2
            size={iconSize.control}
            color="#ffffff"
            strokeWidth={iconStroke.normal}
            strokeLinecap="round"
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

type Props = {
  event: DetailEvent;
  /** Mốc không phải chuyến bay: Google Maps mở sẵn điểm đến là tên địa điểm của mốc. */
  presetDestination: boolean;
  /** Mở màn Thêm lộ trình (dán liên kết tay), dùng trên iOS. */
  onAdd: () => void;
  /** Mở hộp thoại chi tiết lộ trình; từ đó bấm "Mở trong Google Maps". */
  onView: (m: EventMap) => void;
  onDelete: (m: EventMap) => void;
  /** Mất mạng: ẩn nút thêm, nhấn giữ không mở nút xoá; chạm vẫn xem chi tiết. */
  readOnly?: boolean;
};

/** Mục "Lộ trình": danh sách các lộ trình của mốc (1-n) + nút thêm ở cuối. */
export function RouteList({ event, presetDestination, onAdd, onView, onDelete, readOnly }: Props) {
  const { colors } = useTheme();
  const maps = event.event_maps;
  const [openId, setOpenId] = useState<number | null>(null);

  // Lộ trình đang mở bị xoá/tải lại mất thì tự đóng.
  useEffect(() => {
    if (openId !== null && !maps.some(m => m.id === openId)) {
      setOpenId(null);
    }
  }, [maps, openId]);

  return (
    <View>
      <View style={styles.sec}>
        <Text variant="overline" tone="muted" numberOfLines={1} style={styles.rowLabel}>
          Lộ trình
        </Text>
        <Text variant="overline" tone="muted">
          {maps.length}
        </Text>
      </View>

      {maps.length ? (
        <View style={styles.list}>
          {maps.map(m => (
            <RouteRow
              key={m.id}
              map={m}
              open={openId === m.id}
              onToggle={() =>
                readOnly ? undefined : setOpenId(cur => (cur === m.id ? null : m.id))
              }
              onOpen={() => onView(m)}
              onDelete={() => onDelete(m)}
            />
          ))}
        </View>
      ) : (
        <Text variant="label" tone="secondary" style={styles.none}>
          Chưa có lộ trình
        </Text>
      )}

      {/*
        Android: mở thẳng Google Maps; chọn xong đường, bấm Chia sẻ rồi chọn app này thì
        ShareReceiver mở màn Thêm lộ trình đã điền sẵn. iOS chưa nhận được Chia sẻ nên vào màn
        Thêm lộ trình để dán liên kết.
      */}
      {readOnly ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityHint={
            Platform.OS === 'android'
              ? 'Mở Google Maps. Chọn xong đường đi, bấm Chia sẻ rồi chọn ứng dụng này'
              : undefined
          }
          onPress={() => {
            if (Platform.OS !== 'android') {
              onAdd();
              return;
            }
            // Thêm mới: bỏ lộ trình đang chờ sửa (nếu có) để Chia sẻ về sẽ tạo lộ trình mới.
            clearRouteEdit();
            Linking.openURL(
              presetDestination ? buildPickRouteUrl(event.location_name, event.city) : buildPickRouteUrl(),
            );
          }}
          style={[styles.add, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text style={styles.addText}>Thêm lộ trình</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sec: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowLabel: { flex: 1 },
  list: { gap: 8 },
  none: { fontWeight: '400', paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardWrap: { flex: 1, minWidth: 0 },
  card: {
    minHeight: layout.minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.card,
  },
  line: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  end: { flexShrink: 1 },
  panel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: PANEL,
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
  },
  action: {
    width: ACTION,
    height: ACTION,
    borderRadius: ACTION / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    height: 48,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addText: { fontSize: 16, lineHeight: 16, fontWeight: '600' },
});

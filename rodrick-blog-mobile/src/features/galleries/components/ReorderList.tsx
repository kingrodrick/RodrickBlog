import React, { useRef, useState } from 'react';
import { Animated, PanResponder, ScrollView, StyleSheet, View } from 'react-native';
import { GripVertical } from 'lucide-react-native';
import { Text } from '../../../shared/ui';
import { iconSize, iconStroke, layout, radius, useTheme } from '../../../theme';
import { Collection } from '../types';

/** Dòng gọn cố định để tính vị trí khi kéo: cao 64, khe 8. */
const ROW = 64;
const GAP = 8;
const STEP = ROW + GAP;

/** Đưa phần tử ở `from` sang vị trí `to`, các phần tử giữa dồn lại. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

type Drag = { from: number; to: number } | null;

type RowProps = {
  item: Collection;
  index: number;
  count: number;
  drag: Drag;
  dragY: Animated.Value;
  onStart: (index: number) => void;
  onHover: (to: number) => void;
  onEnd: () => void;
};

function Row({ item, index, count, drag, dragY, onStart, onHover, onEnd }: RowProps) {
  const { colors } = useTheme();
  // PanResponder tạo một lần; đọc giá trị mới nhất qua ref.
  const latest = useRef({ index, count, onStart, onHover, onEnd });
  latest.current = { index, count, onStart, onHover, onEnd };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Không nhường cử chỉ cho ScrollView khi đang kéo.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => latest.current.onStart(latest.current.index),
      onPanResponderMove: (_, g) => {
        dragY.setValue(g.dy);
        const { index: i, count: n } = latest.current;
        latest.current.onHover(Math.max(0, Math.min(n - 1, i + Math.round(g.dy / STEP))));
      },
      onPanResponderRelease: () => latest.current.onEnd(),
      onPanResponderTerminate: () => latest.current.onEnd(),
    }),
  ).current;

  const dragging = drag?.from === index;
  // Các dòng nằm giữa chỗ cũ và chỗ mới dịch một bước để chừa chỗ.
  let shift = 0;
  if (drag && !dragging) {
    if (drag.from < index && index <= drag.to) {
      shift = -STEP;
    } else if (drag.to <= index && index < drag.from) {
      shift = STEP;
    }
  }

  return (
    <Animated.View
      style={[
        styles.row,
        {
          backgroundColor: dragging ? colors.surfaceRaised : colors.surface,
          transform: [{ translateY: dragging ? dragY : shift }],
        },
        dragging ? styles.lifted : null,
      ]}
    >
      <View style={styles.text}>
        <Text variant="label" numberOfLines={1}>
          {item.title}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {item.photoCount ? `${item.photoCount} ảnh` : 'Chưa có ảnh'}
        </Text>
      </View>
      <View
        {...responder.panHandlers}
        accessibilityLabel={`Kéo để đổi vị trí ${item.title}`}
        style={styles.handle}
      >
        <GripVertical
          color={colors.textSecondary}
          size={iconSize.control}
          strokeWidth={iconStroke.normal}
          strokeLinecap="round"
        />
      </View>
    </Animated.View>
  );
}

type Props = {
  collections: Collection[];
  onChange: (collections: Collection[]) => void;
};

/** Sắp thứ tự bộ sưu tập bằng kéo thả: giữ tay cầm bên phải mỗi dòng rồi kéo lên/xuống. */
export function ReorderList({ collections, onChange }: Props) {
  const [drag, setDrag] = useState<Drag>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  // Giữ bản mới nhất để onEnd (gọi từ PanResponder) không đọc state cũ.
  const dragRef = useRef<Drag>(null);

  const start = (from: number) => {
    dragY.setValue(0);
    dragRef.current = { from, to: from };
    setDrag(dragRef.current);
  };
  const hover = (to: number) => {
    const cur = dragRef.current;
    if (cur && cur.to !== to) {
      dragRef.current = { ...cur, to };
      setDrag(dragRef.current);
    }
  };
  const end = () => {
    const cur = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    dragY.setValue(0);
    if (cur && cur.from !== cur.to) {
      onChange(moveItem(collections, cur.from, cur.to));
    }
  };

  return (
    <ScrollView
      scrollEnabled={drag === null}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="caption" tone="secondary">
        Giữ tay cầm bên phải rồi kéo lên, xuống để đổi thứ tự.
      </Text>
      {collections.map((c, i) => (
        <Row
          key={c.id}
          item={c}
          index={i}
          count={collections.length}
          drag={drag}
          dragY={dragY}
          onStart={start}
          onHover={hover}
          onEnd={end}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { gap: GAP, paddingBottom: 24 },
  row: {
    height: ROW,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: layout.cardPadding,
  },
  // Dòng đang kéo nằm trên các dòng khác (không bóng, nổi bằng bước tông màu).
  lifted: { zIndex: 1 },
  text: { flex: 1, gap: 2 },
  handle: {
    width: ROW,
    height: ROW,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

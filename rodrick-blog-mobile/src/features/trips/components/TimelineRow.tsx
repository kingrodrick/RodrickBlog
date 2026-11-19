import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ArrowDown } from 'lucide-react-native';
import { Card, Text } from '../../../shared/ui';
import { iconSize, layout, useTheme } from '../../../theme';
import { EVENT_TYPE_LABEL, eventTimes, eventType } from '../eventCategory';
import { DetailEvent } from '../types';

const ROW_GAP = layout.cardGap;
const DOT = 12;
const RAIL_W = 20;

type Props = {
  event: DetailEvent;
  first: boolean;
  last: boolean;
  onPress: () => void;
};

/**
 * Một dòng timeline: cột giờ | đường dọc + chấm | thẻ event.
 * Mỗi dòng tự vẽ đoạn đường của mình (nửa trên, nửa dưới, kéo qua khe giữa hai thẻ);
 * dòng đầu bỏ nửa trên, dòng cuối bỏ nửa dưới, nên đường bắt đầu và kết thúc đúng tâm chấm.
 */
export function TimelineRow({ event, first, last, onPress }: Props) {
  const { colors } = useTheme();
  const { start, end } = eventTimes(event);
  const type = eventType(event.category_tag);
  const dotColor = colors.eventType[type];

  return (
    <View style={[styles.row, !last && styles.rowGap]}>
      <View style={styles.time}>
        <Text variant="label" style={styles.tabular} numberOfLines={2}>
          {start}
        </Text>
        {end ? (
          <>
            <ArrowDown
              size={iconSize.inline}
              color={colors.textMuted}
              strokeWidth={2}
              strokeLinecap="round"
              style={styles.arrow}
            />
            <Text variant="label" style={styles.tabular}>
              {end}
            </Text>
          </>
        ) : null}
      </View>

      <View style={styles.rail}>
        <View
          style={[
            styles.line,
            { backgroundColor: colors.surfaceMuted },
            first ? styles.lineFromMid : styles.lineFromTop,
            last ? styles.lineToMid : styles.lineToNext,
          ]}
        />
        {/* Chấm có vòng màu nền để tách khỏi đường dọc */}
        <View style={[styles.dotRing, { backgroundColor: colors.background }]}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        </View>
      </View>

      <Card onPress={onPress} accessibilityLabel={event.location_name} style={styles.card}>
        <Text variant="overline" style={{ color: dotColor }}>
          {EVENT_TYPE_LABEL[type]}
        </Text>
        <Text variant="heading" style={styles.name}>
          {event.location_name}
        </Text>
        {event.city ? (
          <Text variant="caption" tone="secondary">
            {event.city}
          </Text>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  rowGap: { marginBottom: ROW_GAP },
  time: { width: 48, alignItems: 'center', justifyContent: 'center' },
  tabular: { fontVariant: ['tabular-nums'], textAlign: 'center' },
  arrow: { marginVertical: 2 },
  rail: { width: RAIL_W, alignItems: 'center', justifyContent: 'center' },
  line: { position: 'absolute', width: 2, left: RAIL_W / 2 - 1 },
  lineFromTop: { top: 0 },
  lineFromMid: { top: '50%' },
  lineToNext: { bottom: -ROW_GAP },
  lineToMid: { bottom: '50%' },
  dotRing: {
    width: DOT + 8,
    height: DOT + 8,
    borderRadius: (DOT + 8) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  card: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 16, lineHeight: 22 },
});

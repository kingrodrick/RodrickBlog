import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, ScrollViewInstance, StyleSheet } from 'react-native';
import { Text } from '../../../shared/ui';
import { layout, radius, useTheme } from '../../../theme';
import { dayChip, dayTitle } from '../dayFormat';

const CHIP_W = 52;
const GAP = 8;

type Props = {
  days: string[];
  selected: string;
  onSelect: (day: string) => void;
};

/** Dải ngày cuộn ngang, chip 52 x 60; ngày chọn đảo màu nút chính và tự cuộn vào giữa. */
export function DayStrip({ days, selected, onSelect }: Props) {
  const { colors } = useTheme();
  const ref = useRef<ScrollViewInstance>(null);
  const [width, setWidth] = useState(0);
  const index = days.indexOf(selected);

  useEffect(() => {
    if (!width || index < 0) {
      return;
    }
    const center = layout.screenMargin + index * (CHIP_W + GAP) + CHIP_W / 2;
    ref.current?.scrollTo({ x: Math.max(0, center - width / 2), animated: true });
  }, [index, width]);

  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      style={styles.strip}
      contentContainerStyle={styles.content}
    >
      {days.map(day => {
        const on = day === selected;
        const { weekday, day: num } = dayChip(day);
        const fg = on ? colors.onPrimary : colors.text;
        return (
          <Pressable
            key={day}
            accessibilityRole="button"
            accessibilityLabel={dayTitle(day)}
            accessibilityState={{ selected: on }}
            onPress={() => onSelect(day)}
            style={[styles.chip, { backgroundColor: on ? colors.primary : colors.surface }]}
          >
            <Text
              variant="overline"
              style={[{ color: on ? colors.onPrimary : colors.textMuted }, on && styles.dim]}
            >
              {weekday}
            </Text>
            <Text variant="title" style={[styles.num, { color: fg }]}>
              {num}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { flexGrow: 0 },
  content: { paddingHorizontal: layout.screenMargin, paddingTop: 4, paddingBottom: 12, gap: GAP },
  chip: {
    width: CHIP_W,
    height: 60,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  num: { fontSize: 22, lineHeight: 26 },
  dim: { opacity: 0.75 },
});

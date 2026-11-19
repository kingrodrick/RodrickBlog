import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polygon, Rect } from 'react-native-svg';
import { Text } from '../../../shared/ui';
import { radius, ThemeMode, useTheme } from '../../../theme';

/** Màu cố định của ô xem trước, không đổi theo giao diện đang dùng. */
const LIGHT_BG = '#ffffff';
const LIGHT_TEXT = '#1f1b19';
const DARK_BG = '#171412';
const DARK_TEXT = '#f7f6f3';
const SYSTEM_TAG = '#b61c25';

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Theo máy' },
  { value: 'light', label: 'Sáng' },
  { value: 'dark', label: 'Tối' },
];

function Swatch({ mode, label }: { mode: ThemeMode; label: string }) {
  if (mode === 'system') {
    return (
      <>
        <Svg
          style={StyleSheet.absoluteFill}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <Rect x="0" y="0" width="100" height="100" fill={DARK_BG} />
          <Polygon points="0,0 60,0 40,100 0,100" fill={LIGHT_BG} />
        </Svg>
        <View style={styles.tag}>
          <Text variant="label" style={styles.tagText}>
            {label}
          </Text>
        </View>
      </>
    );
  }
  return (
    <Text
      variant="label"
      style={mode === 'light' ? styles.lightText : styles.darkText}
    >
      {label}
    </Text>
  );
}

/** Ba ô chọn giao diện; ô đang chọn có khung màu nhấn bao ngoài. */
export function ThemePicker() {
  const { colors, isDark, mode, setMode } = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={styles.row}>
      {OPTIONS.map(o => {
        const selected = o.value === mode;
        return (
          // Khung ngoài luôn đệm 3 để ô không đổi kích thước khi đổi trạng thái.
          <View
            key={o.value}
            style={[
              styles.frame,
              selected && { backgroundColor: colors.accent },
            ]}
          >
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={o.label}
              onPress={() => setMode(o.value)}
              style={[
                styles.tile,
                o.value === 'light' && styles.lightBg,
                o.value === 'dark' && styles.darkBg,
                !selected && !isDark && styles.dimmed,
              ]}
            >
              <Swatch mode={o.value} label={o.label} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const FRAME = 3;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  frame: {
    flex: 1,
    padding: FRAME,
    borderRadius: radius.card + FRAME,
    backgroundColor: 'transparent',
  },
  tile: {
    height: 88,
    borderRadius: radius.card,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightBg: { backgroundColor: LIGHT_BG },
  darkBg: { backgroundColor: DARK_BG },
  dimmed: { opacity: 0.5 },
  lightText: { color: LIGHT_TEXT },
  darkText: { color: DARK_TEXT },
  tag: {
    backgroundColor: SYSTEM_TAG,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.label,
  },
  tagText: { color: '#ffffff' },
});

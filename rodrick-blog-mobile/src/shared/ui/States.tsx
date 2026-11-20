import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { iconSize, useTheme } from '../../theme';
import { Button } from './Button';
import { Text } from './Text';

/**
 * Vòng ensō vẽ như một nét cọ: đặt cọ đậm ở trên bên phải, đi theo chiều kim đồng hồ,
 * mảnh dần thành đuôi khô và chừa khe hở. Hình tính một lần (khung 32x32), tô màu chữ mờ.
 */
function ensoPath(): string {
  const C = 16;
  const R = 12;
  const N = 72;
  const start = (-70 * Math.PI) / 180;
  const sweep = (322 * Math.PI) / 180;
  const maxW = 3.6;
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const a = start + sweep * u;
    const press = Math.min(1, u / 0.07) ** 0.5; // đặt cọ: phình nhanh
    const lift = 0.5 + 0.5 * Math.cos(Math.PI * u ** 1.4); // nhấc cọ: mảnh dần
    const w = maxW * press * (0.12 + 0.88 * lift);
    const r = R + 0.35 * Math.sin(u * Math.PI * 3); // tay vẽ, không tròn tuyệt đối
    const pt = (rr: number) => {
      const x = (C + rr * Math.cos(a)).toFixed(2);
      const y = (C + rr * Math.sin(a)).toFixed(2);
      return `${x} ${y}`;
    };
    outer.push(pt(r + w / 2));
    inner.unshift(pt(r - w / 2));
  }
  return `M${[...outer, ...inner].join(' L')} Z`;
}

const ENSO_PATH = ensoPath();

function Enso() {
  const { colors } = useTheme();
  return (
    <Svg width={iconSize.empty} height={iconSize.empty} viewBox="0 0 32 32">
      <Path d={ENSO_PATH} fill={colors.textMuted} />
    </Svg>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.wrap}>
      <Enso />
      <Text tone="secondary" style={styles.msg}>
        {message}
      </Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Thử lại',
}: {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text tone="secondary" style={styles.msg}>
        {message}
      </Text>
      <Button title={retryLabel} variant="secondary" size="md" fullWidth={false} onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 16, paddingVertical: 48, paddingHorizontal: 20 },
  msg: { textAlign: 'center' },
});

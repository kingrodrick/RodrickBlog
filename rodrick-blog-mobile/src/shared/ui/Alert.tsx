import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../../theme';
import { Text } from './Text';

type Props = {
  kind: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  /** Icon trạng thái 22, nhận màu theo `kind`. */
  icon?: (color: string) => React.ReactNode;
};

/** Cảnh báo trong trang: không tự tắt. */
export function Alert({ kind, title, description, icon }: Props) {
  const { colors } = useTheme();
  const color = colors.status[kind];
  return (
    <View
      accessibilityRole={kind === 'error' ? 'alert' : undefined}
      style={[styles.box, { backgroundColor: colors.surface }]}>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={styles.body}>
        {icon ? <View style={styles.icon}>{icon(color)}</View> : null}
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          {description ? (
            <Text variant="caption" tone="secondary">
              {description}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.card, flexDirection: 'row', overflow: 'hidden' },
  bar: { width: 4 },
  body: { flex: 1, flexDirection: 'row', gap: 12, padding: 16 },
  icon: { width: 22, height: 22 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
});

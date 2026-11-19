import React from 'react';
import { StyleSheet, View } from 'react-native';
import { EventType, useTheme } from '../../theme';
import { Card } from './Card';
import { Text } from './Text';

type Props = {
  time: string;
  title: string;
  subtitle?: string;
  type: EventType;
  /** Tên loại mốc để trình đọc màn hình đọc (chấm màu không có chữ). */
  typeLabel: string;
  onPress?: () => void;
};

/** Vé mốc trong timeline: giờ, tên, chấm màu theo loại mốc. */
export function Ticket({ time, title, subtitle, type, typeLabel, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} accessibilityLabel={`${time}, ${title}, ${typeLabel}`}>
      <View style={styles.row}>
        <View style={styles.time}>
          <Text variant="label">{time}</Text>
        </View>
        <View style={styles.body}>
          <Text variant="heading">{title}</Text>
          {subtitle ? (
            <Text variant="caption" tone="secondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={[styles.dot, { backgroundColor: colors.eventType[type] }]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  time: { width: 52 },
  body: { flex: 1, gap: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

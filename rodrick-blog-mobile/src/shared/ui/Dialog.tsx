import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../../theme';
import { Button } from './Button';
import { Text } from './Text';

type Props = {
  visible: boolean;
  title: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel: string;
  /** Nút đỏ chỉ dùng khi hành động phá huỷ. */
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function Dialog({
  visible,
  title,
  description,
  cancelLabel = 'Huỷ',
  confirmLabel,
  destructive,
  onCancel,
  onConfirm,
}: Props) {
  const { colors } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.scrim, { backgroundColor: colors.overlay }]}>
        <Pressable
          accessibilityLabel="Đóng hộp thoại"
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
        />
        <View accessibilityViewIsModal style={[styles.box, { backgroundColor: colors.surface }]}>
          <Text style={styles.title}>{title}</Text>
          {description ? (
            <Text tone="secondary" style={styles.desc}>
              {description}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <View style={styles.flex}>
              <Button title={cancelLabel} variant="secondary" size="md" onPress={onCancel} />
            </View>
            <View style={styles.flex}>
              <Button
                title={confirmLabel}
                variant={destructive ? 'danger' : 'primary'}
                size="md"
                onPress={onConfirm}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'center', padding: 20 },
  box: { borderRadius: radius.sheet, padding: 20 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  desc: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  flex: { flex: 1 },
});

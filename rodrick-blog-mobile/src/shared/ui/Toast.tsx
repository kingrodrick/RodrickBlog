import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../../theme';
import { Text } from './Text';

type Props = {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  kind?: 'default' | 'success' | 'error';
  /** Icon trạng thái 22 (ngoại lệ duy nhất được kèm chữ). */
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  /** Khoảng cách từ đáy màn hình, để nổi phía trên footer. */
  bottomOffset?: number;
  duration?: number;
};

export function Toast({
  message,
  visible,
  onDismiss,
  kind = 'default',
  icon,
  actionLabel,
  onAction,
  bottomOffset = 96,
  duration = 3000,
}: Props) {
  const { colors } = useTheme();

  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!visible) {
      return;
    }
    const t = setTimeout(() => dismissRef.current(), duration);
    return () => clearTimeout(t);
  }, [visible, duration, message]);

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: bottomOffset }]}>
      <View
        accessibilityRole={kind === 'error' ? 'alert' : undefined}
        accessibilityLiveRegion={kind === 'error' ? 'assertive' : 'polite'}
        style={[styles.toast, { backgroundColor: colors.surfaceRaised }]}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text variant="label" style={styles.msg} numberOfLines={1}>
          {message}
        </Text>
        {actionLabel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            hitSlop={10}
            onPress={onAction}>
            <Text variant="label" tone="accent">
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 20, right: 20, alignItems: 'center' },
  toast: {
    minHeight: 48,
    borderRadius: radius.card,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    maxWidth: '100%',
  },
  icon: { width: 22, height: 22 },
  msg: { flexShrink: 1, fontWeight: '400' },
});

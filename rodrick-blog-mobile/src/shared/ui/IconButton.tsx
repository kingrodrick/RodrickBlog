import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

type Variant = 'surface' | 'ghost' | 'emphasis' | 'danger';

type Props = {
  /** Nhận màu icon theo biến thể, ví dụ: (c) => <Plus color={c} size={22} />. */
  icon: (color: string) => React.ReactNode;
  accessibilityLabel: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  /** Chấm báo có tin mới. */
  badge?: boolean;
};

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'surface',
  disabled,
  badge,
}: Props) {
  const { colors } = useTheme();
  const bg = {
    surface: colors.surfaceRaised,
    ghost: 'transparent',
    emphasis: colors.primary,
    danger: colors.surfaceRaised,
  }[variant];
  const fg = {
    surface: colors.text,
    ghost: colors.text,
    emphasis: colors.onPrimary,
    danger: colors.error,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
      ]}>
      {icon(fg)}
      {badge ? (
        <View style={[styles.dot, { backgroundColor: colors.accent, borderColor: colors.background }]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
});

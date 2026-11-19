import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../../theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'danger' | 'link';
type Size = 'lg' | 'md' | 'sm';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  /** Mặc định rộng kín chiều ngang; đặt false để co theo nội dung. */
  fullWidth?: boolean;
};

const SIZES: Record<Size, { height: number; padX: number; font: number }> = {
  lg: { height: 56, padX: 28, font: 16 },
  md: { height: 48, padX: 24, font: 16 },
  sm: { height: 36, padX: 14, font: 14 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled,
  loading,
  fullWidth = true,
}: Props) {
  const { colors } = useTheme();
  const s = SIZES[size];

  const bg = {
    primary: colors.primary,
    secondary: colors.surfaceMuted,
    danger: colors.accentFill,
    link: 'transparent',
  }[variant];
  const fg = {
    primary: colors.onPrimary,
    secondary: colors.text,
    danger: colors.onAccent,
    link: colors.text,
  }[variant];

  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      accessibilityLabel={title}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height: s.height,
          paddingHorizontal: s.padX,
          backgroundColor: bg,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}>
      {/* Chữ luôn được render (ẩn khi tải) để giữ nguyên độ rộng. */}
      {/* Chữ chiếm hết bề ngang nút + 1 dòng: font hệ thống tuỳ chỉnh (vd. Samsung) vẽ rộng hơn
          số đo, nếu ôm sát chữ sẽ bị đẩy xuống dòng 2 và mất chữ. */}
      <Text
        variant="label"
        numberOfLines={1}
        style={{
          alignSelf: 'stretch',
          textAlign: 'center',
          color: fg,
          fontSize: s.font,
          lineHeight: s.font + 4,
          opacity: loading ? 0 : 1,
          textDecorationLine: variant === 'link' ? 'underline' : 'none',
        }}>
        {title}
      </Text>
      {loading ? (
        <View style={styles.spinner} pointerEvents="none">
          <ActivityIndicator color={fg} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  spinner: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

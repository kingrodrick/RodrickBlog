import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { radius, useTheme } from '../../theme';

type Props = {
  width?: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Khối xám nhấp nháy nhẹ, đặt đúng hình nội dung sẽ tải. */
export function Skeleton({ width = '100%', height, borderRadius = radius.label, style }: Props) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius, backgroundColor: colors.surfaceMuted, opacity }, style]}
    />
  );
}

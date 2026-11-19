import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, G, Pattern, Rect } from 'react-native-svg';
import { useTheme } from '../../theme';

/**
 * Nền sóng seigaiha theo mockup: ô 40x20 (vẽ thành 28x14), mỗi sóng là 4 vòng tròn
 * đồng tâm viền trắng, sóng sau đè lên sóng trước. Sáng: viền đậm 0.85, tối: 0.07.
 */
const WAVES: [number, number][] = [
  [20, -10],
  [0, 0],
  [40, 0],
  [20, 10],
  [0, 20],
  [40, 20],
  [20, 30],
];
const RINGS = [14, 8.6, 3.2];

export function PatternBackground() {
  const { colors, isDark } = useTheme();
  const strokeOpacity = isDark ? 0.07 : 0.85;
  // Kích thước cụ thể thay vì absoluteFill/100%: react-native-svg không vẽ lại khi xoay màn,
  // nền chỉ phủ theo bề ngang lúc dựng. Đổi kích thước cửa sổ thì Svg dựng lại đủ khung.
  const { width, height } = useWindowDimensions();

  return (
    <Svg style={styles.fill} width={width} height={height} pointerEvents="none">
      <Defs>
        <Pattern
          id="seigaiha"
          patternUnits="userSpaceOnUse"
          width={28}
          height={14}
          viewBox="0 0 40 20"
        >
          {WAVES.map(([x, y]) => (
            <G
              key={`${x},${y}`}
              x={x}
              y={y}
              stroke="#ffffff"
              strokeWidth={1.3}
              strokeOpacity={strokeOpacity}
            >
              <Circle r={19.4} fill={colors.background} />
              {RINGS.map(r => (
                <Circle key={r} r={r} fill="none" />
              ))}
            </G>
          ))}
        </Pattern>
      </Defs>
      <Rect width={width} height={height} fill={colors.background} />
      <Rect width={width} height={height} fill="url(#seigaiha)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0 },
});

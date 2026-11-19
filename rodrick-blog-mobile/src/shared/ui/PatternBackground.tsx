import React from 'react';
import { StyleSheet } from 'react-native';
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

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
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
      <Rect width="100%" height="100%" fill={colors.background} />
      <Rect width="100%" height="100%" fill="url(#seigaiha)" />
    </Svg>
  );
}

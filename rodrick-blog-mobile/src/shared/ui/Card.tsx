import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { layout, radius, useTheme } from '../../theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Thẻ nổi bằng bước tông màu, không viền, không bóng. */
export function Card({ children, onPress, accessibilityLabel, style }: Props) {
  const { colors } = useTheme();
  const base = [styles.card, { backgroundColor: colors.surface }, style];
  if (!onPress) {
    return <View style={base}>{children}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, padding: layout.cardPadding },
});

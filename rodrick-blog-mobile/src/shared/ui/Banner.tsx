import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../../theme';
import { Text } from './Text';

/** Banner ngoại tuyến: đặt sát dưới header. */
export function Banner({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="alert" style={[styles.box, { backgroundColor: colors.referenceBg }]}>
      <Text variant="caption" style={{ color: colors.referenceLabel }}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.control, paddingHorizontal: 16, paddingVertical: 10 },
});

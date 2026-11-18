import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { Button } from './Button';
import { Text } from './Text';

/** Vòng ensō: nét tròn hở, vẽ bằng View nên không cần thư viện SVG. */
function Enso() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.enso,
        {
          borderColor: colors.textMuted,
          borderTopColor: 'transparent',
          transform: [{ rotate: '-30deg' }],
        },
      ]}
    />
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.wrap}>
      <Enso />
      <Text tone="secondary" style={styles.msg}>
        {message}
      </Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Thử lại',
}: {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text tone="secondary" style={styles.msg}>
        {message}
      </Text>
      <Button title={retryLabel} variant="secondary" size="md" fullWidth={false} onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 16, paddingVertical: 48, paddingHorizontal: 20 },
  enso: { width: 32, height: 32, borderRadius: 16, borderWidth: 3 },
  msg: { textAlign: 'center' },
});

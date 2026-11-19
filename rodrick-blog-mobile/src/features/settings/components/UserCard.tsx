import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from '../../../shared/ui';
import { useTheme } from '../../../theme';

const AVATAR = 64;

/** Khung người dùng: avatar chữ cái đầu + tên tài khoản + vai trò. */
export function UserCard({ username }: { username: string }) {
  const { colors, isDark } = useTheme();
  return (
    <Card style={[styles.row, isDark ? styles.dark : styles.light]}>
      <View style={[styles.avatar, { backgroundColor: colors.accentFill }]}>
        <Text style={[styles.initial, { color: colors.onAccent }]}>
          {username.trim().charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {username}
        </Text>
        <Text variant="caption" tone="secondary">
          Quản trị viên
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  light: { backgroundColor: '#ffffff' },
  dark: { backgroundColor: '#3b3835' },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
});

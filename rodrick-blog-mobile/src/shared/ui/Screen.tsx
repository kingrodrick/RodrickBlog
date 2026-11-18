import React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { layout, useTheme } from '../../theme';
import { Text } from './Text';

type Props = {
  title: string;
  children: React.ReactNode;
  /** Vùng phải của header, ví dụ một IconButton. */
  headerRight?: React.ReactNode;
  /** Footer 4 icon điều hướng; bỏ trống cho màn đăng nhập. */
  footer?: React.ReactNode;
  /** Dải sát dưới header, ví dụ Banner ngoại tuyến. */
  banner?: React.ReactNode;
  /** false nếu body tự quản cuộn (FlatList...). */
  scroll?: boolean;
};

/** Bố cục mọi màn: header / body cuộn / footer. */
export function Screen({ title, children, headerRight, footer, banner, scroll = true }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header" style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {headerRight}
      </View>
      {banner ? <View style={styles.banner}>{banner}</View> : null}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.content]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    minHeight: 64,
    paddingHorizontal: layout.screenMargin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: { flex: 1 },
  banner: { paddingHorizontal: layout.screenMargin, marginBottom: 8 },
  content: { paddingHorizontal: layout.screenMargin, paddingBottom: 24, gap: layout.cardGap },
  footer: { paddingHorizontal: layout.screenMargin, paddingBottom: 8 },
});

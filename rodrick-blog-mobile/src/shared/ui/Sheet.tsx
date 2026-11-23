import React from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { radius, useTheme } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** true: cao gần kín màn (hộp thoại sửa); false: chỉ cao bằng nội dung. */
  full?: boolean;
};

/** Hộp thoại dạng sheet bo 24 trượt từ đáy, phủ mờ phía sau; tự nâng lên khi có bàn phím. */
export function Sheet({ visible, onClose, children, full }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const keyboard = useKeyboardHeight();
  const available = height - insets.top - 24 - keyboard;
  const spacer = { height: keyboard > 0 ? 0 : insets.bottom };

  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.scrim, { backgroundColor: colors.overlay }]}>
        <Pressable accessibilityLabel="Đóng" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { backgroundColor: colors.background, maxHeight: available, marginBottom: keyboard },
            full ? { height: available } : null,
          ]}>
          <View style={[styles.grab, { backgroundColor: colors.inputBorder }]} />
          {children}
          <View style={spacer} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' },
  grab: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginTop: 8, marginBottom: 4 },
});

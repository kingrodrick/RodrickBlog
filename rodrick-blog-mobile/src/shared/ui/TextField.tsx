import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { radius, useTheme } from '../../theme';
import { Text } from './Text';

type Props = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label: string;
  error?: string;
  /** Ô mật khẩu: tự bật chữ Hiện/Ẩn. */
  password?: boolean;
  /**
   * Có giá trị: nhãn nằm bên trái ô, cùng một dòng, rộng cố định đúng số này
   * (để nhiều ô xếp dọc thẳng hàng nhau). Bỏ trống: nhãn nằm trên ô.
   */
  labelWidth?: number;
};

export function TextField({
  label,
  error,
  password,
  labelWidth,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error
    ? colors.error
    : focused
    ? colors.accent
    : colors.inputBorder;
  const borderWidth = error || focused ? 2 : 1;

  const inline = labelWidth !== undefined;

  return (
    <View>
      <View style={inline ? styles.inlineRow : undefined}>
        <Text
          variant="label"
          numberOfLines={inline ? 2 : undefined}
          style={inline ? { width: labelWidth } : styles.label}
        >
          {label}
        </Text>
        <View
          style={[
            styles.box,
            inline && styles.flex,
            { borderColor, borderWidth, backgroundColor: colors.surface },
          ]}
        >
          <TextInput
            {...rest}
            accessibilityLabel={label}
            secureTextEntry={password ? hidden : rest.secureTextEntry}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            onFocus={e => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={e => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[styles.input, { color: colors.text }]}
          />
          {password ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
              hitSlop={8}
              onPress={() => setHidden(h => !h)}
              style={styles.toggle}
            >
              <Text variant="label" tone="secondary">
                {hidden ? 'Hiện' : 'Ẩn'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {error ? (
        <Text
          variant="caption"
          tone="error"
          accessibilityRole="alert"
          style={[
            styles.error,
            inline && { marginLeft: labelWidth + INLINE_GAP },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Khe giữa nhãn bên trái và ô. */
export const INLINE_GAP = 8;

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: INLINE_GAP },
  flex: { flex: 1 },
  box: {
    height: 48,
    borderRadius: radius.control,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, height: '100%', paddingHorizontal: 14, fontSize: 16 },
  toggle: { paddingHorizontal: 14, height: '100%', justifyContent: 'center' },
  error: { marginTop: 6 },
});

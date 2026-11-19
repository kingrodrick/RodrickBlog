import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { radius, useTheme } from '../../theme';
import { Text } from './Text';

type Props = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label: string;
  error?: string;
  /** Ô mật khẩu: tự bật chữ Hiện/Ẩn. */
  password?: boolean;
};

export function TextField({ label, error, password, onFocus, onBlur, ...rest }: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error ? colors.error : focused ? colors.accent : colors.inputBorder;
  const borderWidth = error || focused ? 2 : 1;

  return (
    <View>
      <Text variant="label" style={styles.label}>
        {label}
      </Text>
      <View style={[styles.box, { borderColor, borderWidth, backgroundColor: colors.surface }]}>
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
            style={styles.toggle}>
            <Text variant="label" tone="secondary">
              {hidden ? 'Hiện' : 'Ẩn'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" tone="error" accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  box: { height: 48, borderRadius: radius.control, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, height: '100%', paddingHorizontal: 14, fontSize: 16 },
  toggle: { paddingHorizontal: 14, height: '100%', justifyContent: 'center' },
  error: { marginTop: 6 },
});

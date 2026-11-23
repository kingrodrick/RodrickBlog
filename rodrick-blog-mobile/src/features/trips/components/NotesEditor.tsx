import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, TextInput, TextInputInstance, View } from 'react-native';
import { Text } from '../../../shared/ui';
import { radius, useTheme } from '../../../theme';
import { handleNotesChange, Selection, toggleBullet } from '../notes';

export type NotesEditorHandle = {
  /** Bật/tắt gạch đầu dòng cho các dòng đang chọn. */
  toggleBullet: () => void;
  blur: () => void;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onFocusChange?: (focused: boolean) => void;
};

/** Ô ghi chú nhiều dòng: Enter sau "- chữ" tự thêm "- ", Enter ở dòng "- " trống thì thoát danh sách. */
export const NotesEditor = forwardRef<NotesEditorHandle, Props>(function NotesEditorField(
  { value, onChange, onFocusChange },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  // Chỉ ép vị trí con trỏ ngay sau một chỉnh sửa tự động; sau đó trả quyền cho hệ thống.
  const [forced, setForced] = useState<Selection | undefined>(undefined);
  const selection = useRef<Selection>({ start: value.length, end: value.length });
  const input = useRef<TextInputInstance>(null);

  const apply = (r: { value: string; selection: Selection }) => {
    selection.current = r.selection;
    setForced(r.selection);
    onChange(r.value);
  };

  useImperativeHandle(ref, () => ({
    toggleBullet: () => apply(toggleBullet(value, selection.current)),
    blur: () => input.current?.blur(),
  }));

  return (
    <View>
      <Text variant="label" style={styles.label}>
        Ghi chú
      </Text>
      <View
        style={[
          styles.box,
          focused ? styles.boxFocused : styles.boxIdle,
          { backgroundColor: colors.surface, borderColor: focused ? colors.accent : colors.inputBorder },
        ]}>
        <TextInput
          ref={input}
          accessibilityLabel="Ghi chú"
          multiline
          scrollEnabled={false}
          textAlignVertical="top"
          value={value}
          selection={forced}
          selectionColor={colors.accent}
          placeholder="Mô tả ngắn, dùng gạch đầu dòng cho các ý"
          placeholderTextColor={colors.textMuted}
          onChangeText={next => {
            const edited = handleNotesChange(value, next);
            if (edited) {
              apply(edited);
            } else {
              onChange(next);
            }
          }}
          onSelectionChange={e => {
            selection.current = e.nativeEvent.selection;
            if (forced) {
              setForced(undefined);
            }
          }}
          onFocus={() => {
            setFocused(true);
            onFocusChange?.(true);
          }}
          onBlur={() => {
            setFocused(false);
            onFocusChange?.(false);
          }}
          style={[styles.input, { color: colors.text }]}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  box: { borderRadius: radius.control },
  boxIdle: { borderWidth: 1 },
  boxFocused: { borderWidth: 2 },
  input: { minHeight: 140, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, lineHeight: 22 },
});

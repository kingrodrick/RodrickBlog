import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../../theme';
import { Text } from './Text';

type Props = { status: 'planning' | 'ongoing' | 'completed'; label: string } | { count: number };

export function Badge(props: Props) {
  const { colors } = useTheme();

  if ('count' in props) {
    const text = props.count > 99 ? '99+' : String(props.count);
    return (
      <View style={[styles.count, { backgroundColor: colors.accentFill }]}>
        <Text variant="overline" style={{ color: colors.onAccent, letterSpacing: 0 }}>
          {text}
        </Text>
      </View>
    );
  }

  const bg = {
    planning: colors.surfaceMuted,
    ongoing: colors.accentFill,
    completed: colors.primary,
  }[props.status];
  const fg = {
    planning: colors.text,
    ongoing: colors.onAccent,
    completed: colors.onPrimary,
  }[props.status];

  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text variant="overline" style={{ color: fg }}>
        {props.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderRadius: radius.label,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  count: {
    alignSelf: 'flex-start',
    height: 20,
    minWidth: 20,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

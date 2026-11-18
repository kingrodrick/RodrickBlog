import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { TextVariant, typography, useTheme } from '../../theme';

type Tone = 'primary' | 'secondary' | 'muted' | 'accent' | 'error' | 'onPrimary';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: Tone;
};

const TONE_KEY = {
  primary: 'text',
  secondary: 'textSecondary',
  muted: 'textMuted',
  accent: 'accent',
  error: 'error',
  onPrimary: 'onPrimary',
} as const;

export function Text({ variant = 'body', tone = 'primary', style, ...rest }: TextProps) {
  const { colors } = useTheme();
  return <RNText {...rest} style={[typography[variant], { color: colors[TONE_KEY[tone]] }, style]} />;
}

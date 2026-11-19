import { palette } from './palette';

export type EventType = 'transit' | 'food' | 'sight' | 'rest' | 'photo';

export type Colors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceRaised: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  inputBorder: string;
  primary: string;
  onPrimary: string;
  accent: string;
  accentFill: string;
  onAccent: string;
  error: string;
  referenceBg: string;
  referenceLabel: string;
  overlay: string;
  eventType: Record<EventType, string>;
  status: Record<'info' | 'success' | 'warning' | 'error', string>;
};

export const lightColors: Colors = {
  ...palette.light,
  accent: palette.torii,
  accentFill: palette.torii,
  onAccent: palette.white,
  overlay: 'rgba(23,20,18,0.5)',
  eventType: palette.eventType.light,
  status: palette.status,
};

export const darkColors: Colors = {
  ...palette.dark,
  accent: palette.toriiDark,
  accentFill: palette.toriiFillDark,
  onAccent: palette.white,
  overlay: 'rgba(0,0,0,0.6)',
  eventType: palette.eventType.dark,
  status: palette.status,
};

import { TextStyle } from 'react-native';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

export const layout = { screenMargin: 20, cardGap: 12, cardPadding: 16, minTouch: 44 } as const;

export const radius = { label: 8, control: 12, card: 16, sheet: 24, pill: 999 } as const;

export const iconSize = { inline: 16, control: 22, empty: 32 } as const;
export const iconStroke = { normal: 1.75, active: 2.25 } as const;

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'lead'
  | 'body'
  | 'label'
  | 'caption'
  | 'overline';

export const typography: Record<TextVariant, TextStyle> = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  lead: { fontSize: 18, lineHeight: 26, fontWeight: '400' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
};

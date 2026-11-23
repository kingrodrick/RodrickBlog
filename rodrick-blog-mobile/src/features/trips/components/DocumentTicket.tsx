import React from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../shared/ui';
import { cloudinaryUrl } from '../../../shared/utils/cloudinary';
import { radius, useTheme } from '../../../theme';
import { DocumentType, EventDocument } from '../types';

export const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  FLIGHT: 'Vé máy bay',
  TRANSPORT: 'Vé tàu/xe',
  BOOKING: 'Booking',
};

const isPdf = (url: string) => /\.pdf($|\?)/i.test(url);
const NOTCH = 20;

/** Vé giấy tờ: ảnh (mã QR có sẵn trong tệp) hoặc ô PDF, tên, loại; chạm để mở tệp Cloudinary. */
export function DocumentTicket({ doc }: { doc: EventDocument }) {
  const { colors } = useTheme();
  const label = DOC_TYPE_LABEL[doc.type] ?? doc.type;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${doc.name}`}
      onPress={() => Linking.openURL(doc.url)}
      style={({ pressed }) => [styles.ticket, { backgroundColor: colors.surface }, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        {isPdf(doc.url) ? (
          <View style={[styles.thumb, styles.pdf, { backgroundColor: colors.surfaceMuted }]}>
            <Text variant="label" tone="secondary">
              PDF
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: cloudinaryUrl(doc.url, { w: 288, h: 288 }) }}
            style={[styles.thumb, { backgroundColor: colors.surfaceMuted }]}
          />
        )}
        <View style={styles.info}>
          <Text variant="overline" tone="muted">
            {label}
          </Text>
          <Text variant="heading">{doc.name}</Text>
        </View>
      </View>

      {/* Đường xé vé: hai khuyết tròn màu nền và nét đứt */}
      <View style={styles.tear}>
        <View style={[styles.notch, styles.notchL, { backgroundColor: colors.background }]} />
        <View style={styles.dashes}>
          {Array.from({ length: 24 }, (_, i) => (
            <View key={i} style={[styles.dash, { backgroundColor: colors.surfaceMuted }]} />
          ))}
        </View>
        <View style={[styles.notch, styles.notchR, { backgroundColor: colors.background }]} />
      </View>

      <View style={styles.bottom}>
        <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.rowLabel}>
          Chạm để mở tệp
        </Text>
        <Text variant="label" tone="accent">
          Mở
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ticket: { borderRadius: radius.card, overflow: 'hidden' },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', gap: 16, padding: 20, paddingBottom: 16, alignItems: 'center' },
  thumb: { width: 96, height: 96, borderRadius: 10 },
  pdf: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 0, gap: 2 },
  tear: { height: NOTCH, justifyContent: 'center' },
  notch: { position: 'absolute', width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2 },
  notchL: { left: -NOTCH / 2 },
  notchR: { right: -NOTCH / 2 },
  dashes: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, overflow: 'hidden' },
  dash: { width: 8, height: 2 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 12 },
  rowLabel: { flex: 1 },
});

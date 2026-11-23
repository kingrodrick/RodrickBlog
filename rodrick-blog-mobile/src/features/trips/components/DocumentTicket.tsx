import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { LocalDocument } from '../../../shared/api/localDocuments';
import { Text } from '../../../shared/ui';
import { radius, useTheme } from '../../../theme';
import { isPdfDocument, openDocument } from '../documentFile';
import { DocumentType } from '../types';

export const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  FLIGHT: 'Vé máy bay',
  TRANSPORT: 'Vé tàu/xe',
  BOOKING: 'Booking',
};

const NOTCH = 20;

/**
 * Vé giấy tờ lưu trên máy: ảnh (mã QR có sẵn trong tệp) hoặc ô PDF, tên, loại.
 * Chạm để mở bằng trình xem của hệ thống; chạm giữ để xoá.
 */
export function DocumentTicket({
  doc,
  onLongPress,
  onError,
}: {
  doc: LocalDocument;
  onLongPress?: () => void;
  onError?: (message: string) => void;
}) {
  const { colors } = useTheme();
  const label = DOC_TYPE_LABEL[doc.type] ?? doc.type;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${doc.name}`}
      onPress={() => openDocument(doc).catch(() => onError?.('Không mở được tệp. Cần một app xem PDF/ảnh trên máy.'))}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.ticket, { backgroundColor: colors.surface }, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        {isPdfDocument(doc) ? (
          <View style={[styles.thumb, styles.pdf, { backgroundColor: colors.surfaceMuted }]}>
            <Text variant="label" tone="secondary">
              PDF
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: doc.uri }}
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
          Chạm để mở • giữ để xoá
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

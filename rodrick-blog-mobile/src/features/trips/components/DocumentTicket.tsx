import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { LocalDocument } from '../../../shared/api/localDocuments';
import { Text } from '../../../shared/ui';
import { iconSize, iconStroke, radius, useTheme } from '../../../theme';
import { isPdfDocument, openDocument } from '../documentFile';
import { DocumentType } from '../types';

export const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  FLIGHT: 'Vé máy bay',
  TRANSPORT: 'Vé tàu/xe',
  BOOKING: 'Booking',
};

// Cùng cách trượt nút như hàng lộ trình (RouteList): nút tròn 44, cách nhau 6.
const ACTION = 44;
const GAP = 6;
const PANEL = ACTION * 2 + GAP;
const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
const DANGER_BG = '#a3161f';
/** Khe giữa thẻ và cụm nút khi mở. */
const SLOT_GAP = 8;

type Props = {
  doc: LocalDocument;
  /** Đang trượt ra hai nút Sửa / Xoá (mỗi lúc chỉ một thẻ mở). */
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onError?: (message: string) => void;
};

/**
 * Thẻ giấy tờ lưu trên máy: ảnh thu nhỏ (mã QR có sẵn trong tệp; PDF thì không có), loại, tên.
 * Chạm để mở bằng trình xem của hệ thống; nhấn giữ thì thẻ co lại, trượt ra nút Sửa và Xoá.
 */
export function DocumentTicket({
  doc,
  open,
  onToggle,
  onEdit,
  onDelete,
  onError,
}: Props) {
  const { colors } = useTheme();
  const p = useRef(new Animated.Value(0)).current;
  const first = useRef(true);
  const label = DOC_TYPE_LABEL[doc.type] ?? doc.type;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    Animated.timing(p, {
      toValue: open ? 1 : 0,
      duration: 280,
      easing: EASE,
      useNativeDriver: false,
    }).start();
  }, [open, p]);

  const renderIcon = (Icon: typeof Pencil, color: string) => (
    <Icon
      size={iconSize.control}
      color={color}
      strokeWidth={iconStroke.normal}
      strokeLinecap="round"
    />
  );

  return (
    // Cụm nút nằm trong hàng (không nổi đè): vùng nút giãn từ 0 ra đủ hai nút,
    // thẻ bên trái tự co lại nhường chỗ nên không bao giờ đè lên nút.
    <View style={styles.row}>
      <View style={styles.cardWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${doc.name}`}
          accessibilityHint={
            open
              ? 'Chạm để đóng nút sửa, xoá'
              : 'Chạm để mở, nhấn giữ để sửa hoặc xoá'
          }
          delayLongPress={450}
          onLongPress={onToggle}
          onPress={
            open
              ? onToggle
              : () =>
                  openDocument(doc).catch(() =>
                    onError?.(
                      'Không mở được tệp. Cần một app xem PDF/ảnh trên máy.',
                    ),
                  )
          }
          style={[styles.card, { backgroundColor: colors.surface }]}
        >
          {isPdfDocument(doc) ? null : (
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
        </Pressable>
      </View>

      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.slot,
          {
            width: p.interpolate({
              inputRange: [0, 1],
              outputRange: [0, PANEL + SLOT_GAP],
            }),
          },
        ]}
      >
        <Animated.View
          style={[
            styles.panel,
            {
              opacity: p,
              transform: [
                {
                  translateX: p.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sửa loại giấy tờ"
            onPress={onEdit}
            style={[styles.action, { backgroundColor: colors.surfaceRaised }]}
          >
            {renderIcon(Pencil, colors.text)}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xoá giấy tờ"
            onPress={onDelete}
            style={[styles.action, { backgroundColor: DANGER_BG }]}
          >
            {renderIcon(Trash2, '#ffffff')}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  cardWrap: { flex: 1, minWidth: 0 },
  card: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
    alignItems: 'center',
    borderRadius: radius.card,
  },
  thumb: { width: 96, height: 96, borderRadius: 10 },
  info: { flex: 1, minWidth: 0, gap: 2 },
  // Vùng nút: rộng 0 khi đóng, cắt phần thừa để nút không lộ ra ngoài.
  slot: { overflow: 'hidden', alignItems: 'flex-end' },
  panel: { width: PANEL, flexDirection: 'row', alignItems: 'center', gap: GAP },
  action: {
    width: ACTION,
    height: ACTION,
    borderRadius: ACTION / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

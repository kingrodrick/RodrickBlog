import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowUpDown, Check, X } from 'lucide-react-native';
import { IconButton } from '../../../shared/ui';
import { iconSize, iconStroke, layout, useTheme } from '../../../theme';
import { saveCollectionOrder } from '../api/collections';
import { ReorderList } from '../components/ReorderList';
import { Collection } from '../types';

const icon = (Icon: typeof X) => (c: string) =>
  <Icon color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />;
const renderReorder = icon(ArrowUpDown);
const renderDone = icon(Check);
const renderCancel = icon(X);

type Options = {
  collections: Collection[] | null;
  /** false: đang mất mạng (bản lưu), không cho sắp xếp. */
  canEdit: boolean;
  onSaved: () => void;
  notify: (toast: { kind: 'success' | 'error'; message: string }) => void;
};

/**
 * Chế độ sắp thứ tự bộ sưu tập (cột display_order) bằng kéo thả.
 * Trả nút header và danh sách kéo thả để màn tự đặt; Back của Android huỷ chế độ.
 */
export function useCollectionOrder({ collections, canEdit, onSaved, notify }: Options) {
  const { colors } = useTheme();
  // null: không ở chế độ sắp xếp; mảng: thứ tự đang kéo.
  const [draft, setDraft] = useState<Collection[] | null>(null);
  const [saving, setSaving] = useState(false);
  const ordering = draft !== null;
  // Thứ tự vừa lưu, hiện ngay trong lúc chờ tải lại danh sách (khỏi nhảy về thứ tự cũ).
  const [applied, setApplied] = useState<Collection[] | null>(null);
  useEffect(() => setApplied(null), [collections]);
  const shown = applied ?? collections;

  const cancel = useCallback(() => setDraft(null), []);

  useFocusEffect(
    useCallback(() => {
      if (!ordering) {
        return;
      }
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!saving) {
          cancel();
        }
        return true;
      });
      return () => sub.remove();
    }, [ordering, saving, cancel]),
  );

  const save = async () => {
    if (!draft || !shown) {
      return;
    }
    setSaving(true);
    try {
      await saveCollectionOrder(
        shown.map(c => c.id),
        draft.map(c => c.id),
      );
      setApplied(draft);
      setDraft(null);
      onSaved();
      notify({ kind: 'success', message: 'Đã lưu thứ tự bộ sưu tập' });
    } catch (e) {
      notify({ kind: 'error', message: e instanceof Error ? e.message : 'Không lưu được thứ tự.' });
    } finally {
      setSaving(false);
    }
  };

  const startButton = (
    <IconButton
      accessibilityLabel="Sắp xếp bộ sưu tập"
      variant="ghost"
      disabled={!canEdit || !shown || shown.length < 2}
      onPress={() => setDraft(shown)}
      icon={renderReorder}
    />
  );

  return {
    ordering,
    /** Danh sách để hiện ở chế độ thường (thứ tự vừa lưu nếu có). */
    shown,
    headerLeft: ordering ? (
      <IconButton
        accessibilityLabel="Huỷ sắp xếp"
        variant="ghost"
        disabled={saving}
        onPress={cancel}
        icon={renderCancel}
      />
    ) : null,
    headerRight: ordering ? (
      saving ? (
        <View style={styles.busy}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <IconButton accessibilityLabel="Lưu thứ tự" variant="ghost" onPress={save} icon={renderDone} />
      )
    ) : (
      startButton
    ),
    list: draft ? <ReorderList collections={draft} onChange={setDraft} /> : null,
  };
}

const styles = StyleSheet.create({
  busy: {
    width: layout.minTouch,
    height: layout.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

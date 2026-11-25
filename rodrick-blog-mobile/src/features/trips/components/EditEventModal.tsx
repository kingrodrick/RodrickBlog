import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, ScrollViewInstance, StyleSheet, View } from 'react-native';
import { ChevronDown, List, X } from 'lucide-react-native';
import { Button, Chip, IconButton, Sheet, Text, TextField, Toast } from '../../../shared/ui';
import { iconSize, iconStroke, useTheme } from '../../../theme';
import { saveEvent } from '../api/eventApi';
import { EVENT_TYPE_LABEL } from '../eventCategory';
import {
  CATEGORY_OPTIONS,
  buildEventPatch,
  EventForm,
  EventFormErrors,
  formFromEvent,
  validateEventForm,
} from '../eventForm';
import { DetailEvent } from '../types';
import { NotesEditor, NotesEditorHandle } from './NotesEditor';
import { PhotoManager } from './PhotoManager';

type Props = {
  event: DetailEvent;
  /** Các mốc của cả chuyến, để đánh số lại ngày khi đổi ngày. */
  siblings: DetailEvent[];
  tripTitle: string;
  visible: boolean;
  onClose: () => void;
  /** Dữ liệu trên server đã đổi: màn cha tải lại. */
  onDataChanged: (message: string) => void;
};

const TABS = ['Thông tin', 'Ảnh minh họa'];

const icon = (Icon: typeof X) => (c: string) =>
  <Icon color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />;
const closeIcon = icon(X);
const bulletIcon = icon(List);
const hideKeyboardIcon = icon(ChevronDown);

/** Hộp thoại Sửa mốc, 2 tab: 1/2 Thông tin và ghi chú, 2/2 Ảnh minh họa (ảnh thực tế không sửa ở đây). */
export function EditEventModal({ event, siblings, tripTitle, visible, onClose, onDataChanged }: Props) {
  const { colors } = useTheme();
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<EventForm>(() => formFromEvent(event));
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);
  const notes = useRef<NotesEditorHandle>(null);
  // Hai tab là hai trang của một dải cuộn ngang: vuốt ngang hoặc chạm thanh tab để chuyển.
  const pager = useRef<ScrollViewInstance>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const goTo = useCallback(
    (i: number, animated = true) => {
      setTab(i);
      pager.current?.scrollTo({ x: i * pageWidth, animated });
    },
    [pageWidth],
  );
  // Đổi bề ngang (xoay màn) thì cuộn lại đúng trang đang xem.
  const tabRef = useRef(tab);
  tabRef.current = tab;
  useEffect(() => {
    if (pageWidth) {
      pager.current?.scrollTo({ x: tabRef.current * pageWidth, animated: false });
    }
  }, [pageWidth]);

  // Mở hộp thoại thì nạp lại từ dữ liệu mới nhất, về tab đầu. Dữ liệu `event` đổi giữa chừng
  // (sau khi sửa ảnh) không ghi đè phần đang gõ vì chỉ nạp ở lần mở.
  const wasVisible = useRef(false);
  useEffect(() => {
    if (visible && !wasVisible.current) {
      goTo(0, false);
      setForm(formFromEvent(event));
      setErrors({});
      setToast(null);
    }
    wasVisible.current = visible;
  }, [visible, event, goTo]);

  const set = <K extends keyof EventForm>(key: K, value: EventForm[K]) => setForm(f => ({ ...f, [key]: value }));

  const save = async () => {
    const found = validateEventForm(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSaving(true);
    try {
      const others = siblings.filter(e => e.id !== event.id).map(e => e.trip_date);
      await saveEvent(event.id, buildEventPatch(form, event, others), siblings);
      onClose();
      onDataChanged('Đã lưu mốc');
    } catch (e) {
      setToast({ text: e instanceof Error ? e.message : 'Không lưu được mốc.', kind: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const photoChanged = (message: string) => {
    setToast({ text: message, kind: 'success' });
    onDataChanged(message);
  };

  return (
    <Sheet
      visible={visible}
      onClose={saving ? () => {} : onClose}
      full
      // Vuốt xuống từ đầu hộp thoại (tiêu đề, thanh tab) để đóng; đang lưu thì không.
      dragToClose={!saving}
      header={
        <>
          <View style={styles.top}>
            <IconButton variant="ghost" accessibilityLabel="Đóng" onPress={onClose} icon={closeIcon} />
            <Text variant="heading" accessibilityRole="header" style={styles.chapter}>
              <Text variant="heading" tone="accent">
                {tab + 1}/2{'  '}
              </Text>
              {TABS[tab]}
            </Text>
          </View>
          <View style={styles.bars}>
            {TABS.map((label, i) => (
              <Pressable
                key={label}
                accessibilityRole="tab"
                accessibilityLabel={`${i + 1}/2 ${label}`}
                accessibilityState={{ selected: tab === i }}
                onPress={() => goTo(i)}
                // Vùng chạm thật cao 20 (hitSlop không đủ: chạm lệch khỏi vạch 3px bị vùng vuốt
                // đóng sheet nhận mất), vạch mảnh vẽ ở giữa.
                style={styles.barTouch}>
                <View style={[styles.bar, { backgroundColor: i <= tab ? colors.accent : colors.surfaceMuted }]} />
              </Pressable>
            ))}
          </View>
        </>
      }>
      <View style={styles.root}>

        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // Vuốt sang trang khác thì cất bàn phím (thanh công cụ ghi chú chỉ thuộc trang 1).
          keyboardDismissMode="on-drag"
          style={styles.body}
          onLayout={e => setPageWidth(e.nativeEvent.layout.width)}
          onMomentumScrollEnd={e => {
            if (pageWidth) {
              setTab(Math.round(e.nativeEvent.contentOffset.x / pageWidth));
            }
          }}>
          <ScrollView
            style={{ width: pageWidth || undefined }}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <TextField
              label="Tên địa điểm"
              value={form.locationName}
              onChangeText={t => set('locationName', t)}
              error={errors.locationName}
            />
            <View style={styles.two}>
              <View style={styles.half}>
                <TextField
                  label="Giờ bắt đầu"
                  value={form.startTime}
                  onChangeText={t => set('startTime', t)}
                  error={errors.startTime}
                  keyboardType="numbers-and-punctuation"
                  placeholder="08:30"
                />
              </View>
              <View style={styles.half}>
                <TextField
                  label="Giờ kết thúc"
                  value={form.endTime}
                  onChangeText={t => set('endTime', t)}
                  error={errors.endTime}
                  keyboardType="numbers-and-punctuation"
                  placeholder="10:30"
                />
              </View>
            </View>
            <View style={styles.two}>
              <View style={styles.half}>
                <TextField
                  label="Ngày"
                  value={form.date}
                  onChangeText={t => set('date', t)}
                  error={errors.date}
                  keyboardType="numbers-and-punctuation"
                  placeholder="14/12/2026"
                />
              </View>
              <View style={styles.half}>
                <TextField label="Thành phố" value={form.city} onChangeText={t => set('city', t)} />
              </View>
            </View>
            <View>
              <Text variant="label" style={styles.chipsLabel}>
                Loại mốc
              </Text>
              <View style={styles.chips}>
                {CATEGORY_OPTIONS.map(o => (
                  <Chip
                    key={o.type}
                    label={EVENT_TYPE_LABEL[o.type]}
                    selected={form.category === o.type}
                    onPress={() => set('category', o.type)}
                  />
                ))}
              </View>
            </View>
            <NotesEditor ref={notes} value={form.notes} onChange={t => set('notes', t)} onFocusChange={setNotesFocused} />
          </ScrollView>
          <ScrollView
            style={{ width: pageWidth || undefined }}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
          <PhotoManager
            event={event}
            tripTitle={tripTitle}
            onChanged={photoChanged}
            onError={text => setToast({ text, kind: 'error' })}
          />
          </ScrollView>
        </ScrollView>

        {tab === 0 ? (
          <View style={styles.footer}>
            {notesFocused ? (
              <View style={styles.toolbar}>
                <IconButton accessibilityLabel="Gạch đầu dòng" onPress={() => notes.current?.toggleBullet()} icon={bulletIcon} />
                <IconButton
                  variant="ghost"
                  accessibilityLabel="Ẩn bàn phím"
                  onPress={() => {
                    notes.current?.blur();
                    Keyboard.dismiss();
                  }}
                  icon={hideKeyboardIcon}
                />
              </View>
            ) : (
              <Button title="Lưu" loading={saving} onPress={save} />
            )}
          </View>
        ) : (
          <View style={styles.footer}>
            <Button title="Xong" variant="secondary" onPress={onClose} />
          </View>
        )}

        <Toast
          message={toast?.text ?? ''}
          visible={toast !== null}
          kind={toast?.kind}
          bottomOffset={88}
          onDismiss={() => setToast(null)}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 8, paddingRight: 20 },
  chapter: { flex: 1 },
  // Vạch nằm giữa vùng chạm cao 20: cách tiêu đề ~8 như cũ, bớt khoảng dưới cho khớp.
  bars: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: -4 },
  barTouch: { flex: 1, height: 20, justifyContent: 'center' },
  bar: { height: 3, borderRadius: 2 },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 12 },
  two: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  chipsLabel: { marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

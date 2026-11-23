import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { addLocalDocument, LocalDocType } from '../../../shared/api/localDocuments';
import { Button, Chip, Sheet, Text, TextField } from '../../../shared/ui';
import { copyIntoApp, defaultDocName, PickedDocument } from '../documentFile';
import { DOC_TYPE_LABEL } from './DocumentTicket';

type Props = {
  /** Tệp vừa chọn; null thì đóng. */
  picked: PickedDocument | null;
  eventId: number;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
};

const TYPES: LocalDocType[] = ['FLIGHT', 'TRANSPORT', 'BOOKING'];

/** Đặt tên và chọn loại cho giấy tờ vừa chọn, rồi lưu vào máy (không tải lên đâu cả). */
export function AddDocumentSheet({ picked, eventId, onClose, onSaved, onError }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<LocalDocType>('BOOKING');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();

  React.useEffect(() => {
    if (picked) {
      setName(defaultDocName(picked.name));
      setType('BOOKING');
      setNameError(undefined);
    }
  }, [picked]);

  const save = async () => {
    if (!picked) {
      return;
    }
    if (!name.trim()) {
      setNameError('Cần nhập tên giấy tờ.');
      return;
    }
    setSaving(true);
    try {
      const uri = await copyIntoApp(picked);
      await addLocalDocument({ eventId, name: name.trim(), type, uri, mimeType: picked.mimeType });
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Không lưu được giấy tờ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={picked !== null} onClose={saving ? () => {} : onClose}>
      <Text variant="heading" style={styles.title}>
        Thêm giấy tờ
      </Text>
      <View style={styles.body}>
        <TextField label="Tên giấy tờ" value={name} onChangeText={setName} error={nameError} editable={!saving} />
        <View style={styles.types}>
          {TYPES.map(t => (
            <Chip key={t} label={DOC_TYPE_LABEL[t]} selected={type === t} onPress={() => setType(t)} />
          ))}
        </View>
        <Text variant="caption" tone="muted">
          Giấy tờ chỉ lưu trên điện thoại này, không tải lên máy chủ.
        </Text>
        <Button title="Lưu giấy tờ" loading={saving} onPress={save} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  body: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

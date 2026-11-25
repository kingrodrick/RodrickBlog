import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  LocalDocType,
  LocalDocument,
  updateLocalDocumentType,
} from '../../../shared/api/localDocuments';
import { useRetained } from '../../../shared/hooks/useRetained';
import { Button, Chip, Sheet, Text } from '../../../shared/ui';
import { DOC_TYPE_LABEL } from './DocumentTicket';

type Props = {
  /** Giấy tờ đang sửa; null thì đóng. */
  doc: LocalDocument | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
};

const TYPES: LocalDocType[] = ['FLIGHT', 'TRANSPORT', 'BOOKING'];

/** Sửa giấy tờ: chỉ đổi loại (vé máy bay / vé tàu xe / booking). */
export function EditDocumentSheet({ doc, onClose, onSaved, onError }: Props) {
  const [type, setType] = useState<LocalDocType>('BOOKING');
  const [saving, setSaving] = useState(false);
  // Giữ giấy tờ cuối cùng để vẽ trong lúc sheet trượt xuống.
  const shownDoc = useRetained(doc);

  useEffect(() => {
    if (doc) {
      setType(doc.type);
    }
  }, [doc]);

  const save = async () => {
    if (!doc) {
      return;
    }
    if (type === doc.type) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await updateLocalDocumentType(doc.id, type);
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Không lưu được giấy tờ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={doc !== null} onClose={saving ? () => {} : onClose} title="Loại giấy tờ">
      <View style={styles.body}>
        <Text variant="caption" tone="secondary">
          {shownDoc?.name}
        </Text>
        <View style={styles.types}>
          {TYPES.map(t => (
            <Chip key={t} label={DOC_TYPE_LABEL[t]} selected={type === t} onPress={() => setType(t)} />
          ))}
        </View>
        <Button title="Lưu" loading={saving} onPress={save} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

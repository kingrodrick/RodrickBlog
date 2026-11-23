import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../shared/ui';
import { parseNotes } from '../notes';

/** Ghi chú của mốc: dòng thường giữ nguyên xuống dòng, dòng "- " vẽ thành "•" thụt vào. */
export function NotesView({ notes }: { notes: string | null }) {
  const blocks = parseNotes(notes);
  if (blocks.length === 0) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      {blocks.map((b, i) =>
        b.kind === 'bullet' ? (
          <View key={i} style={styles.bullet}>
            <Text tone="secondary" style={styles.dot}>
              •
            </Text>
            <Text tone="secondary" style={styles.text}>
              {b.text}
            </Text>
          </View>
        ) : b.text === '' ? (
          <View key={i} style={styles.gap} />
        ) : (
          <Text key={i} tone="secondary" style={styles.text}>
            {b.text}
          </Text>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  bullet: { flexDirection: 'row', gap: 8, paddingLeft: 4 },
  dot: { fontSize: 15, lineHeight: 22 },
  text: { flexShrink: 1, fontSize: 15, lineHeight: 22 },
  gap: { height: 8 },
});

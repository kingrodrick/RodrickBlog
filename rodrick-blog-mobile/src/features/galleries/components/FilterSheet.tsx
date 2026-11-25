import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Sheet, Text } from '../../../shared/ui';
import { PhotoFilter } from '../types';

export const FILTER_LABEL: Record<PhotoFilter, string> = {
  all: 'Cả hai',
  real: 'Ảnh thực tế',
  reference: 'Ảnh tham khảo',
};

const FILTERS: PhotoFilter[] = ['all', 'real', 'reference'];

type Props = {
  visible: boolean;
  value: PhotoFilter;
  onChange: (value: PhotoFilter) => void;
  onClose: () => void;
};

/** Chọn loại ảnh hiện trong lưới; chạm một lựa chọn là áp dụng và đóng luôn. */
export function FilterSheet({ visible, value, onChange, onClose }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="heading" style={styles.title}>
        Loại ảnh
      </Text>
      <View style={styles.body}>
        {FILTERS.map(f => (
          <Chip
            key={f}
            label={FILTER_LABEL[f]}
            selected={value === f}
            onPress={() => {
              onChange(f);
              onClose();
            }}
          />
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  body: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
});

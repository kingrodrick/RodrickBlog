import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from '../../../shared/ui';
import { formatJpy, formatVnd } from '../currency';
import { JP_DIGITS, YEN_IRREGULAR, YEN_UNITS, YenReading } from '../yenReading';

/** Cột trái (số tiền + VND tương đương) và cột kanji rộng cố định để các dòng thẳng hàng. */
const AMOUNT_WIDTH = 104;
const KANJI_WIDTH = 64;

function ReadingRow({ item, vndPerJpy }: { item: YenReading; vndPerJpy: number }) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${formatJpy(item.yen)}, đọc là ${item.romaji}, khoảng ${formatVnd(item.yen * vndPerJpy)}`}
    >
      <View style={styles.amount}>
        <Text variant="label">{formatJpy(item.yen)}</Text>
        {/* Số lớn (¥100.000.000) dài, cho xuống dòng thay vì cắt. */}
        <Text variant="caption" tone="muted">
          ≈ {formatVnd(item.yen * vndPerJpy)}
        </Text>
      </View>
      <Text variant="body" style={styles.kanji}>
        {item.kanji}
      </Text>
      <View style={styles.flex}>
        <Text variant="label">{item.romaji}</Text>
        <Text variant="caption" tone="secondary">
          {item.phonetic}
        </Text>
      </View>
    </View>
  );
}

/** Bảng tra cách đọc tiền Nhật, kèm số VND tương đương theo tỉ giá đang dùng. */
export function YenReadingCard({ vndPerJpy }: { vndPerJpy: number }) {
  return (
    <Card style={styles.card}>
      <Text variant="heading">Cách đọc tiền Nhật</Text>
      <Text variant="caption" tone="secondary">
        Người Nhật đếm theo nhóm 4 số: 1 man (万) = 10.000 yên. Ví dụ ¥50.000 là go man (5 man),
        ¥150.000 là juu-go man (15 man). Ghép số đếm trước đơn vị: ¥5.000 = go + sen.
      </Text>

      <Text variant="overline" tone="secondary" style={styles.section}>
        Đơn vị
      </Text>
      {YEN_UNITS.map(item => (
        <ReadingRow key={item.yen} item={item} vndPerJpy={vndPerJpy} />
      ))}

      <Text variant="overline" tone="secondary" style={styles.section}>
        Số đọc biến âm hay gặp
      </Text>
      {YEN_IRREGULAR.map(item => (
        <ReadingRow key={item.yen} item={item} vndPerJpy={vndPerJpy} />
      ))}

      <Text variant="overline" tone="secondary" style={styles.section}>
        Số đếm
      </Text>
      <View style={styles.digits}>
        {JP_DIGITS.map(d => (
          <View
            key={d.digit}
            style={styles.digit}
            accessible
            accessibilityLabel={`${d.digit} đọc là ${d.romaji}`}
          >
            <Text variant="label">
              {d.digit} {d.kanji}
            </Text>
            <Text variant="caption" tone="secondary">
              {d.romaji} • {d.phonetic}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  section: { marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  amount: { width: AMOUNT_WIDTH },
  kanji: { width: KANJI_WIDTH },
  flex: { flex: 1 },
  // Số đếm xếp 3 cột không đều nhau theo độ dài chữ; ô rộng tối thiểu để dễ đọc.
  digits: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 16 },
  digit: { minWidth: 88 },
});

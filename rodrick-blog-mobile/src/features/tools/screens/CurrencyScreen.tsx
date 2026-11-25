import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ArrowUpDown, RefreshCw } from 'lucide-react-native';
import {
  Banner,
  Chip,
  ErrorState,
  IconButton,
  Screen,
  Skeleton,
  INLINE_GAP,
  Text,
  TextField,
} from '../../../shared/ui';
import { iconSize, iconStroke, radius } from '../../../theme';
import { BackButton } from '../components/BackButton';
import { YenReadingCard } from '../components/YenReadingCard';
import { readYen } from '../yenReading';
import {
  appendThousands,
  convert,
  Direction,
  formatAmountInput,
  formatJpy,
  formatRate,
  formatStamp,
  parseAmount,
} from '../currency';
import { ExchangeRate } from '../api/exchangeRate';
import { useExchangeRate } from '../hooks/useExchangeRate';

/** Số nhanh theo đơn vị đang nhập. */
const QUICK: Record<Direction, string[]> = {
  JPY_TO_VND: ['1.000', '5.000', '10.000'],
  VND_TO_JPY: ['100.000', '500.000', '1.000.000'],
};

const INPUT_LABEL: Record<Direction, string> = {
  JPY_TO_VND: 'Số tiền (¥)',
  VND_TO_JPY: 'Số tiền (VND)',
};

const RESULT_LABEL: Record<Direction, string> = {
  JPY_TO_VND: 'Quy đổi (VND)',
  VND_TO_JPY: 'Quy đổi (¥)',
};

/** Nhãn bên trái hai ô, đủ rộng cho "Số tiền (VND)". */
const LABEL_WIDTH = 104;

const renderSwap = (c: string) => (
  <ArrowUpDown
    color={c}
    size={iconSize.control}
    strokeWidth={iconStroke.normal}
    strokeLinecap="round"
  />
);

const renderRefresh = (c: string) => (
  <RefreshCw
    color={c}
    size={iconSize.control}
    strokeWidth={iconStroke.normal}
    strokeLinecap="round"
  />
);

/** Dòng nói rõ đang dùng tỉ giá mới hay tỉ giá đã lưu. */
function rateLine(rate: ExchangeRate, live: boolean): string {
  const value = `1 ¥ = ${formatRate(rate.vndPerJpy)} ₫`;
  return live
    ? `Tỉ giá mới nhất • ${value} • nguồn cập nhật ${formatStamp(rate.sourceUpdatedAt)}`
    : `Tỉ giá đã lưu • ${value} • nguồn cập nhật ${formatStamp(rate.sourceUpdatedAt)}`;
}

function Converter({ rate, live, refreshing }: { rate: ExchangeRate; live: boolean; refreshing: boolean }) {
  const [direction, setDirection] = useState<Direction>('JPY_TO_VND');
  const [input, setInput] = useState('');

  const amount = parseAmount(input);
  const result = amount === null ? null : convert(amount, direction, rate.vndPerJpy);
  /** Số đã quy đổi, làm tròn tới đồng / yên, cùng kiểu dấu chấm nghìn như ô nhập. */
  const resultText = result === null ? '' : formatAmountInput(String(Math.round(result)));

  /** Số yên đang hiện (ô nhập hoặc ô quy đổi tuỳ chiều) và cách đọc của nó. */
  const yen = direction === 'JPY_TO_VND' ? amount : result;
  const spoken = yen === null ? null : readYen(yen);

  /** Đảo VND ⇄ Yên: số đã quy đổi lên ô nhập, để xem ngược lại ngay. */
  const swap = () => {
    setInput(resultText);
    setDirection(d => (d === 'JPY_TO_VND' ? 'VND_TO_JPY' : 'JPY_TO_VND'));
  };

  return (
    <>
      {/* Hai ô bên trái, nút đảo chỉ có icon nằm bên phải, giữa hai ô. */}
      <View style={styles.converter}>
        <View style={styles.fields}>
          <TextField
            label={INPUT_LABEL[direction]}
            labelWidth={LABEL_WIDTH}
            value={input}
            onChangeText={t => setInput(formatAmountInput(t))}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />

          <View style={styles.chips}>
            {direction === 'VND_TO_JPY' ? (
              <Chip label="000" onPress={() => setInput(appendThousands)} />
            ) : null}
            {QUICK[direction].map(v => (
              <Chip key={v} label={v} selected={input === v} onPress={() => setInput(v)} />
            ))}
          </View>

          <TextField
            label={RESULT_LABEL[direction]}
            labelWidth={LABEL_WIDTH}
            value={resultText}
            editable={false}
            accessibilityLiveRegion="polite"
          />
        </View>

        <IconButton
          variant="ghost"
          accessibilityLabel={
            direction === 'JPY_TO_VND' ? 'Đổi sang nhập VND' : 'Đổi sang nhập Yên'
          }
          onPress={swap}
          icon={renderSwap}
        />
      </View>

      {spoken && yen !== null ? (
        // Lùi vào thẳng mép trái với hai ô.
        <View style={styles.spoken} accessibilityLiveRegion="polite">
          <Text variant="caption" tone="secondary">
            {`Đọc ${formatJpy(yen)} là`}
          </Text>
          <Text variant="label">{spoken.romaji}</Text>
          <Text variant="caption" tone="secondary">
            {`${spoken.phonetic} • ${spoken.kanji}`}
          </Text>
        </View>
      ) : null}

      <Text variant="caption" tone="secondary">
        {refreshing ? 'Đang tải tỉ giá mới...' : rateLine(rate, live)}
      </Text>

      <YenReadingCard vndPerJpy={rate.vndPerJpy} />
    </>
  );
}

export function CurrencyScreen() {
  const { rate, status, refreshing, refresh } = useExchangeRate();

  const banner =
    status === 'cached' && rate && !refreshing
      ? `Không có mạng • đang dùng tỉ giá lưu lúc ${formatStamp(rate.fetchedAt)}`
      : undefined;

  return (
    <Screen
      title="Đổi tiền"
      headerLeft={<BackButton />}
      // Bấm chip "000" / số nhanh khi bàn phím đang mở: ăn ngay, không đóng bàn phím.
      keyboardShouldPersistTaps="handled"
      headerRight={
        <IconButton
          variant="ghost"
          accessibilityLabel="Tải lại tỉ giá"
          disabled={refreshing}
          onPress={() => {
            refresh();
          }}
          icon={renderRefresh}
        />
      }
      banner={banner ? <Banner message={banner} /> : undefined}
    >
      {rate ? (
        <Converter rate={rate} live={status === 'live'} refreshing={refreshing} />
      ) : status === 'none' ? (
        <ErrorState
          message="Chưa có tỉ giá. Cần có mạng cho lần tải đầu tiên."
          onRetry={() => {
            refresh();
          }}
        />
      ) : (
        <>
          <Skeleton height={48} borderRadius={radius.control} />
          <Skeleton height={48} borderRadius={radius.control} />
          <Skeleton height={96} borderRadius={radius.card} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  converter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fields: { flex: 1, gap: 12 },
  spoken: { marginLeft: LABEL_WIDTH + INLINE_GAP, gap: 2 },
  // Số nhanh thẳng mép trái với ô nhập (lùi qua phần nhãn).
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginLeft: LABEL_WIDTH + INLINE_GAP },
});

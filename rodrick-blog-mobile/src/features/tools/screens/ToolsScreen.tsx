import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ToolsStackParamList } from '../../../navigation/type';
import { Card, Screen, Text, Toast } from '../../../shared/ui';
import { readCachedRate } from '../api/exchangeRate';
import { formatRate } from '../currency';
import { openGoogleTranslate } from '../translate';

type Nav = NativeStackNavigationProp<ToolsStackParamList, 'ToolsMain'>;

function ToolCard({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={title}>
      <View style={styles.body}>
        <Text variant="heading">{title}</Text>
        <Text variant="caption" tone="secondary">
          {description}
        </Text>
      </View>
    </Card>
  );
}

export function ToolsScreen() {
  const navigation = useNavigation<Nav>();
  const [savedRate, setSavedRate] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Đọc lại mỗi lần quay về màn này, để thấy tỉ giá vừa tải ở màn Đổi tiền.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      readCachedRate().then(r => alive && setSavedRate(r?.vndPerJpy ?? null));
      return () => {
        alive = false;
      };
    }, []),
  );

  const translate = async () => {
    if (!(await openGoogleTranslate())) {
      setToast('Không mở được Google Dịch');
    }
  };

  return (
    <View style={styles.root}>
      <Screen title="Công cụ">
        <ToolCard
          title="Đổi tiền"
          description={
            savedRate
              ? `VND ⇄ Yên Nhật • tỉ giá đã lưu 1 ¥ = ${formatRate(
                  savedRate,
                )} ₫`
              : 'VND ⇄ Yên Nhật theo tỉ giá mới nhất, mất mạng vẫn dùng tỉ giá đã lưu.'
          }
          onPress={() => navigation.navigate('Currency')}
        />
        <ToolCard
          title="Dịch"
          description="Mở app Google Dịch (Việt → Nhật), gõ hoặc quét chữ bằng camera ở đó. Tải sẵn gói tiếng Nhật và tiếng Việt ngoại tuyến để dịch khi mất mạng."
          onPress={translate}
        />
      </Screen>
      <Toast
        message={toast ?? ''}
        visible={toast !== null}
        kind="error"
        onDismiss={() => setToast(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, body: { gap: 4 } });

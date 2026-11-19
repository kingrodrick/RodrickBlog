import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Dialog, Screen, Text } from '../../../shared/ui';
import { version } from '../../../../package.json';
import { ThemePicker } from '../components/ThemePicker';
import { UserCard } from '../components/UserCard';

type Props = {
  /** Tên tài khoản đang đăng nhập; navigation truyền vào từ phiên. */
  username: string | null;
  onSignOut: () => void;
};

export function SettingsScreen({ username, onSignOut }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <Screen title="Cài đặt">
      {username ? <UserCard username={username} /> : null}

      <Text variant="overline" tone="secondary">
        Giao diện
      </Text>
      <ThemePicker />

      <Text variant="overline" tone="secondary">
        Tài khoản
      </Text>
      <Button
        title="Đăng xuất"
        variant="danger"
        size="md"
        onPress={() => setConfirming(true)}
      />

      <Text variant="caption" tone="secondary" style={styles.version}>
        Rodrick Blog Mobile · phiên bản {version}
      </Text>

      <Dialog
        visible={confirming}
        title="Đăng xuất?"
        description="Bạn sẽ cần đăng nhập lại để xem lịch trình."
        confirmLabel="Đăng xuất"
        destructive
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onSignOut();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Khe chung của Screen là 12; dòng phiên bản chỉ cách 8.
  version: { textAlign: 'center', marginTop: -4 },
});

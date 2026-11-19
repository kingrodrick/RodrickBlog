import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { Button, PatternBackground, Text, TextField } from '../../../shared/ui';
import { layout, useTheme } from '../../../theme';
import { useAuth } from '../AuthProvider';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const canSubmit = username.trim().length > 0 && password.trim().length > 0;

  const submit = async () => {
    if (loading || !canSubmit) {
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const ok = await signIn(username, password);
      if (!ok) {
        setError('Sai tên đăng nhập hoặc mật khẩu.');
        setLoading(false);
      }
    } catch {
      setError('Không thể đăng nhập, thử lại.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <PatternBackground />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.brand}>
            <View style={[styles.bar, { backgroundColor: colors.accent }]} />
            <Text variant="title" style={styles.name}>
              Rodrick
            </Text>
            <Text tone="secondary" style={styles.lead}>
              Lịch trình và giấy tờ cho mọi chuyến đi.
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Tên đăng nhập"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TextField
              label="Mật khẩu"
              password
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={submit}
              error={error}
            />
            <View style={styles.submit}>
              <Button title="Đăng nhập" onPress={submit} loading={loading} disabled={!canSubmit} />
            </View>
          </View>

          <Text variant="caption" tone="muted" style={styles.hint}>
            Phiên đăng nhập được giữ trên máy, mở app lần sau không cần nhập lại.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenMargin,
    paddingBottom: 48,
  },
  brand: { gap: 8, marginBottom: 40 },
  bar: { width: 32, height: 4, borderRadius: 2, marginBottom: 12 },
  name: { fontSize: 34, lineHeight: 40, letterSpacing: -0.4 },
  lead: { fontSize: 18, lineHeight: 26 },
  form: { gap: 16 },
  submit: { marginTop: 8 },
  hint: { marginTop: 24, textAlign: 'center' },
});
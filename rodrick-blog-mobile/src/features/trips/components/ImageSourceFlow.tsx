import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Sheet, Text, TextField } from '../../../shared/ui';
import { pickImages } from '../../../shared/utils/pickImages';
import { radius, useTheme } from '../../../theme';
import { fromLocal, fromRemote, parseImageUrl, PendingPhoto } from '../photoUpload';
import { ImageBrowserModal } from './ImageBrowserModal';

type Step = 'menu' | 'paste' | 'browse' | null;

type Props = {
  open: boolean;
  /** 'real': chỉ thư viện máy, mở thẳng bộ chọn ảnh. 'ref': thư viện, trình duyệt Pinterest/Google, dán liên kết. */
  kind: 'real' | 'ref';
  /** Số ảnh tối đa khi chọn từ thư viện. */
  limit: number;
  /** Từ khoá tìm ảnh mặc định. */
  query: string;
  onClose: () => void;
  onPicked: (photos: PendingPhoto[]) => void;
  onError: (message: string) => void;
};

function Option({ title, hint, onPress }: { title: string; hint: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.option, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}>
      <Text variant="heading">{title}</Text>
      <Text variant="caption" tone="secondary">
        {hint}
      </Text>
    </Pressable>
  );
}

/** Chọn nguồn ảnh: thư viện máy, trình duyệt trong app (Pinterest/Google) hoặc dán liên kết ảnh. */
export function ImageSourceFlow({ open, kind, limit, query, onClose, onPicked, onError }: Props) {
  const [step, setStep] = useState<Step>(null);
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState<string | undefined>();
  const opened = useRef(false);

  const library = useCallback(async () => {
    setStep(null);
    try {
      const imgs = await pickImages(limit);
      if (imgs.length > 0) {
        onPicked(imgs.map(fromLocal));
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Không mở được thư viện ảnh.');
    }
    onClose();
  }, [limit, onPicked, onError, onClose]);

  useEffect(() => {
    if (open && !opened.current) {
      opened.current = true;
      if (kind === 'real') {
        library();
      } else {
        setStep('menu');
      }
    }
    if (!open) {
      opened.current = false;
      setStep(null);
    }
  }, [open, kind, library]);

  const dismiss = () => {
    setStep(null);
    setLink('');
    setLinkError(undefined);
    onClose();
  };

  const submitLink = () => {
    const url = parseImageUrl(link);
    if (!url) {
      setLinkError('Cần địa chỉ ảnh bắt đầu bằng https://');
      return;
    }
    setLink('');
    setLinkError(undefined);
    setStep(null);
    onPicked([fromRemote(url)]);
    onClose();
  };

  return (
    <>
      <Sheet visible={step === 'menu'} onClose={dismiss} title="Thêm ảnh minh họa">
        <View style={styles.body}>
          <Option title="Thư viện máy" hint="Chọn ảnh từ bộ sưu tập" onPress={library} />
          <Option
            title="Tìm trên Pinterest hoặc Google"
            hint="Mở trình duyệt ngay trong app, chạm giữ ảnh để chọn"
            onPress={() => setStep('browse')}
          />
          <Option title="Dán liên kết ảnh" hint="Địa chỉ ảnh (.jpg, .png, .webp)" onPress={() => setStep('paste')} />
          <Text variant="caption" tone="muted">
            Ảnh từ bên ngoài chỉ dùng làm tham khảo cá nhân.
          </Text>
        </View>
      </Sheet>

      <Sheet visible={step === 'paste'} onClose={dismiss} title="Dán liên kết ảnh">
        <View style={styles.body}>
          <TextField
            label="Địa chỉ ảnh"
            value={link}
            onChangeText={t => {
              setLink(t);
              setLinkError(undefined);
            }}
            error={linkError}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="https://..."
          />
          <Button title="Tiếp tục" onPress={submitLink} />
        </View>
      </Sheet>

      <ImageBrowserModal
        visible={step === 'browse'}
        query={query}
        onClose={dismiss}
        onPick={(img, page) => {
          setStep(null);
          onPicked([fromRemote(img, page)]);
          onClose();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  option: { borderRadius: radius.card, padding: 16, gap: 2 },
});

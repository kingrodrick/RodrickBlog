import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/** Chiều cao bàn phím đang hiện (0 khi ẩn), để đệm đáy các hộp thoại nằm trong Modal. */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { IconButton } from '../../../shared/ui';
import { iconSize, iconStroke } from '../../../theme';

const renderBack = (c: string) => (
  <ChevronLeft
    color={c}
    size={iconSize.control}
    strokeWidth={iconStroke.normal}
    strokeLinecap="round"
  />
);

/** Nút quay lại ở header các màn con của tab Công cụ. */
export function BackButton() {
  const navigation = useNavigation();
  return (
    <IconButton
      variant="ghost"
      accessibilityLabel="Quay lại"
      onPress={() => navigation.goBack()}
      icon={renderBack}
    />
  );
}

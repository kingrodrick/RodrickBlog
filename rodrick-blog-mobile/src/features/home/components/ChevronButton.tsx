import React from 'react';
import { ChevronRight } from 'lucide-react-native';
import { IconButton } from '../../../shared/ui';
import { iconSize, iconStroke } from '../../../theme';

const renderChevron = (c: string) => (
  <ChevronRight
    color={c}
    size={iconSize.control}
    strokeWidth={iconStroke.normal}
    strokeLinecap="round"
  />
);

/** Nút ">" đứng một mình ở mép phải thẻ, vùng chạm 44x44. */
export function ChevronButton({
  accessibilityLabel,
  onPress,
}: {
  accessibilityLabel: string;
  onPress?: () => void;
}) {
  return (
    <IconButton
      variant="ghost"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      icon={renderChevron}
    />
  );
}

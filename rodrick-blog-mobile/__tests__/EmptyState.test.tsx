import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Path } from 'react-native-svg';
import { EmptyState } from '../src/shared/ui';
import { ThemeProvider, palette } from '../src/theme';

test('EmptyState vẽ vòng ensō nét cọ bằng màu chữ mờ', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <ThemeProvider initialMode="light">
        <EmptyState message="Chưa có chuyến đi nào." />
      </ThemeProvider>,
    );
  });
  const path = tree.root.findByType(Path);
  const d: string = path.props.d;
  expect(d.startsWith('M')).toBe(true);
  expect(d.endsWith('Z')).toBe(true);
  expect(d).not.toMatch(/NaN|Infinity/);
  expect(path.props.fill).toBe(palette.light.textMuted);
});

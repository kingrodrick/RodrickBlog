import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, TextInput } from 'react-native';
import { EditEventModal } from '../src/features/trips/components/EditEventModal';
import { NotesView } from '../src/features/trips/components/NotesView';
import { DetailEvent } from '../src/features/trips/types';
import { ThemeProvider } from '../src/theme';

const event: DetailEvent = {
  id: 1,
  day_number: 1,
  trip_date: '2026-12-14',
  start_time: '12:40:00',
  end_time: '13:30:00',
  end_day_offset: 0,
  time_slot: '12:40 - 13:30',
  location_name: 'Ăn trưa tại Kyoto Ramen',
  city: 'Kyoto',
  category_tag: 'FOOD',
  notes: 'Đi bộ 2 phút\n- nước tương\n- hành lá',
  event_maps: [],
  images: [
    { id: 1, cloudinary_url: 'https://res.cloudinary.com/x/image/upload/a.jpg', caption: 'Cửa quán', is_real_photo: false },
    { id: 2, cloudinary_url: 'https://res.cloudinary.com/x/image/upload/b.jpg', caption: 'Ảnh tự chụp', is_real_photo: true },
  ],
  documents: [],
};

const wrap = (node: React.ReactElement) => (
  <SafeAreaProvider
    initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 760 }, insets: { top: 24, left: 0, right: 0, bottom: 0 } }}>
    <ThemeProvider initialMode="light">{node}</ThemeProvider>
  </SafeAreaProvider>
);

const texts = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root.findAllByType(Text).map(t => [t.props.children].flat(3).join(''));

test('hộp thoại Sửa mốc nạp sẵn thông tin và ghi chú của mốc', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      wrap(
        <EditEventModal
          event={event}
          siblings={[event]}
          tripTitle="Nhật Bản"
          visible
          onClose={() => {}}
          onDataChanged={() => {}}
        />,
      ),
    );
  });
  const values = tree.root.findAllByType(TextInput).map(i => i.props.value);
  expect(values).toContain('Ăn trưa tại Kyoto Ramen');
  expect(values).toContain('12:40');
  expect(values).toContain('14/12/2026');
  expect(values).toContain('Đi bộ 2 phút\n- nước tương\n- hành lá');
  expect(texts(tree).some(t => t.includes('1/2'))).toBe(true);
});

test('NotesView vẽ gạch đầu dòng thành "•"', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(wrap(<NotesView notes={event.notes} />));
  });
  const all = texts(tree);
  expect(all.filter(t => t === '•')).toHaveLength(2);
  expect(all).toContain('nước tương');
  expect(all).toContain('Đi bộ 2 phút');
});

test('tab 2 chỉ liệt kê ảnh minh họa (không có ảnh thực tế), có nút sửa và nút thêm', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      wrap(
        <EditEventModal
          event={event}
          siblings={[event]}
          tripTitle="Nhật Bản"
          visible
          onClose={() => {}}
          onDataChanged={() => {}}
        />,
      ),
    );
  });
  const tab2 = tree.root.find(n => n.props.accessibilityLabel === '2/2 Ảnh minh họa' && typeof n.props.onPress === 'function');
  await ReactTestRenderer.act(() => {
    tab2.props.onPress();
  });
  const labels = tree.root.findAll(n => typeof n.props.accessibilityLabel === 'string').map(n => n.props.accessibilityLabel);
  expect(labels).toContain('Sửa ảnh 1');
  // Chỉ một ảnh minh họa; ảnh thực tế (id 2) không hiện ở tab này.
  expect(labels).not.toContain('Sửa ảnh 2');
  expect(labels).toContain('Thêm ảnh minh họa');
  expect(texts(tree)).not.toContain('Thực tế');
});

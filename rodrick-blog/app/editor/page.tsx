import React from 'react';
import type { Metadata } from 'next';
import { EditorView } from '@/components/editor/EditorView';

export const metadata: Metadata = {
  title: 'Biên Tập Hành Trình & Quản Trị • RODRICK BLOG',
  description: 'Trang quản trị dành cho tác giả: thêm chuyến đi mới và cập nhật sự kiện timeline.',
};

export default function EditorPage() {
  return <EditorView />;
}

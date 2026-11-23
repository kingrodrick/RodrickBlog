import React, { useState } from 'react';
import { PendingPhoto } from '../photoUpload';
import { DetailEvent } from '../types';
import { ImageSourceFlow } from './ImageSourceFlow';
import { PhotoUploadSheet } from './PhotoUploadSheet';

type Props = {
  open: boolean;
  kind: 'real' | 'ref';
  event: DetailEvent;
  tripTitle: string;
  onClose: () => void;
  /** Đã thêm xong `count` ảnh vào mốc. */
  onAdded: (count: number) => void;
  onError: (message: string) => void;
};

/** Thêm ảnh vào mốc: chọn nguồn, xem trước và xác nhận, rồi tải lên. Dùng ở trang 3/3 và tab Ảnh của hộp thoại sửa. */
export function AddPhotosFlow({ open, kind, event, tripTitle, onClose, onAdded, onError }: Props) {
  const [pending, setPending] = useState<PendingPhoto[]>([]);

  return (
    <>
      <ImageSourceFlow
        open={open}
        kind={kind}
        limit={10}
        query={event.location_name}
        onClose={onClose}
        onPicked={setPending}
        onError={onError}
      />
      <PhotoUploadSheet
        items={pending}
        isReal={kind === 'real'}
        event={event}
        tripTitle={tripTitle}
        onClose={() => setPending([])}
        onDone={count => {
          setPending([]);
          onAdded(count);
        }}
      />
    </>
  );
}

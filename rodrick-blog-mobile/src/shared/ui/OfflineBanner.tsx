import React from 'react';
import { Banner } from './Banner';

const pad = (n: number) => String(n).padStart(2, '0');

/** Dải báo đang xem bản lưu khi mất mạng; `cachedAt` null thì không hiện gì. */
export function OfflineBanner({ cachedAt }: { cachedAt: number | null | undefined }) {
  if (!cachedAt) {
    return null;
  }
  const d = new Date(cachedAt);
  const at = `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  return <Banner message={`Không có mạng • đang xem dữ liệu lưu lúc ${at}`} />;
}

/** Cho prop `banner` của Screen: chỉ trả element khi thật sự đang xem bản lưu. */
export function offlineBanner(cachedAt: number | null | undefined) {
  return cachedAt ? <OfflineBanner cachedAt={cachedAt} /> : undefined;
}

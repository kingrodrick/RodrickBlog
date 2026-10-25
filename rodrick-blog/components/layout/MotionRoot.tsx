'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    __motionReady?: boolean;
  }
}

/**
 * Cho các phần tử [data-reveal] xuất hiện một lần khi cuộn tới.
 * Theo dõi cả nội dung được render lại (bộ lọc ngày, chuyển trang).
 * Đánh dấu bằng thuộc tính data-in (React không quản lý), không dùng class,
 * vì React ghi đè className mỗi khi trạng thái của phần tử đổi.
 */
export function MotionRoot() {
  const pathname = usePathname();

  useEffect(() => {
    window.__motionReady = true;
    const root = document.documentElement;
    if (!root.hasAttribute('data-motion')) return;

    if (typeof IntersectionObserver === 'undefined') {
      root.removeAttribute('data-motion');
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-in', '');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px' }
    );

    const watch = (scope: ParentNode) => {
      scope.querySelectorAll('[data-reveal]:not([data-in])').forEach((el) => io.observe(el));
    };
    watch(document);

    const mo = new MutationObserver((records) => {
      records.forEach((r) =>
        r.addedNodes.forEach((n) => {
          if (n instanceof Element) {
            if (n.matches('[data-reveal]:not([data-in])')) io.observe(n);
            watch(n);
          }
        })
      );
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}

export default MotionRoot;

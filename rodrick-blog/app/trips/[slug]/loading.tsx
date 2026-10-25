import React from 'react';
import { TicketPerf } from '@/components/ui/Ticket';

export default function TripDetailLoading() {
  return (
    <main className="w-full" aria-busy="true">
      {/* Thanh tiến trình mỏng ở đỉnh màn hình */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-surface overflow-hidden pointer-events-none">
        <div className="h-full w-1/3 bg-accent animate-trip-loading" />
      </div>

      <div className="frame pt-2 pb-4">
        <div className="h-4 w-56 bg-surface" />
      </div>

      {/* Tấm vé và ảnh bìa, cùng bố cục với trang thật */}
      <div className="frame grid gap-3 lg:grid-cols-2 lg:min-h-[min(calc(100svh-var(--bar-h)-3.5rem),52rem)]">
        <div className="order-2 lg:order-1 -mt-6 lg:mt-0 mx-3 lg:mx-0 flex flex-col relative z-10">
          <div className="ticket-main flex-1 p-6 pb-10 sm:p-10 xl:p-14 space-y-6">
            <p className="text-lead">Đang tải lịch trình, chờ xíu nhé.</p>
            <div className="h-14 w-4/5 bg-surface" />
            <div className="h-14 w-3/5 bg-surface" />
          </div>
          <div className="ticket-stub px-6 pt-10 pb-12 sm:px-10 xl:px-14 space-y-3">
            <TicketPerf />
            <div className="h-5 w-full bg-surface" />
            <div className="h-5 w-2/3 bg-surface" />
          </div>
        </div>
        <div className="order-1 lg:order-2 h-[48svh] lg:h-auto bg-surface" />
      </div>

      <div className="frame mt-32 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-4">
          <div className="h-16 w-2/3 bg-surface" />
          {[1, 2, 3].map((item) => (
            <div key={item} className="grid grid-cols-[8.5rem_1fr] gap-8 p-7 bg-paper">
              <div className="h-7 w-20 bg-surface" />
              <div className="space-y-3">
                <div className="h-7 w-3/4 bg-surface" />
                <div className="h-4 w-full bg-surface" />
                <div className="h-4 w-4/5 bg-surface" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden lg:block lg:col-start-8 lg:col-span-5 h-[60svh] bg-surface" />
      </div>
    </main>
  );
}

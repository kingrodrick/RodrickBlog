import React from 'react';

const HOLES = Array.from({ length: 28 });

/** Hàng lỗ đục dọc đường xé, đặt ở đầu cuống vé (.ticket-stub) */
export function TicketPerf() {
  return (
    <div className="ticket-perf" aria-hidden="true">
      {HOLES.map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

export default TicketPerf;

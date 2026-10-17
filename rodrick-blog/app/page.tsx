import { supabase } from '@/lib/supabase';

// Báo cho Next.js 16.4 cho phép truy vấn trực tiếp dữ liệu mới nhất từ Supabase
export const instant = false;

export default async function JapanItineraryBlog() {
  // Truy vấn thẳng vào bảng SQL ngay trong Server Component
  const { data: events, error } = await supabase
    .from('timeline_events')
    .select('*')
    .order('day_number', { ascending: true })
    .order('time_slot', { ascending: true });

  if (error) {
    return <div className="p-8 text-red-500">Lỗi kết nối CSDL: {error.message}</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Phần Header của Blog */}
        <header className="mb-12 border-b border-slate-800 pb-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-sky-400">
            Personal Travel Log
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold mt-2">
            Kế Hoạch Chuyến Đi Nhật Bản (Tháng 12/2026)
          </h1>
          <p className="text-slate-400 mt-2">
            Hành trình khám phá Tokyo & Kyoto • Lưu giữ khoảnh khắc cùng Sony A6400
          </p>
        </header>

        {/* Phần Trục thời gian (Timeline) */}
        <div className="relative border-l-2 border-sky-500/40 ml-3 sm:ml-6 space-y-10">
          {events?.map((item) => (
            <div key={item.id} className="relative pl-6 sm:pl-8 group">
              {/* Chấm tròn đánh dấu trên trục Timeline */}
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-sky-400 group-hover:bg-sky-400 transition-colors" />

              {/* Khung thông tin địa điểm */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg hover:border-slate-700 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Ngày {item.day_number} • {item.time_slot}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    📍 {item.city} ({item.trip_date})
                  </span>
                </div>

                <h2 className="text-xl font-semibold text-white mt-2">
                  {item.location_name}
                </h2>

                {item.notes && (
                  <p className="text-slate-300 mt-2 text-sm leading-relaxed whitespace-pre-line">
                    {item.notes}
                  </p>
                )}

                {/* Hiển thị danh sách ảnh/video nếu có */}
                {item.media_urls && item.media_urls.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {item.media_urls.map((url: string, index: number) => (
                      <img
                        key={index}
                        src={url}
                        alt={item.location_name}
                        className="rounded-lg object-cover w-full h-48 border border-slate-800"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
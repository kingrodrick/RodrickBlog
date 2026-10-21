'use client';

import React, { useMemo } from 'react';

export interface TimelineRouteMapProps {
  mapUrl?: string | null;
  map_embed_url?: string | null;
  mapEmbedUrl?: string | null;
  locationName?: string;
  city?: string;
}

export function TimelineRouteMap({
  mapUrl,
  map_embed_url,
  mapEmbedUrl,
  locationName,
  city,
}: TimelineRouteMapProps) {
  // Nhận linh hoạt giá trị từ database map_embed_url hoặc mapUrl / mapEmbedUrl
  const rawUrl = (map_embed_url || mapEmbedUrl || mapUrl || '').trim();

  // Tạo cụm từ tìm kiếm đầy đủ gồm Địa danh + Thành phố + Nhật Bản
  const fullSearchLocation = useMemo(() => {
    const parts = [locationName?.trim(), city?.trim(), 'Japan'].filter(Boolean);
    return parts.join(', ');
  }, [locationName, city]);

  // Phân tích và tối ưu hóa URL nhúng cho thẻ <iframe>
  const embedSrc = useMemo(() => {
    // 1. Trường hợp người dùng dán toàn bộ đoạn mã nhúng HTML dạng <iframe src="..."></iframe>
    if (rawUrl.includes('<iframe')) {
      const match = rawUrl.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) {
        return match[1];
      }
    }

    // 2. Trường hợp là URL Google Maps trực tiếp
    if (rawUrl.length > 0) {
      // Nếu đã là link Google Maps Embed chính thức
      if (rawUrl.includes('/embed') || rawUrl.includes('output=embed')) {
        return rawUrl;
      }

      // Nếu là link Google Maps thông thường (search, place, dir...)
      if (rawUrl.includes('google.com/maps') || rawUrl.includes('maps.google.com')) {
        const separator = rawUrl.includes('?') ? '&' : '?';
        return `${rawUrl}${separator}output=embed`;
      }

      // Link khác (nếu có)
      return rawUrl;
    }

    // 3. Nếu map_embed_url để trống, tự động tạo URL Google Maps Embed theo tên địa điểm & thành phố
    if (locationName && locationName.trim().length > 0) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(fullSearchLocation)}&output=embed`;
    }

    return null;
  }, [rawUrl, locationName, fullSearchLocation]);

  // URL chỉ đường trực tiếp mở ứng dụng Google Maps (Mobile / Desktop)
  const appDirectionsUrl = useMemo(() => {
    // Nếu có locationName, mở tìm kiếm / dẫn đường tới địa điểm đó
    if (locationName && locationName.trim().length > 0) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullSearchLocation)}`;
    }

    // Nếu người dùng cung cấp sẵn link gốc hợp lệ
    if (rawUrl.startsWith('http')) {
      // Nếu là link embed, chuyển sang link xem thông thường
      return rawUrl.replace('&output=embed', '').replace('?output=embed', '');
    }

    return 'https://www.google.com/maps';
  }, [locationName, fullSearchLocation, rawUrl]);

  // Nếu không có cả URL lẫn tên địa điểm thì không hiển thị
  if (!embedSrc && !locationName) {
    return null;
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[#EFECE4] bg-white shadow-xs mt-3.5 transition-all">
      {/* Header bar: Hiển thị tên điểm mốc & Nút mở ứng dụng */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-[#FAF8F5] border-b border-[#EFECE4]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-2 w-2 rounded-full bg-[#B61C25] shrink-0 animate-pulse" />
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#78756E] font-medium shrink-0">
              Vị trí điểm đến:
            </span>
            <span className="font-serif font-bold text-xs sm:text-sm text-[#1C1B18] truncate">
              📍 {locationName || 'Địa điểm trong lịch trình'}
            </span>
          </div>
        </div>

        {/* Nút bấm dẫn đường: Mở trực tiếp trên App Google Maps */}
        <a
          href={appDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#B61C25] text-white hover:bg-[#98171E] active:scale-[0.98] transition-all shadow-xs shrink-0"
          title={`Mở chỉ đường tới ${locationName || 'địa điểm'} trên ứng dụng Google Maps`}
        >
          <span>Mở Google Maps App</span>
          <span className="text-[11px]">↗</span>
        </a>
      </div>

      {/* Khung bản đồ Google Maps Embed */}
      <div className="w-full h-[250px] sm:h-[270px] relative bg-[#F5F2EB]">
        {embedSrc ? (
          <iframe
            title={`Bản đồ Google Maps cho mốc: ${locationName || ''}`}
            src={embedSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-xs font-mono text-[#78756E]">
            <span>🗺️</span>
            <span>Chưa có thông tin bản đồ định vị</span>
          </div>
        )}
      </div>

      {/* Footer bar: Chú thích chi tiết mốc lịch trình & mẹo di chuyển */}
      <div className="px-4 py-2 bg-[#FAF8F5] border-t border-[#EFECE4] flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans text-[#78756E]">
        <div className="flex items-center gap-1.5">
          <span className="text-[#B61C25] font-semibold">🗾 Nhật Bản:</span>
          <span className="text-[#4A4740] font-medium truncate max-w-[280px] sm:max-w-[420px]">
            {locationName ? `${locationName} • ${city || 'Tokyo'}` : 'Lịch trình du lịch'}
          </span>
        </div>
        <span className="text-[#8C887B] text-[10px] font-mono hidden sm:inline">
          Chạm vào bản đồ để xem chi tiết các tuyến tàu điện & đường đi
        </span>
      </div>
    </div>
  );
}

export default TimelineRouteMap;

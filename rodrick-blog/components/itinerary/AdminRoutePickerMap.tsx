'use client';

import React, { useState, useMemo } from 'react';

export interface AdminRoutePickerMapProps {
  value?: [number, number][] | null;
  onChange?: (coords: [number, number][]) => void;
  initialCity?: string;
  mapEmbedUrl?: string | null;
  onMapEmbedUrlChange?: (url: string) => void;
}

const JAPAN_CITY_PRESETS: { label: string; query: string }[] = [
  { label: 'Tokyo', query: 'Tokyo, Japan' },
  { label: 'Kyoto', query: 'Kyoto, Japan' },
  { label: 'Osaka', query: 'Osaka, Japan' },
  { label: 'Sapporo', query: 'Sapporo, Hokkaido, Japan' },
  { label: 'Hakone', query: 'Hakone, Kanagawa, Japan' },
  { label: 'Nara', query: 'Nara, Japan' },
];

export function AdminRoutePickerMap({
  value,
  onChange,
  initialCity,
  mapEmbedUrl,
  onMapEmbedUrlChange,
}: AdminRoutePickerMapProps) {
  const [origin, setOrigin] = useState('Shinjuku Station, Tokyo');
  const [destination, setDestination] = useState('Meiji Jingu, Tokyo');
  const [waypoints, setWaypoints] = useState<string[]>([]);
  const [searchLocation, setSearchLocation] = useState(initialCity ? `${initialCity}, Japan` : 'Tokyo, Japan');
  const [activeMode, setActiveMode] = useState<'route' | 'single'>('route');

  // Tính toán URL Embed hiển thị trên iframe
  const currentEmbedUrl = useMemo(() => {
    // 1. Nếu có mapEmbedUrl được cấu hình trực tiếp
    if (mapEmbedUrl && mapEmbedUrl.trim().length > 0) {
      const match = mapEmbedUrl.match(/src=["']([^"']+)["']/);
      if (match && match[1]) return match[1];
      if (mapEmbedUrl.includes('/embed') || mapEmbedUrl.includes('output=embed')) {
        return mapEmbedUrl.trim();
      }
      const sep = mapEmbedUrl.includes('?') ? '&' : '?';
      return `${mapEmbedUrl.trim()}${sep}output=embed`;
    }

    // 2. Chế độ Tuyến đường: Điểm đi -> Điểm đến
    if (activeMode === 'route' && origin && destination) {
      const originQuery = encodeURIComponent(origin.trim());
      const destQuery = encodeURIComponent(destination.trim());
      return `https://www.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&output=embed`;
    }

    // 3. Chế độ Một địa điểm
    if (searchLocation) {
      return `https://www.google.com/maps?q=${encodeURIComponent(searchLocation.trim())}&output=embed`;
    }

    return `https://www.google.com/maps?q=Tokyo,Japan&output=embed`;
  }, [mapEmbedUrl, activeMode, origin, destination, searchLocation]);

  // URL mở chỉ đường trực tiếp trên App Google Maps
  const directAppUrl = useMemo(() => {
    if (activeMode === 'route' && origin && destination) {
      const wpParam = waypoints.filter(Boolean).length > 0
        ? `&waypoints=${encodeURIComponent(waypoints.filter(Boolean).join('|'))}`
        : '';
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin.trim())}&destination=${encodeURIComponent(destination.trim())}${wpParam}&travelmode=transit`;
    }

    if (searchLocation) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchLocation.trim())}`;
    }

    return 'https://www.google.com/maps';
  }, [activeMode, origin, destination, waypoints, searchLocation]);

  // Đồng bộ embed url sang state cha nếu có callback
  const handleApplyToEmbedField = () => {
    if (onMapEmbedUrlChange && currentEmbedUrl) {
      onMapEmbedUrlChange(currentEmbedUrl);
    }
  };

  return (
    <div className="w-full space-y-3 font-sans">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#F5F2EB] rounded-xl border border-[#E6E2DA]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveMode('route')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeMode === 'route'
                ? 'bg-white text-[#B61C25] shadow-sm'
                : 'text-[#78756E] hover:text-[#1C1B18]'
            }`}
          >
            🚗 Lộ trình Điểm đi → Điểm đến
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('single')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeMode === 'single'
                ? 'bg-white text-[#B61C25] shadow-sm'
                : 'text-[#78756E] hover:text-[#1C1B18]'
            }`}
          >
            📍 Xem trước Địa điểm
          </button>
        </div>

        {/* Nút kiểm tra mở Google Maps App */}
        <a
          href={directAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white text-[#B61C25] border border-[#E6E2DA] rounded-lg hover:border-[#B61C25] shadow-2xs transition-colors"
          title="Mở trên Google Maps App"
        >
          <span>Mở App Google Maps</span>
          <span className="text-[11px]">↗</span>
        </a>
      </div>

      {/* Form nhập lộ trình */}
      {activeMode === 'route' ? (
        <div className="p-3.5 bg-[#FAF8F5] border border-[#E6E2DA] rounded-xl space-y-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[#4A4740] mb-1">
              Điểm xuất phát:
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="VD: Shinjuku Station, Tokyo"
              className="w-full px-3 py-2 bg-white border border-[#E6E2DA] rounded-lg text-xs outline-none focus:border-[#B61C25]"
            />
          </div>

          {waypoints.map((wp, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={wp}
                onChange={(e) => {
                  const next = [...waypoints];
                  next[idx] = e.target.value;
                  setWaypoints(next);
                }}
                placeholder={`Trạm dừng #${idx + 1}`}
                className="flex-1 px-3 py-1.5 bg-white border border-[#E6E2DA] rounded-lg text-xs outline-none focus:border-[#B61C25]"
              />
              <button
                type="button"
                onClick={() => setWaypoints(waypoints.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700 px-2 py-1 text-xs"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setWaypoints([...waypoints, ''])}
              className="text-[11px] text-[#B61C25] font-semibold hover:underline"
            >
              + Thêm trạm dừng trung gian
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#4A4740] mb-1">
              Điểm đến:
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="VD: Meiji Jingu, Tokyo"
              className="w-full px-3 py-2 bg-white border border-[#E6E2DA] rounded-lg text-xs outline-none focus:border-[#B61C25]"
            />
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-[#FAF8F5] border border-[#E6E2DA] rounded-xl space-y-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[#4A4740] mb-1">
              Tên địa điểm / Tọa độ:
            </label>
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="VD: Sensoji Temple, Asakusa, Tokyo"
              className="w-full px-3 py-2 bg-white border border-[#E6E2DA] rounded-lg text-xs outline-none focus:border-[#B61C25]"
            />
          </div>

          {/* Preset nhanh */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-mono text-[#78756E]">Nhanh:</span>
            {JAPAN_CITY_PRESETS.map((city) => (
              <button
                key={city.label}
                type="button"
                onClick={() => setSearchLocation(city.query)}
                className="px-2 py-1 text-[11px] bg-white border border-[#E6E2DA] hover:border-[#B61C25] hover:text-[#B61C25] rounded transition-colors"
              >
                {city.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Khung xem trước Google Maps Embed iframe (100% Không API Key, Không Scripts lỗi) */}
      <div className="w-full h-[260px] rounded-xl overflow-hidden border border-[#E6E2DA] bg-[#F5F2EB] relative shadow-inner">
        <iframe
          title="Google Maps Embed Preview"
          src={currentEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full"
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-[#78756E] px-1">
        <span>✓ Google Maps Embed iframe miễn phí • Tương thích mọi trình duyệt</span>
        {onMapEmbedUrlChange && (
          <button
            type="button"
            onClick={handleApplyToEmbedField}
            className="text-[#B61C25] font-semibold hover:underline"
          >
            Dùng link này cho bài viết ➔
          </button>
        )}
      </div>
    </div>
  );
}

export default AdminRoutePickerMap;

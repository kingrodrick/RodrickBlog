'use client';

import React, { useState, useMemo, useEffect } from 'react';

export interface AdminRoutePickerMapProps {
  value?: [number, number][] | null;
  onChange?: (coords: [number, number][]) => void;
  initialCity?: string;
  locationName?: string;
  mapEmbedUrl?: string | null;
  onMapEmbedUrlChange?: (url: string) => void;
}

/**
 * Giải mã ngược saddr, daddr, q từ link Google Maps đã lưu
 */
function parseEmbedUrlParams(url?: string | null) {
  if (!url || typeof url !== 'string' || url.trim().length === 0) return null;
  const raw = url.trim();
  const srcMatch = raw.match(/src=["']([^"']+)["']/i);
  const actualUrl = srcMatch ? srcMatch[1] : raw;

  try {
    const urlObj = new URL(actualUrl.startsWith('http') ? actualUrl : `https://${actualUrl}`);
    const saddr = urlObj.searchParams.get('saddr');
    const daddr = urlObj.searchParams.get('daddr');
    const q = urlObj.searchParams.get('q');
    return {
      origin: saddr ? decodeURIComponent(saddr) : null,
      destination: daddr ? decodeURIComponent(daddr) : null,
      query: q ? decodeURIComponent(q) : null,
    };
  } catch {
    const saddrMatch = actualUrl.match(/[?&]saddr=([^&]+)/);
    const daddrMatch = actualUrl.match(/[?&]daddr=([^&]+)/);
    const qMatch = actualUrl.match(/[?&]q=([^&]+)/);
    return {
      origin: saddrMatch ? decodeURIComponent(saddrMatch[1]) : null,
      destination: daddrMatch ? decodeURIComponent(daddrMatch[1]) : null,
      query: qMatch ? decodeURIComponent(qMatch[1]) : null,
    };
  }
}

export function AdminRoutePickerMap({
  initialCity,
  locationName,
  mapEmbedUrl,
  onMapEmbedUrlChange,
}: AdminRoutePickerMapProps) {
  const parsedParams = useMemo(() => parseEmbedUrlParams(mapEmbedUrl), [mapEmbedUrl]);

  // Trạng thái mở/thu gọn panel nhập lộ trình bên phải
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [origin, setOrigin] = useState<string>(() => {
    return parsedParams?.origin || (initialCity ? `Ga ${initialCity}` : 'Ga Tokyo, Japan');
  });

  const [destination, setDestination] = useState<string>(() => {
    return (
      parsedParams?.destination ||
      (locationName
        ? `${locationName}, ${initialCity || 'Japan'}`
        : 'Chùa Kinkaku-ji, Kyoto')
    );
  });

  // Đồng bộ lại khi mapEmbedUrl hoặc locationName từ ngoài truyền vào
  useEffect(() => {
    if (parsedParams) {
      if (parsedParams.origin) setOrigin(parsedParams.origin);
      if (parsedParams.destination) setDestination(parsedParams.destination);
    } else if (locationName && locationName.trim()) {
      setDestination(`${locationName.trim()}, ${initialCity || 'Japan'}`);
    }
  }, [parsedParams, locationName, initialCity]);

  // Tính toán link Embed tự động theo origin và destination
  const currentEmbedUrl = useMemo(() => {
    if (
      mapEmbedUrl &&
      mapEmbedUrl.trim().length > 0 &&
      !mapEmbedUrl.includes('saddr=') &&
      !mapEmbedUrl.includes('daddr=')
    ) {
      const match = mapEmbedUrl.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) return match[1];
      if (mapEmbedUrl.includes('/embed') || mapEmbedUrl.includes('output=embed')) {
        return mapEmbedUrl.trim();
      }
      const sep = mapEmbedUrl.includes('?') ? '&' : '?';
      return `${mapEmbedUrl.trim()}${sep}output=embed`;
    }

    if (origin.trim() && destination.trim()) {
      const originQuery = encodeURIComponent(origin.trim());
      const destQuery = encodeURIComponent(destination.trim());
      return `https://www.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&output=embed`;
    }

    if (destination.trim()) {
      return `https://www.google.com/maps?q=${encodeURIComponent(destination.trim())}&output=embed`;
    }

    return `https://www.google.com/maps?q=${encodeURIComponent(initialCity || 'Tokyo')},Japan&output=embed`;
  }, [mapEmbedUrl, origin, destination, initialCity]);

  // URL mở trực tiếp trên app Google Maps
  const directAppUrl = useMemo(() => {
    if (origin.trim() && destination.trim()) {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin.trim())}&destination=${encodeURIComponent(destination.trim())}&travelmode=transit`;
    }
    if (destination.trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination.trim())}`;
    }
    return 'https://www.google.com/maps';
  }, [origin, destination]);

  // Tự động lưu URL mới sang form cha khi origin hoặc destination thay đổi
  const updateRoute = (newOrigin: string, newDest: string) => {
    setOrigin(newOrigin);
    setDestination(newDest);
    if (onMapEmbedUrlChange && newOrigin.trim() && newDest.trim()) {
      const originQuery = encodeURIComponent(newOrigin.trim());
      const destQuery = encodeURIComponent(newDest.trim());
      onMapEmbedUrlChange(`https://www.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&output=embed`);
    }
  };

  // Nút đảo chiều điểm đi & điểm đến
  const handleSwap = () => {
    updateRoute(destination, origin);
  };

  return (
    <div className="w-full space-y-2.5 font-sans min-w-0">
      {/* 🌟 HEADER: TIÊU ĐỀ BÊN TRÁI & 2 ICON BUTTONS BÊN PHẢI CÙNG DÒNG */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <label className="text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18] flex items-center gap-1.5 shrink-0">
            <span>🗺️</span>
            <span>Trình tạo & Xem trước Bản đồ</span>
          </label>
          {origin.trim() && destination.trim() && !isPanelOpen && (
            <span className="hidden sm:inline font-mono text-[11px] text-stone-500 truncate">
              ({origin} ➔ {destination})
            </span>
          )}
        </div>

        {/* 2 ICON BUTTONS: ĐỔI LỘ TRÌNH & MỞ APP */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Nút Đổi lộ trình: Icon + Title */}
          <button
            type="button"
            onClick={() => setIsPanelOpen((prev) => !prev)}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
              isPanelOpen
                ? 'bg-[#B61C25] text-white border-[#B61C25] shadow-xs scale-105'
                : 'bg-[#FAF8F5] hover:bg-stone-200 text-stone-700 hover:text-black border-[#E6E2DA]'
            }`}
            title={isPanelOpen ? 'Thu gọn bảng đổi lộ trình' : 'Đổi lộ trình (Điểm đi & Điểm đến)'}
          >
            <span className="text-xs font-bold leading-none">
              {isPanelOpen ? '✕' : '✏️'}
            </span>
          </button>

          {/* Nút Mở App Google Maps: Icon + Title */}
          <a
            href={directAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-[#FAF8F5] hover:bg-rose-50 text-stone-700 hover:text-[#B61C25] border border-[#E6E2DA] hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Mở chỉ đường trên ứng dụng Google Maps"
          >
            <span className="text-xs font-bold leading-none">↗</span>
          </a>
        </div>
      </div>

      {/* 🌟 CONTAINER: BẢN ĐỒ THU GỌN THEO CHIỀU NGANG VÀ PANEL BÊN PHẢI TRƯỢT RA THEO TỈ LỆ 7/3 */}
      <div className="w-full flex flex-col md:flex-row gap-3 items-stretch min-w-0">
        {/* KHUNG BẢN ĐỒ GOOGLE MAPS EMBED (Tỉ lệ 7/10 khi mở panel) */}
        <div
          className={`h-[380px] rounded-2xl overflow-hidden border border-[#E6E2DA] bg-[#F5F2EB] shadow-inner transition-all duration-300 ease-in-out ${
            isPanelOpen ? 'w-full md:w-[calc(70%-6px)] min-w-0 shrink-0' : 'w-full'
          }`}
        >
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

        {/* KHUNG NHẬP ĐIỂM ĐI / ĐIỂM ĐẾN BÊN PHẢI (Tỉ lệ 3/10 khi mở panel) */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col min-w-0 ${
            isPanelOpen
              ? 'w-full md:w-[calc(30%-6px)] md:shrink-0 opacity-100 translate-x-0'
              : 'w-0 max-h-0 md:max-h-[380px] opacity-0 translate-x-4 pointer-events-none'
          }`}
        >
          <div className="h-full bg-[#FAF8F5] border border-[#E6E2DA] rounded-2xl p-4 flex flex-col justify-center space-y-4 shadow-2xs w-full min-w-0">
            {/* Header của Panel */}
            <div className="flex items-center justify-between border-b border-[#EFECE4] pb-2.5">
              <span className="font-mono text-xs font-bold text-[#1C1B18] flex items-center gap-1.5">
                <span>🚗</span>
                <span>Lộ trình điểm đi & đến</span>
              </span>
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                className="w-6 h-6 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-black flex items-center justify-center text-xs cursor-pointer transition-colors"
                title="Đóng bảng này"
              >
                ✕
              </button>
            </div>

            {/* Inputs: Điểm xuất phát & Điểm đến */}
            <div className="space-y-3.5">
              {/* Điểm xuất phát */}
              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-stone-600 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full border border-stone-400 bg-white" />
                  <span>Điểm xuất phát:</span>
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => updateRoute(e.target.value, destination)}
                  placeholder="VD: Ga Tokyo, Ga Kyoto..."
                  className="w-full bg-white border border-[#E6E2DA] focus:border-[#B61C25] rounded-xl px-3 py-2 text-xs font-mono text-[#1C1B18] outline-hidden shadow-2xs transition-colors"
                />
              </div>

              {/* Nút Hoán đổi A ⇄ B */}
              <div className="flex justify-center -my-1">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="px-3 py-1 rounded-lg bg-white hover:bg-stone-100 text-stone-600 hover:text-[#B61C25] border border-[#E6E2DA] font-mono text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  title="Đảo chiều điểm xuất phát và điểm đến"
                >
                  <span>⇅</span>
                  <span>Đổi chiều đi</span>
                </button>
              </div>

              {/* Điểm đến */}
              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-stone-600 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B61C25]" />
                  <span>Điểm đến:</span>
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => updateRoute(origin, e.target.value)}
                  placeholder="VD: Chùa Kinkaku-ji, Asakusa..."
                  className="w-full bg-white border border-[#E6E2DA] focus:border-[#B61C25] rounded-xl px-3 py-2 text-xs font-mono text-[#1C1B18] font-bold outline-hidden shadow-2xs transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminRoutePickerMap;

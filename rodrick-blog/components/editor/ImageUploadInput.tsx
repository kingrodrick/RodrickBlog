'use client';

import React, { useState, useRef } from 'react';

interface ImageUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
  aspectRatio?: 'banner' | 'card' | 'photo';
  presets?: Array<{ label: string; url: string }>;
}

export function ImageUploadInput({
  label,
  value,
  onChange,
  helperText,
  aspectRatio = 'banner',
  presets = [
    {
      label: 'Tokyo Mùa Đông',
      url: 'https://res.cloudinary.com/u8kkghp6/image/upload/v1792309640/japan-travel-bg.png',
    },
    {
      label: 'Phố Cổ Kyoto',
      url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop',
    },
    {
      label: 'Núi Phú Sĩ',
      url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop',
    },
    {
      label: 'Đền Fushimi Inari',
      url: 'https://images.unsplash.com/photo-1478436127897-769e00d2c715?q=80&w=1200&auto=format&fit=crop',
    },
  ],
}: ImageUploadInputProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress & convert file to data URL
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG, WebP).');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        setIsLoading(false);
        return;
      }

      // Resize large images via Canvas to keep size light and performant
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1600;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onChange(compressedDataUrl);
        } else {
          onChange(result);
        }
        setIsLoading(false);
      };
      img.onerror = () => {
        onChange(result);
        setIsLoading(false);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const previewHeightClass =
    aspectRatio === 'banner'
      ? 'h-44 sm:h-56'
      : aspectRatio === 'photo'
      ? 'h-48'
      : 'h-36';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] font-mono text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
          >
            ✕ Xóa ảnh
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#F0ECE4] rounded-xl border border-[#E6E2DA] text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer text-center ${
            activeTab === 'upload'
              ? 'bg-white text-[#1C1B18] shadow-xs font-semibold'
              : 'text-[#78756E] hover:text-[#1C1B18]'
          }`}
        >
          📁 Tải file từ máy
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer text-center ${
            activeTab === 'url'
              ? 'bg-white text-[#1C1B18] shadow-xs font-semibold'
              : 'text-[#78756E] hover:text-[#1C1B18]'
          }`}
        >
          🔗 Nhập URL ảnh
        </button>
        {presets.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer text-center ${
              activeTab === 'presets'
                ? 'bg-white text-[#1C1B18] shadow-xs font-semibold'
                : 'text-[#78756E] hover:text-[#1C1B18]'
            }`}
          >
            ✨ Ảnh mẫu
          </button>
        )}
      </div>

      {/* Tab 1: File Upload */}
      {activeTab === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#B93829] bg-rose-50/50'
              : 'border-[#E6E2DA] hover:border-[#B93829]/60 bg-white hover:bg-[#FAF8F5]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-rose-50 text-[#B93829] flex items-center justify-center text-lg">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#B93829] border-t-transparent rounded-full animate-spin" />
              ) : (
                '📷'
              )}
            </div>
            <div>
              <p className="text-xs font-sans font-medium text-[#1C1B18]">
                {isLoading
                  ? 'Đang nén & tối ưu ảnh...'
                  : 'Bấm để chọn ảnh từ máy hoặc kéo thả vào đây'}
              </p>
              <p className="text-[10px] font-mono text-[#78756E] mt-0.5">
                Hỗ trợ JPG, PNG, WebP (Tự động tối ưu dung lượng)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: URL Input */}
      {activeTab === 'url' && (
        <div className="space-y-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://res.cloudinary.com/... hoặc link ảnh bất kỳ"
            className="w-full bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
          />
          <p className="text-[10px] font-mono text-[#78756E]">
            Mẹo: Bạn có thể dán liên kết ảnh từ Cloudinary, Imgur, Unsplash...
          </p>
        </div>
      )}

      {/* Tab 3: Presets */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(preset.url)}
              className={`group relative rounded-xl overflow-hidden border p-1 text-left transition-all cursor-pointer ${
                value === preset.url
                  ? 'border-[#B93829] ring-2 ring-[#B93829]/20 bg-rose-50'
                  : 'border-[#E6E2DA] hover:border-[#B93829]/50 bg-white'
              }`}
            >
              <div className="h-16 w-full rounded-lg overflow-hidden bg-[#F3F0EA]">
                <img
                  src={preset.url}
                  alt={preset.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <p className="text-[10px] font-mono font-medium text-[#1C1B18] truncate mt-1 text-center">
                {preset.label}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Live Preview of Selected Image */}
      {value && (
        <div className="relative rounded-2xl overflow-hidden border border-[#E6E2DA] shadow-xs group bg-[#F3F0EA]">
          <div className={`relative ${previewHeightClass} w-full`}>
            <img
              src={value}
              alt="Ảnh xem trước"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[10px] font-mono">
              <span className="bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
                ✓ Đã tải ảnh thành công
              </span>
              <button
                type="button"
                onClick={() => onChange('')}
                className="bg-rose-600/90 hover:bg-rose-700 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                Đổi ảnh khác
              </button>
            </div>
          </div>
        </div>
      )}

      {helperText && (
        <p className="text-[11px] font-mono text-[#78756E]">{helperText}</p>
      )}
    </div>
  );
}

export default ImageUploadInput;

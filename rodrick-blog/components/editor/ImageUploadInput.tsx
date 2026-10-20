'use client';

import React, { useState, useRef, useEffect } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface ImageUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
  aspectRatio?: 'banner' | 'card' | 'photo';
  presets?: Array<{ label: string; url: string }>;
  folder?: string;
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
  folder,
}: ImageUploadInputProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isConvertingBase64, setIsConvertingBase64] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const targetFolder = folder || 'trips';

  // Nén ảnh sang Base64 trong trường hợp khẩn cấp nếu người dùng chọn
  const compressImageToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (!result) return resolve('');

        const img = new Image();
        img.onload = () => {
          const maxWidth = 1400;
          const maxHeight = 1000;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            resolve(result);
          }
        };
        img.onerror = () => resolve(result);
        img.src = result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Tải file trực tiếp lên Cloudinary với thư mục chỉ định
  const processFile = async (file: File | Blob) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG, WebP).');
      return;
    }

    setUploadError(null);
    setIsLoading(true);
    setUploadProgressText(`Đang tải ảnh lên Cloudinary (${targetFolder})...`);

    try {
      const cloudUrl = await uploadToCloudinary(file, targetFolder);
      onChange(cloudUrl);
      setUploadError(null);
    } catch (cloudErr: any) {
      const errorMsg =
        cloudErr?.message ||
        'Không thể tải ảnh lên Cloudinary. Vui lòng kiểm tra lại cấu hình hoặc kết nối mạng.';
      console.error('Lỗi khi tải ảnh lên Cloudinary:', cloudErr);
      setUploadError(errorMsg);
    } finally {
      setIsLoading(false);
      setUploadProgressText('');
    }
  };

  // Chuyển đổi ảnh Base64 hiện có sang Cloudinary chỉ với 1 click
  const handleConvertBase64ToCloudinary = async () => {
    if (!value || !value.startsWith('data:image/')) return;

    try {
      setIsConvertingBase64(true);
      setUploadError(null);

      // Chuyển data URL sang Blob
      const parts = value.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });

      const cloudUrl = await uploadToCloudinary(blob, targetFolder);
      onChange(cloudUrl);
    } catch (err: any) {
      console.error('Lỗi khi chuyển Base64 lên Cloudinary:', err);
      setUploadError(
        `Không thể chuyển ảnh lên Cloudinary: ${err?.message || 'Lỗi không xác định'}`
      );
    } finally {
      setIsConvertingBase64(false);
    }
  };

  // Cho phép lưu khẩn cấp dạng Base64 khi Cloudinary có sự cố
  const handleEmergencySaveBase64 = async (file: File) => {
    try {
      setIsLoading(true);
      const base64 = await compressImageToBase64(file);
      onChange(base64);
      setUploadError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
      e.target.value = '';
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

  // Hỗ trợ dán ảnh qua Ctrl + V
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Chỉ kích hoạt khi đang ở tab upload
      if (activeTab !== 'upload') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab, targetFolder]);

  const previewHeightClass =
    aspectRatio === 'banner'
      ? 'h-48 sm:h-64'
      : aspectRatio === 'photo'
      ? 'h-48'
      : 'h-36';

  const isCloudinary = Boolean(value && value.includes('cloudinary.com'));
  const isBase64 = Boolean(value && value.startsWith('data:image/'));
  const isExternalUrl = Boolean(value && !isCloudinary && !isBase64 && value.startsWith('http'));

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setUploadError(null);
            }}
            className="text-[11px] font-mono text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
          >
            ✕ Xóa ảnh
          </button>
        )}
      </div>

      {/* Target Cloudinary Folder Breadcrumb */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#FAF8F5] border border-[#E6E2DA] rounded-xl text-[11px] font-mono text-[#78756E]">
        <span className="flex items-center gap-1.5 truncate">
          <span>📁 Thư mục Cloudinary:</span>
          <span className="font-semibold text-[#1C1B18] bg-white px-2 py-0.5 rounded-md border border-[#E6E2DA]">
            {targetFolder}/
          </span>
        </span>
        <span className="text-[10px] text-[#A8A29E] hidden sm:inline">
          Đặt tên tự động bằng timestamp
        </span>
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
          📁 Tải file / Dán Ctrl+V
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

      {/* Error Banner */}
      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-sans space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 font-bold text-rose-800">
            <span>⚠️ Tải ảnh lên Cloudinary thất bại:</span>
          </div>
          <p className="leading-relaxed font-mono text-[11px] text-rose-700">{uploadError}</p>
        </div>
      )}

      {/* Tab 1: File Upload */}
      {activeTab === 'upload' && (
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#B93829] bg-rose-50/60 scale-[1.01]'
              : 'border-[#E6E2DA] hover:border-[#B93829]/60 bg-white hover:bg-[#FAF8F5]'
          } ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="space-y-2">
            <div className="w-11 h-11 mx-auto rounded-full bg-rose-50 text-[#B93829] flex items-center justify-center text-xl shadow-xs">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#B93829] border-t-transparent rounded-full animate-spin" />
              ) : (
                '📷'
              )}
            </div>
            <div>
              <p className="text-xs font-sans font-medium text-[#1C1B18]">
                {isLoading ? (
                  <span className="font-mono text-[#B93829] font-semibold">
                    {uploadProgressText || 'Đang tải ảnh lên Cloudinary...'}
                  </span>
                ) : (
                  <>Bấm để chọn file ảnh, kéo thả hoặc bấm <kbd className="px-1.5 py-0.5 rounded-sm bg-[#F0ECE4] border border-[#E6E2DA] font-mono text-[10px] text-[#1C1B18]">Ctrl + V</kbd> để dán</>
                )}
              </p>
              <p className="text-[10px] font-mono text-[#78756E] mt-1">
                Tự động lưu vào Cloudinary thư mục{' '}
                <span className="font-semibold text-[#1C1B18]">{targetFolder}/</span>
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
            onChange={(e) => {
              onChange(e.target.value);
              setUploadError(null);
            }}
            placeholder="https://res.cloudinary.com/... hoặc link ảnh bất kỳ"
            className="w-full bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
          />
          <p className="text-[10px] font-mono text-[#78756E]">
            Mẹo: Dán trực tiếp URL ảnh từ Cloudinary Media Explorer hoặc bất kỳ nguồn ảnh nào.
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
              onClick={() => {
                onChange(preset.url);
                setUploadError(null);
              }}
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
              alt="Ảnh bìa xem trước"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

            {/* Top Status Badge */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              {isCloudinary && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-600/90 backdrop-blur-xs text-white font-mono text-[10px] px-2.5 py-1 rounded-md shadow-xs font-medium">
                  <span>☁️</span>
                  <span>Đã lưu trên Cloudinary</span>
                </span>
              )}
              {isBase64 && (
                <span className="inline-flex items-center gap-1.5 bg-amber-600/95 backdrop-blur-xs text-white font-mono text-[10px] px-2.5 py-1 rounded-md shadow-xs font-medium">
                  <span>⚠️</span>
                  <span>Ảnh Base64 cục bộ (Chưa lưu trên Cloudinary)</span>
                </span>
              )}
              {isExternalUrl && (
                <span className="inline-flex items-center gap-1.5 bg-stone-800/85 backdrop-blur-xs text-white font-mono text-[10px] px-2.5 py-1 rounded-md shadow-xs font-medium">
                  <span>🔗</span>
                  <span>Link ảnh bên ngoài</span>
                </span>
              )}

              {/* View full link if available */}
              {isCloudinary && (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black/50 hover:bg-black/75 text-white text-[10px] font-mono px-2 py-1 rounded-md backdrop-blur-xs transition-colors cursor-pointer"
                >
                  Mở ảnh gốc ↗
                </a>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 text-white text-[11px] font-mono">
              <div className="flex items-center gap-2">
                {isBase64 && (
                  <button
                    type="button"
                    onClick={handleConvertBase64ToCloudinary}
                    disabled={isConvertingBase64 || isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isConvertingBase64 ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang chuyển lên Cloudinary...</span>
                      </>
                    ) : (
                      <>
                        <span>☁️</span>
                        <span>Chuyển lên Cloudinary ngay</span>
                      </>
                    )}
                  </button>
                )}
                {isCloudinary && (
                  <span className="text-[10px] font-mono text-emerald-200 bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    ✓ Link CDN Cloudinary sẵn sàng
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('upload');
                    fileInputRef.current?.click();
                  }}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[10px]"
                >
                  Đổi ảnh khác
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setUploadError(null);
                  }}
                  className="bg-rose-600/90 hover:bg-rose-700 px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[10px]"
                >
                  Xóa
                </button>
              </div>
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

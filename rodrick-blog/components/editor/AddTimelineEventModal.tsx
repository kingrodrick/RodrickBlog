'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TimelineEventForm } from './TimelineEventForm';
import { TimelineEvent } from '@/types/database.type';

interface AddTimelineEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  onEventCreated: (newEvent: TimelineEvent) => void;
  onOpenSqlModal?: () => void;
  existingDates?: string[];
  defaultCity?: string;
  defaultDate?: string;
  availableCities?: string[];
}

export function AddTimelineEventModal({
  isOpen,
  onClose,
  tripId,
  onEventCreated,
  onOpenSqlModal,
  existingDates,
  defaultCity,
  defaultDate,
  availableCities,
}: AddTimelineEventModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleCreated = (newEvent: TimelineEvent) => {
    onEventCreated(newEvent);
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card with Max Height & Internal Scroll */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[90vh] bg-white border border-[#E6E2DA] rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5 border-b border-[#F0ECE4] bg-white shrink-0">
          <div>
            
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1B18] mt-0.5">
              Thêm Sự Kiện Vào Timeline
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSqlModal && (
              <button
                type="button"
                onClick={onOpenSqlModal}
                className="hidden sm:flex text-xs font-mono text-[#B93829] hover:text-[#1C1B18] bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all items-center gap-1.5 cursor-pointer"
              >
                <span>⚡ SQL Supabase</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-stone-200 text-stone-600 hover:text-black flex items-center justify-center shadow-xs border border-[#E6E2DA] cursor-pointer text-sm font-bold transition-all hover:scale-105"
              title="Đóng (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-6">
          <TimelineEventForm
            initialTripId={tripId}
            onEventCreated={handleCreated}
            onOpenSqlModal={onOpenSqlModal}
            hideHeader={true}
            hideTripSelector={true}
            existingDates={existingDates}
            defaultCity={defaultCity}
            defaultDate={defaultDate}
            availableCities={availableCities}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AddTimelineEventModal;

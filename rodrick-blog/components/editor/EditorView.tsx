'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { TripForm } from './TripForm';
import { TimelineEventForm } from './TimelineEventForm';
import { TripsManager } from './TripsManager';
import { SqlInstructionModal } from './SqlInstructionModal';
import { Trip } from '@/types/database.type';

type TabKey = 'new-trip' | 'new-event' | 'manage-trips';

export function EditorView() {
  const router = useRouter();
  const { isLoggedIn, isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('new-trip');
  const [targetTripIdForEvent, setTargetTripIdForEvent] = useState<number | undefined>(undefined);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Strict Protection: If not logged in, immediately redirect to Home
  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace('/');
    }
  }, [isAuthLoading, isLoggedIn, router]);

  // When a new trip is created in Tab 1, we can suggest switching to Tab 2
  const handleTripCreated = (newTrip: Trip) => {
    setTargetTripIdForEvent(newTrip.id);
  };

  // When user clicks "Thêm sự kiện" from TripsManager
  const handleSelectTripToAddEvent = (tripId: number) => {
    setTargetTripIdForEvent(tripId);
    setActiveTab('new-event');
  };

  // While checking session from localStorage
  if (isAuthLoading) {
    return (
      <div className="w-full bg-[#FAF8F5] min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-[#B93829]/20 border-t-[#B93829] rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-wider text-[#78756E]">
          Đang kiểm tra quyền biên tập...
        </p>
      </div>
    );
  }

  // If not logged in, block view completely while redirecting
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="w-full bg-[#FAF8F5] text-[#1C1B18] min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">

        {/* Editor Tab Navigation */}
        <div className="flex items-center gap-2 p-1.5 bg-[#F0ECE4] rounded-2xl border border-[#E6E2DA] overflow-x-auto text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('new-trip')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
              activeTab === 'new-trip'
                ? 'bg-white text-[#1C1B18] shadow-sm font-bold border border-[#E6E2DA]'
                : 'text-[#78756E] hover:text-[#1C1B18]'
            }`}
          >
            <span>✈️</span>
            <span>Thêm Chuyến Du Lịch Mới</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new-event')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
              activeTab === 'new-event'
                ? 'bg-white text-[#1C1B18] shadow-sm font-bold border border-[#E6E2DA]'
                : 'text-[#78756E] hover:text-[#1C1B18]'
            }`}
          >
            <span>⏱️</span>
            <span>Thêm Sự Kiện Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manage-trips')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
              activeTab === 'manage-trips'
                ? 'bg-white text-[#1C1B18] shadow-sm font-bold border border-[#E6E2DA]'
                : 'text-[#78756E] hover:text-[#1C1B18]'
            }`}
          >
            <span>📋</span>
            <span>Danh Sách Chuyến Đi</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'new-trip' && (
          <TripForm
            onTripCreated={handleTripCreated}
            onOpenSqlModal={() => setIsSqlModalOpen(true)}
          />
        )}

        {activeTab === 'new-event' && (
          <TimelineEventForm
            initialTripId={targetTripIdForEvent}
            onOpenSqlModal={() => setIsSqlModalOpen(true)}
          />
        )}

        {activeTab === 'manage-trips' && (
          <TripsManager
            onSelectTripToAddEvent={handleSelectTripToAddEvent}
            onOpenSqlModal={() => setIsSqlModalOpen(true)}
          />
        )}
      </div>

      {/* SQL Configuration Modal */}
      <SqlInstructionModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </div>
  );
}

export default EditorView;

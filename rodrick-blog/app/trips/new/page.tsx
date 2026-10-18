'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { TripForm } from '@/components/editor/TripForm';
import { Trip } from '@/types/database.type';

export default function NewTripPage() {
  const router = useRouter();
  const { isLoggedIn, isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace('/trips');
    }
  }, [isAuthLoading, isLoggedIn, router]);

  if (isAuthLoading) {
    return (
      <div className="w-full bg-[#FAF8F5] min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-[#B93829]/20 border-t-[#B93829] rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-wider text-[#78756E]">
          Đang kiểm tra quyền tác giả...
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  const handleTripCreated = (newTrip: Trip) => {
    // Navigate straight to the detail screen of the created trip
    router.push(`/trips/${newTrip.slug}`);
  };

  return (
    <div className="w-full bg-[#FAF8F5] text-[#1C1B18] min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[#78756E]">
          <Link href="/" className="hover:text-[#B93829] transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/trips" className="hover:text-[#B93829] transition-colors">
            Tất cả chuyến đi
          </Link>
          <span>/</span>
          <span className="text-[#1C1B18] font-semibold">Thêm chuyến du lịch</span>
        </nav>

        {/* Trip Creation Form */}
        <TripForm onTripCreated={handleTripCreated} />
      </div>
    </div>
  );
}

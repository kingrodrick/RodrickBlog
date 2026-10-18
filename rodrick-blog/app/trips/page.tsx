import React from 'react';
import type { Metadata } from 'next';
import { ItineraryService } from '@/services/itinerary.service';
import { TripsGridPage } from '@/components/itinerary/TripsGridPage';

export const metadata: Metadata = {
  title: 'Tất Cả Các Chuyến Đi • RODRICK BLOG',
  description: 'Danh sách toàn bộ các hành trình du lịch, kế hoạch chi tiết từng ngày và bộ sưu tập ảnh Sony A6400.',
};

export const instant = false;

export default async function TripsPage() {
  const trips = await ItineraryService.getAllTrips();

  return <TripsGridPage initialTrips={trips} />;
}

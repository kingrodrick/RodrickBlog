export type { Trip, TripEvent, TripStatus } from '../../shared/api/trips';

export type Album = {
  id: string;
  title: string;
  coverUrl?: string;
  kind: 'real' | 'reference';
};

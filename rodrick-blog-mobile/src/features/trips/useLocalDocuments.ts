import { useCallback, useEffect, useState } from 'react';
import { listLocalDocuments, LocalDocument } from '../../shared/api/localDocuments';

/** Giấy tờ của một mốc, đọc từ kho cục bộ trên máy. */
export function useLocalDocuments(eventId: number) {
  const [docs, setDocs] = useState<LocalDocument[]>([]);
  const reload = useCallback(() => {
    listLocalDocuments(eventId).then(setDocs, () => setDocs([]));
  }, [eventId]);
  useEffect(reload, [reload]);
  return { docs, reload };
}

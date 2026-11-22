import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

/**
 * Prayer times for the board. The feed only changes daily, so we poll gently
 * (every 30 minutes) and keep serving the previous payload while refetching —
 * the screen must never flash empty.
 */
export function usePrayerTimes(localDate: string) {
  const previousDate = useRef(localDate);
  const query = useQuery(
    orpc.prayer.times.queryOptions({
      input: {},
      staleTime: 30 * 60 * 1000,
      refetchInterval: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 5,
      retryDelay: (attempt) => Math.min(30_000, 2000 * 2 ** attempt),
      placeholderData: (previous) => previous,
    }),
  );
  const { refetch } = query;
  useEffect(() => {
    if (previousDate.current !== localDate) {
      previousDate.current = localDate;
      void refetch();
    }
  }, [localDate, refetch]);
  return query;
}

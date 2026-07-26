"use client";

import type { FC, PropsWithChildren } from "react";
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { ActivityHeatmapContext } from "@/components/context/activity-heatmap";
import {
  buildActivityHeatmap,
  calendarYearRange,
  CURRENT_YEAR,
  parseLocalDateKey,
} from "@/lib/activity-heatmap";

// Owns year selection and the daily-activity fetch, so every visualizer that
// reads from useActivityHeatmap() (the grid, the year picker, the category
// breakdown) shares one query and one notion of "which year is showing" -
// keepPreviousData + the lagged displayYear avoid pairing stale data with a
// new date range for a single render when switching years.
export const ActivityHeatmapProvider: FC<PropsWithChildren> = ({ children }) => {
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [displayYear, setDisplayYear] = useState(CURRENT_YEAR);
  const range = useMemo(() => calendarYearRange(selectedYear), [selectedYear]);
  const displayRange = useMemo(() => calendarYearRange(displayYear), [displayYear]);

  const { data, isError, isFetching, isPending } = useQuery({
    ...queryKeys.statistics.dailyActivity(timezone, range.start, range.end),
    placeholderData: keepPreviousData,
    retry: false,
  });

  // Adjusted during render rather than in an effect: an effect would commit
  // one render where the new year's `data` is already in but `displayYear`
  // (and thus displayRange) is still the old year, flashing the grid empty
  // before the effect catches up. Updating state directly in the render body
  // is the same instant the mismatch would otherwise happen, so React
  // re-renders with the corrected value before anything is painted.
  if (!isFetching && displayYear !== selectedYear) {
    setDisplayYear(selectedYear);
  }

  const { monthLabels, weeks } = useMemo(
    () =>
      buildActivityHeatmap(
        (data ?? []).map((point) => ({
          date: parseLocalDateKey(point.date),
          minutes: point.minutes,
          sessionCount: point.session_count,
        })),
        displayRange,
      ),
    [data, displayRange],
  );

  const totalMinutes = useMemo(
    () => (data ?? []).reduce((acc, point) => acc + point.minutes, 0),
    [data],
  );

  return (
    <ActivityHeatmapContext
      value={{
        displayYear,
        isError,
        isFetching,
        isPending,
        monthLabels,
        selectedYear,
        setSelectedYear,
        totalMinutes,
        weeks,
      }}
    >
      {children}
    </ActivityHeatmapContext>
  );
};

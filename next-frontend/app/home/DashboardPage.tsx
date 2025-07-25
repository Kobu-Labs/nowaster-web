"use client";

import { FilteredSessionAreaChart } from "@/components/visualizers/sessions/charts/FilteredSessionAreaChart";
import { CurrentStreakKpiCard } from "@/components/visualizers/sessions/kpi/CurrentStreakKpiCard";
import { TotalSessionTimeKpiCard } from "@/components/visualizers/sessions/kpi/TotalMinutesSpentKpiCard";
import { TotalSessionsKpiCard } from "@/components/visualizers/sessions/kpi/TotalSessionsKpiCard";
import { FilterContextProvider } from "@/components/visualizers/sessions/SessionFilterContextProvider";
import { FilteredSessionTimeline } from "@/components/visualizers/sessions/timeline/FilteredSessionTimeline";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import { addHours, subHours } from "date-fns";
import { useMemo } from "react";

export default function DashboardPage() {
  const timelineFilter: SessionFilterPrecursor = useMemo(
    () => ({
      settings: {},
      data: {
        endTimeFrom: { value: subHours(new Date(), 20) },
        endTimeTo: { value: addHours(new Date(), 1) },
      },
    }),
    [],
  );

  return (
    <div className="flex grow flex-col p-4 md:p-8 gap-4 md:gap-8">
      <h2 className="mb-8 text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        <TotalSessionsKpiCard />
        <TotalSessionTimeKpiCard />
        <CurrentStreakKpiCard />
      </div>
      <FilterContextProvider initialFilter={timelineFilter}>
        <FilteredSessionTimeline />
      </FilterContextProvider>
      <FilterContextProvider>
        <FilteredSessionAreaChart
          initialGranularity="days-in-month"
          className="col-span-full h-[400px]"
        />
      </FilterContextProvider>
    </div>
  );
}

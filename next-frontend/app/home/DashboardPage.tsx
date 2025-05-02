"use client";

import { FilteredSessionAreaChart } from "@/components/visualizers/sessions/charts/FilteredSessionAreaChart";
import { CurrentStreakKpiCard } from "@/components/visualizers/sessions/kpi/CurrentStreakKpiCard";
import { TotalSessionTimeKpiCard } from "@/components/visualizers/sessions/kpi/TotalMinutesSpentKpiCard";
import { TotalSessionsKpiCard } from "@/components/visualizers/sessions/kpi/TotalSessionsKpiCard";
import { IntervaledSessionTimeline } from "@/components/visualizers/sessions/timeline/IntervaledSessionTimeline";
import { subHours } from "date-fns";
import { useMemo } from "react";

export default function DashboardPage() {
  const filter = useMemo(
    () => ({
      startDate: subHours(new Date(), 24),
      endDate: new Date(),
    }),
    [],
  );

  return (
    <div className="flex grow flex-col p-8">
      <h2 className="mb-8 text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="flex gap-8 ">
        <TotalSessionsKpiCard />
        <TotalSessionTimeKpiCard />
        <CurrentStreakKpiCard />
      </div>
      <div className="mt-8 h-fit">
        <IntervaledSessionTimeline
          startDate={filter.startDate}
          endDate={filter.endDate}
        />
      </div>
      <div className="mt-8 grid grow gap-8 md:grid-cols-2 lg:grid-cols-7">
        <FilteredSessionAreaChart
          initialGranularity="days-in-month"
          className="col-span-full h-[400px]"
        />
      </div>
    </div>
  );
}

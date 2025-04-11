"use client";

import { FilteredSessionAreaChart } from "@/components/visualizers/charts/FilteredSessionAreaChart";
import { CurrentStreakKpiCard } from "@/components/visualizers/CurrentStreakKpiCard";
import { IntervaledSessionTimeline } from "@/components/visualizers/sessions/IntervaledSessionTimeline";
import { TotalSessionTimeKpiCard } from "@/components/visualizers/TotalMinutesSpentKpiCard";
import { TotalSessionsKpiCard } from "@/components/visualizers/TotalSessionsKpiCard";
import { subHours } from "date-fns";
import { useMemo } from "react";

export default function IndexPage() {
  const filter = useMemo(
    () => ({
      startDate: subHours(new Date(), 48),
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

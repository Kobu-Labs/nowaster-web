"use client";

import { FilteredSessionAreaChart } from "@/components/visualizers/charts/FilteredSessionAreaChart";
import { TotalSessionsKpiCard } from "@/components/visualizers/TotalSessionsKpiCard";
import { CurrentStreakKpiCard } from "@/components/visualizers/CurrentStreakKpiCard";
import { TotalSessionTimeKpiCard } from "@/components/visualizers/TotalMinutesSpentKpiCard";

export default function IndexPage() {
  return (
    <div className="flex grow flex-col p-8">
      <h2 className="mb-8 text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="flex gap-8 ">
        <TotalSessionsKpiCard />
        <TotalSessionTimeKpiCard />
        <CurrentStreakKpiCard />
      </div>
      <div className="mt-8 grid grow gap-8 md:grid-cols-2 lg:grid-cols-7">
        <FilteredSessionAreaChart
          initialGranularity="days-in-month"
          className="col-span-full"
        />
      </div>
    </div>
  );
}
